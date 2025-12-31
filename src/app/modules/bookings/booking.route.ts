import { UserRole } from "@prisma/client";
import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { BookingController } from "./booking.controller";

const router = express.Router();

router.post("/", auth(UserRole.TOURIST), BookingController.createBooking);

router.patch(
  "/:id",
  auth(UserRole.GUIDE),
  BookingController.updateBookingStatus
);

export const BookingRoutes = router;