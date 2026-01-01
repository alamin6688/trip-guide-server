import express from "express";
import { userRoutes } from "../modules/users/user.routes";
import { authRoutes } from "../modules/auth/auth.routes";
import { ListingRoutes } from "../modules/listings/listings.routes";
import { BookingRoutes } from "../modules/bookings/booking.route";
import { ReviewRoutes } from "../modules/review/review.route";
import { AdminRoutes } from "../modules/admin/admin.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/user",
    route: userRoutes,
  },
  {
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/listings",
    route: ListingRoutes,
  },
  {
    path: "/booking",
    route: BookingRoutes,
  },
  {
    path: "/review",
    route: ReviewRoutes,
  },

  //   {
  //     path: "/metadata",
  //     route: MetaRoutes,
  //   },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
