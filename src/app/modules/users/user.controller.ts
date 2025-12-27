import { Request, Response } from "express";
import { userService } from "./user.service";
import httpStatus from "http-status";
import { userFilterableFields } from "./user.constant";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../helper/pick";

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createAdmin(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin Created successfuly!",
    data: result,
  });
});

const createGuide = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createGuide(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Guide Created successfuly!",
    data: result,
  });
});

const createTourist = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createTourist(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tourist Created successfuly!",
    data: result,
  });
});

const getAllFromDB = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, userFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await userService.getAllFromDB(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users data fetched successfuly!",
    meta: result.meta,
    data: result.data,
  });
});

const getGuideById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await userService.getGuideById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Guide retrieval successfully!",
    data: result,
  });
});

const getTouristById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await userService.getTouristById(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Tourist retrieval successfully!",
    data: result,
  });
});

export const userController = {
  createAdmin,
  createGuide,
  createTourist,
  getAllFromDB,
  getGuideById,
  getTouristById,
};
