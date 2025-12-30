import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { prisma } from "../../shared/prisma";
import { Listing } from "@prisma/client";
import { IAuthUser } from "../../types/common";
import { createListingInput } from "./listings.interface";

const createListing = async (
  user: NonNullable<IAuthUser>,
  payload: createListingInput
): Promise<Listing> => {
  //  Hard safety check
  if (!user.guideId) {
    throw new ApiError(httpStatus.FORBIDDEN, "Only guides can create listings");
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

export const ListingService = {
  createListing,
};
