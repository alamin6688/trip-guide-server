import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { CategoryService } from "./category.service";

// GET all guide categories
const getGuideCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryService.getGuideCategories();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Guide categories fetched successfully!",
    data: result,
  });
});

// CREATE a new guide category
const createGuideCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { title, icon } = req.body;

    if (!title || !icon) {
      throw new Error(
        "Title and icon are required to create a guide category."
      );
    }

    const result = await CategoryService.createGuideCategory({ title, icon });

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Guide category created successfully!",
      data: result,
    });
  }
);

export const CategoryController = {
  getGuideCategories,
  createGuideCategory,
};
