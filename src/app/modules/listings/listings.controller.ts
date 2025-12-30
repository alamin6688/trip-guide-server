import { Request, Response } from "express";
import { ListingService } from "./listings.service";
import catchAsync from "../../shared/catchAsync";
import { IAuthUser } from "../../types/common";
import httpStatus from "http-status";
import sendResponse from "../../shared/sendResponse";
import pick from "../../helper/pick";

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

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["city"]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await ListingService.getAllFromDB(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Listing fetched successfully!",
    data: result,
  });
});

export const ListingController = {
  createListing,
  getAllFromDB,
};
