import { PaymentStatus } from "@prisma/client";
import ApiError from "../../errors/ApiError";
import { prisma } from "../../shared/prisma";
import httpStatus from "http-status";
import { IAuthUser } from "../../types/common";

const createReview = async (
  user: NonNullable<IAuthUser>,
  payload: {
    bookingId: string;
    rating: number;
    comment?: string;
  }
) => {
  if (!user.touristId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only tourists can submit reviews"
    );
  }

  if (payload.rating < 1 || payload.rating > 5) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Rating must be between 1 and 5"
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: payload.bookingId },
    include: {
      payment: true,
      review: true,
    },
  });

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  if (booking.touristId !== user.touristId) {
    throw new ApiError(httpStatus.FORBIDDEN, "Unauthorized access");
  }

  // if (booking.status !== BookingStatus.COMPLETED) {
  //   throw new ApiError(
  //     httpStatus.BAD_REQUEST,
  //     "You can review only after the tour is completed"
  //   );
  // }

  if (booking.payment?.status !== PaymentStatus.PAID) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot review an unpaid booking"
    );
  }

  if (booking.review) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "You have already reviewed this booking"
    );
  }

  return prisma.review.create({
    data: {
      bookingId: booking.id,
      touristId: booking.touristId,
      guideId: booking.guideId,
      rating: payload.rating,
      // comment: payload.comment,
      // comment: payload.comment || null,
      ...(payload.comment?.trim() && { comment: payload.comment }),
    },
  });
};

export const ReviewService = {
  createReview,
};
