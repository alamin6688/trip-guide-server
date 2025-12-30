import { Request, Response } from "express";
import { ListingService } from "./listings.service";
import catchAsync from "../../shared/catchAsync";
import { IAuthUser } from "../../types/common";
import httpStatus from "http-status";
import sendResponse from "../../shared/sendResponse";

const createListing = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const user = req.user!;

    const result = await ListingService.createListing(user, req.body);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Listing created successfully!",
      data: result,
    });
  }
);

export const ListingController = {
  createListing,
};
