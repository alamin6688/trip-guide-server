import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { prisma } from "../../shared/prisma";
import { Listing, Prisma } from "@prisma/client";
import { IAuthUser } from "../../types/common";
import {
  IPaginationOptions,
  paginationHelper,
} from "../../helper/paginationHelper";
import { createListingInput, updateListingInput } from "./listings.interface";

const createListing = async (
  user: NonNullable<IAuthUser>,
  payload: createListingInput
): Promise<Listing> => {
  // Resolve guideId: use authenticated user's guideId or payload.guideId if Admin
  const guideId = user.guideId || (user.role === "ADMIN" ? payload.guideId : null);

  if (!guideId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only guides can create listings, or Admin must provide a valid guideId"
    );
  }

  // Category permission check
  const validCategory = await prisma.guideCategories.findFirst({
    where: {
      guideId: guideId,
      // categoryId: payload.categoryId,
    },
  });

  // if (!validCategory) {
  //   console.log(validCategory,"user.guideId");
  //   throw new ApiError(
  //     httpStatus.FORBIDDEN,
  //     "You are not allowed to create listings in this category"
  //   );
  // }

  //  Duplicate prevention
  const existingListing = await prisma.listing.findFirst({
    where: {
      guideId: guideId,
      title: payload.title,
      city: payload.city,
      isActive: true,
      isDeleted: false,
    },
  });

  // Prevention aleart
  if (existingListing) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "You already have an active listing with the same title in this city"
    );
  }

  return prisma.listing.create({
    data: {
      guideId: guideId,
      categoryId: payload.categoryId,
      title: payload.title,
      description: payload.description,
      itinerary: payload.itinerary,
      price: payload.price,
      durationHours: payload.durationHours,
      meetingPoint: payload.meetingPoint,
      maxGroupSize: payload.maxGroupSize,
      images: payload.images,
      languages: payload.languages,
      city: payload.city,
    },
  });
};

const getAllFromDB = async (filters: any, options: IPaginationOptions) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { search, minPrice, maxPrice, languages, duration, ...filterData } = filters;
  const andConditions: Prisma.ListingWhereInput[] = [];

  // Search (Title or City)
  if (search) {
    andConditions.push({
      OR: [
        { title: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
        { city: { contains: search, mode: "insensitive" as Prisma.QueryMode } },
      ],
    });
  }

  // Price Range
  if (minPrice !== undefined) {
    andConditions.push({ price: { gte: Number(minPrice) } });
  }
  if (maxPrice !== undefined) {
    andConditions.push({ price: { lte: Number(maxPrice) } });
  }

  // Languages (Overlap)
  if (languages) {
    const langs = typeof languages === "string" ? languages.split(",") : languages;
    if (langs.length > 0) {
      andConditions.push({ languages: { hasSome: langs } });
    }
  }

  // Duration Mapping logic
  if (duration) {
    const durationStrings = typeof duration === "string" ? duration.split(",") : Array.isArray(duration) ? duration : [duration];
    const durationQueries = [];

    for (const d of durationStrings) {
      if (d === "< 2 hours") {
        durationQueries.push({ durationHours: { lt: 2 } });
      } else if (d === "2-4 hours") {
        durationQueries.push({ AND: [{ durationHours: { gte: 2 } }, { durationHours: { lte: 4 } }] });
      } else if (d === "Half Day") {
        durationQueries.push({ AND: [{ durationHours: { gt: 4 } }, { durationHours: { lte: 8 } }] });
      } else if (d === "Full Day") {
        durationQueries.push({ durationHours: { gt: 8 } });
      } else if (!isNaN(Number(d))) {
        durationQueries.push({ durationHours: { equals: Number(d) } });
      }
    }

    if (durationQueries.length > 0) {
      andConditions.push({ OR: durationQueries });
    }
  }

  // Remaining specific filters
  const { date, ...realFilterData } = filterData; // Exclude date as it's not in schema
  if (Object.keys(realFilterData).length > 0) {
    andConditions.push({
      AND: Object.keys(realFilterData).map((key) => {
        // Special case for categoryId (exact match)
        if (key === "categoryId") {
          return { categoryId: { equals: (realFilterData as any)[key] } };
        }
        // Special case for category (relation title match)
        if (key === "category") {
          return { categories: { title: { equals: (realFilterData as any)[key], mode: "insensitive" as Prisma.QueryMode } } };
        }
        // Special case for city (partial match)
        if (key === "city") {
          return { city: { contains: (realFilterData as any)[key], mode: "insensitive" as Prisma.QueryMode } };
        }

        return {
          [key]: {
            equals: (realFilterData as any)[key],
          },
        };
      }),
    });
  }

  const whereConditions: Prisma.ListingWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.listing.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
    include: {
      guide: true,
      bookings: true,
      categories: true,
    },
  });

  const total = await prisma.listing.count({ where: whereConditions });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

const updateListing = async (
  user: NonNullable<IAuthUser>,
  id: string,
  payload: updateListingInput
): Promise<Listing> => {
  //  Check if listing exists and belongs to the guide
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { bookings: true },
  });

  if (!listing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Listing not found");
  }

  if (listing.guideId !== user.guideId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only update your own listings"
    );
  }

  // Optional: Prevent update if there are active bookings
  if (listing.bookings.length > 0) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Cannot update listing with active bookings"
    );
  }

  // Category permission check if categoryId is updated
  if (payload.categoryId) {
    const validCategory = await prisma.guideCategories.findFirst({
      where: {
        guideId: user.guideId,
        categoryId: payload.categoryId,
      },
    });

    if (!validCategory) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You are not allowed to assign this category"
      );
    }
  }

  // Update listing
  const updated = await prisma.listing.update({
    where: { id },
    data: {
      title: payload.title,
      description: payload.description,
      itinerary: payload.itinerary,
      price: payload.price,
      durationHours: payload.durationHours,
      meetingPoint: payload.meetingPoint,
      maxGroupSize: payload.maxGroupSize,
      images: payload.images,
      city: payload.city,
      languages: payload.languages,
      categoryId: payload.categoryId,
    },
  });

  return updated;
};

const deleteListing = async (id: string): Promise<Listing> => {
  // Check if listing exists
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { bookings: true }, // include bookings to check
  });

  if (!listing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Listing not found");
  }

  // Prevent deletion if there are any bookings
  if (listing.bookings.length > 0) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Cannot delete listing with active bookings"
    );
  }

  // Delete listing
  const result = await prisma.listing.delete({
    where: {
      id,
    },
  });

  return result;
};

export const ListingService = {
  createListing,
  getAllFromDB,
  updateListing,
  deleteListing,
};
