import { BookingStatus, PaymentStatus, UserRole } from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { IAuthUser } from "../../types/common";

const fetchDashboardMetaData = async (user: IAuthUser) => {
  if (!user) throw new ApiError(httpStatus.UNAUTHORIZED, "User not found");

  switch (user.role) {
    case UserRole.ADMIN:
      return getAdminMetaData();
    case UserRole.GUIDE:
      return getGuideMetaData(user);
    case UserRole.TOURIST:
      return getTouristMetaData(user);
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid user role");
  }
};

// ---------------- GUIDE METADATA ----------------
const getGuideMetaData = async (user: IAuthUser) => {
  if (!user?.guideId)
    throw new ApiError(httpStatus.BAD_REQUEST, "Guide ID missing");

  const guideId = user.guideId;

  // Total bookings
  const totalBookings = await prisma.booking.count({ where: { guideId } });

  // Total revenue
  const totalRevenueRaw = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { booking: { guideId }, status: PaymentStatus.PAID },
  });
  const totalRevenue = Number(totalRevenueRaw._sum?.amount ?? 0);

  // Booking status distribution
  const statusDistributionRaw = await prisma.booking.groupBy({
    by: ["status"],
    _count: { id: true },
    where: { guideId },
  });
  const statusDistribution = statusDistributionRaw.map(
    ({ status, _count }) => ({
      status,
      count: Number(_count.id),
    })
  );

  // Review count
  const reviewCount = await prisma.review.count({ where: { guideId } });

  return {
    totalBookings,
    totalRevenue,
    statusDistribution,
    reviewCount,
  };
};

// ---------------- TOURIST METADATA ----------------
const getTouristMetaData = async (user: IAuthUser) => {
  if (!user?.touristId)
    throw new ApiError(httpStatus.BAD_REQUEST, "Tourist ID missing");

  const touristId = user.touristId;

  const totalBookings = await prisma.booking.count({ where: { touristId } });
  const totalPaidBookings = await prisma.booking.count({
    where: { touristId, payment: { status: PaymentStatus.PAID } },
  });

  const reviewCount = await prisma.review.count({ where: { touristId } });

  const statusDistributionRaw = await prisma.booking.groupBy({
    by: ["status"],
    _count: { id: true },
    where: { touristId },
  });
  const statusDistribution = statusDistributionRaw.map(
    ({ status, _count }) => ({
      status,
      count: Number(_count.id),
    })
  );

  return {
    totalBookings,
    totalPaidBookings,
    reviewCount,
    statusDistribution,
  };
};

// ---------------- ADMIN METADATA ----------------
const getAdminMetaData = async () => {
  const totalGuides = await prisma.guide.count();
  const totalTourists = await prisma.tourist.count();
  const totalBookings = await prisma.booking.count();
  const totalPayments = await prisma.payment.count();

  // Total revenue
  const totalRevenueRaw = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: PaymentStatus.PAID },
  });
  const totalRevenue = Number(totalRevenueRaw._sum?.amount ?? 0);

  // Booking status distribution
  const bookingStatusRaw = await prisma.booking.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  const bookingStatusDistribution = bookingStatusRaw.map(
    ({ status, _count }) => ({
      status,
      count: Number(_count.id),
    })
  );

  // Monthly booking counts (bar chart)
  const monthlyBookingsRaw = await prisma.$queryRaw<
    { month: Date; count: bigint }[]
  >`
    SELECT DATE_TRUNC('month', "createdAt") AS month,
           COUNT(*) AS count
    FROM "bookings"
    GROUP BY month
    ORDER BY month ASC
  `;
  const monthlyBookings = monthlyBookingsRaw.map((row) => ({
    month: row.month,
    count: Number(row.count),
  }));

  return {
    totalGuides,
    totalTourists,
    totalBookings,
    totalPayments,
    totalRevenue,
    bookingStatusDistribution,
    monthlyBookings,
  };
};

export const MetaService = {
  fetchDashboardMetaData,
};
