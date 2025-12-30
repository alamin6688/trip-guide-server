import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { prisma } from "../../shared/prisma";
import { Listing, Prisma } from "@prisma/client";
import { IAuthUser } from "../../types/common";
import {
  IPaginationOptions,
  paginationHelper,
} from "../../helper/paginationHelper";
import { createListingInput } from "./listings.interface";

const createListing = async (
  user: NonNullable<IAuthUser>,
  payload: createListingInput
): Promise<Listing> => {
  //  Hard safety check
  if (!user.guideId) {
    throw new ApiError(httpStatus.FORBIDDEN, "Only guides can create listings");
  }

  // Category permission check
  const validCategory = await prisma.guideCategories.findFirst({
    where: {
      guideId: user.guideId,
      categoryId: payload.categoryId,
    },
  });

  if (!validCategory) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not allowed to create listings in this category"
    );
  }

  //  Duplicate prevention
  const existingListing = await prisma.listing.findFirst({
    where: {
      guideId: user.guideId,
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
      guideId: user.guideId,
      categoryId: payload.categoryId,
      title: payload.title,
      description: payload.description,
      itinerary: payload.itinerary,
      price: payload.price,
      durationHours: payload.durationHours,
      meetingPoint: payload.meetingPoint,
      maxGroupSize: payload.maxGroupSize,
      images: payload.images ?? [],
      city: payload.city,
    },
  });
};

const getAllFromDB = async (filters: any, options: IPaginationOptions) => {
  const { limit, page, skip } = paginationHelper.calculatePagination(options);
  const { ...filterData } = filters;
  const andConditions = [];

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => {
        return {
          [key]: {
            equals: (filterData as any)[key],
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
      bookings: true,
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

export const ListingService = {
  createListing,
  getAllFromDB,
};
