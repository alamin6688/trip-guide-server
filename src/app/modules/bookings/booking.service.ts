import {
  BookingStatus,
  PaymentStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import ApiError from "../../errors/ApiError";
import { prisma } from "../../shared/prisma";
import { IAuthUser } from "../../types/common";
import httpStatus from "http-status";
import { stripe } from "../../helper/stripe";

const getMyBookings = async (user: NonNullable<IAuthUser>) => {
  if (!user.touristId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only tourists can view their bookings"
    );
  }

  return prisma.booking.findMany({
    where: {
      touristId: user.touristId, // 🔐 user only sees own bookings
    },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          title: true,
          city: true,
          price: true,
        },
      },
      guide: {
        select: {
          name: true,
        },
      },
      payment: true,
    },
  });
};

const getGuideBookings = async (guideId: string) => {
  return prisma.booking.findMany({
    where: { guideId },
    include: { tourist: true, payment: true },
    orderBy: { createdAt: "desc" },
  });
};

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
      status: BookingStatus.PENDING,
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
    include: {
      review: true,
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
// const autoCompleteBookings = async (tx: Prisma.TransactionClient) => {
//   const now = new Date();

//   await tx.booking.updateMany({
//     where: {
//       status: BookingStatus.ACCEPTED,
//       endDate: { lt: now },
//       payment: { is: { status: PaymentStatus.PAID } },
//     },
//     data: {
//       status: BookingStatus.COMPLETED,
//     },
//   });
// };

export const autoCompleteBookings = async (tx: Prisma.TransactionClient) => {
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  console.log("🔁 Auto-complete check at:", now);

  const bookings = await tx.booking.findMany({
    where: {
      status: BookingStatus.ACCEPTED,
      paymentStatus: PaymentStatus.PAID,
      endDate: {
        lt: now,
      },
    },
    select: {
      id: true,
      endDate: true,
    },
  });

  console.log("📦 Eligible bookings:", bookings);

  if (bookings.length === 0) return;

  await tx.booking.updateMany({
    where: {
      id: { in: bookings.map((b) => b.id) },
    },
    data: {
      status: BookingStatus.COMPLETED,
    },
  });

  console.log(`✅ Auto-completed ${bookings.length} bookings`);
};

const initiateStripePaymentForBooking = async (
  bookingId: string,
  user: NonNullable<IAuthUser>
) => {
  if (!user.touristId) {
    throw new ApiError(httpStatus.FORBIDDEN, "Only tourists can pay");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      listing: true,
    },
  });

  if (!booking || booking.touristId !== user.touristId) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  if (booking.status !== BookingStatus.ACCEPTED) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Only ACCEPTED bookings can be paid"
    );
  }

  if (booking.payment?.status === PaymentStatus.PAID) {
    throw new ApiError(httpStatus.CONFLICT, "Booking already paid");
  }

  // Create payment record if not exists
  const payment =
    booking.payment ??
    (await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.listing.price,
        currency: "USD",
        status: PaymentStatus.PENDING,
        transactionId: `TXN_${booking.id}_${Date.now()}`,
      },
    }));

  // Stripe checkout session
  // console.log("Creating Stripe session for booking", bookingId);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: booking.listing.title,
            description: `Guided tour in ${booking.listing.city}`,
          },
          unit_amount: Math.round(payment.amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      bookingId: booking.id,
      paymentId: payment.id,
    },
    // success_url: `${process.env.FRONTEND_URL}/payment/success`,
    // cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
    // success_url: `https://www.programming-hero.com`,
    // cancel_url: `https://next.programming-hero.com`,
    success_url: `http://localhost:3000`,
    cancel_url: `https://next.programming-hero.com`,
  });
  // console.log("Stripe session created:", session.id, session.url);

  return { paymentUrl: session.url };
};

export const BookingService = {
  getMyBookings,
  getGuideBookings,
  createBooking,
  updateBookingStatus,
  autoCompleteBookings,
  initiateStripePaymentForBooking,
};
