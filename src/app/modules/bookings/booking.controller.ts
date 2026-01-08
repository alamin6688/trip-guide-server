import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { IAuthUser } from "../../types/common";
import httpStatus from "http-status";
import { BookingService } from "./booking.service";
import { prisma } from "../../shared/prisma";

const getMyBookings = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user!;

    const result = await BookingService.getMyBookings(user);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My bookings fetched successfully",
      data: result,
    });
  }
);

export const getGuideBookings = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const guideId = req.user!.guideId;

    const bookings = await BookingService.getGuideBookings(guideId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Guide bookings fetched successfully",
      data: bookings,
    });
  }
);

const createBooking = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user!;
    const result = await BookingService.createBooking(user, req.body);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Booking request sent successfully.",
      data: result,
    });
  }
);

const updateBookingStatus = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user!;
    const { id } = req.params;
    const { status } = req.body;

    const result = await BookingService.updateBookingStatus(user, id, status);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Booking status updated successfully!",
      data: result,
    });
  }
);

const initiatePayment = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user!;
    const { id } = req.params;

    const result = await BookingService.initiateStripePaymentForBooking(
      id,
      user
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Payment session created successfully",
      data: result,
    });
  }
);

export const testAutoComplete = catchAsync(async (req, res) => {
  await prisma.$transaction(async (tx) => {
    await BookingService.autoCompleteBookings(tx);
  });

  res.json({
    success: true,
    message: "Auto-complete executed manually",
  });
});

export const BookingController = {
  getMyBookings,
  getGuideBookings,
  createBooking,
  updateBookingStatus,
  initiatePayment,
};
