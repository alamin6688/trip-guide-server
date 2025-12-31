import { BookingStatus, Prisma } from "@prisma/client";
import ApiError from "../../errors/ApiError";
import { prisma } from "../../shared/prisma";
import { IAuthUser } from "../../types/common";
import httpStatus from "http-status";

const createBooking = async (
  user: NonNullable<IAuthUser>,
  payload: {
    listingId: string;
    startDate: string;
    endDate: string;
  }
) => {
  if (!user.touristId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only tourists can create bookings"
    );
  }

  const listing = await prisma.listing.findUnique({
    where: { id: payload.listingId },
  });

  if (!listing || listing.isDeleted || !listing.isActive) {
    throw new ApiError(httpStatus.NOT_FOUND, "Listing not available");
  }

  const start = new Date(payload.startDate); // parse ISO string to UTC
  const end = payload.endDate ? new Date(payload.endDate) : null;
  const nowUtc = new Date();

  // Validate dates
  if (start <= nowUtc) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Booking start date must be in the future (UTC)"
    );
  }
  if (end && end <= start) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "End date must be after start date (UTC)"
    );
  }

  // Prevent duplicate active booking for the same tourist + listing
  const existingBooking = await prisma.booking.findFirst({
    where: {
      listingId: payload.listingId,
      touristId: user.touristId,
      status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED] },
    },
  });
  if (existingBooking) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "You already have an active booking for this listing"
    );
  }

  // Prevent overlapping bookings for the guide
  const overlappingBooking = await prisma.booking.findFirst({
    where: {
      guideId: listing.guideId,
      status: BookingStatus.ACCEPTED,
      startDate: { lt: end ?? start },
      endDate: { gt: start },
    },
  });
  if (overlappingBooking) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Guide is not available for the selected dates"
    );
  }

  // Create booking
  return prisma.booking.create({
    data: {
      listingId: payload.listingId,
      guideId: listing.guideId,
      touristId: user.touristId,
      startDate: start, // stored in UTC
      endDate: end,
      status: BookingStatus.PENDING,
    },
  });
};

const updateBookingStatus = async (
  user: IAuthUser,
  bookingId: string,
  status: BookingStatus
) => {
  if (!user?.guideId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only guides can update booking status"
    );
  }

  if (!["ACCEPTED", "REJECTED"].includes(status)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Guide can only ACCEPT or REJECT bookings"
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }
  if (booking.guideId !== user.guideId) {
    throw new ApiError(httpStatus.FORBIDDEN, "Unauthorized");
  }
  if (booking.status !== BookingStatus.PENDING) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Only pending bookings can be updated. Once updated, the status cannot be undone."
    );
  }

  // Lock if already paid (optional)
  if (booking.payment?.status === "PAID") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot update booking after payment"
    );
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status },
  });
};

/**
 * Auto-complete bookings whose endDate is past and are ACCEPTED and PAID
 * Call via node cron (e.g., every hour or minute)
 */
const autoCompleteBookings = async (tx: Prisma.TransactionClient) => {
  const now = new Date();

  await tx.booking.updateMany({
    where: {
      status: BookingStatus.ACCEPTED,
      endDate: { lt: now },
      payment: { status: "PAID" }, // Only paid bookings
    },
    data: {
      status: BookingStatus.COMPLETED,
    },
  });
};

export const BookingService = {
  createBooking,
  updateBookingStatus,
  autoCompleteBookings,
};
