import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import httpStatus from "http-status";
import { IAuthUser } from "../../types/common";
import { ReviewService } from "./review.service";

const createReview = catchAsync(
  async (req: Request & { user?: IAuthUser }, res: Response) => {
    const result = await ReviewService.createReview(
      req.user!,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Review submitted successfully",
      data: result,
    });
  }
);

export const ReviewController = {
  createReview,
};
