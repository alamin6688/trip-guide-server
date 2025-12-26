import { Request, Response } from "express";
import { userService } from "./user.service";
import httpStatus from "http-status";
import { userFilterableFields } from "./user.constant";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../helper/pick";
import { IAuthUser } from "../../types/common";

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

export const userController = {
  createAdmin,
  createGuide,
  createTourist,
};
