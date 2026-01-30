import { NextFunction, Request, Response } from "express";
import { jwtHelper } from "../helper/jwtHelper";
import { env } from "process";
import ApiError from "../errors/ApiError";
import httpStatus from "http-status";
import config from "../../config";

const auth = (...roles: string[]) => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
  ) => {
    try {
      let token = req.cookies.accessToken;

      // Also check Authorization header
      if (!token && req.headers.authorization) {
        if (req.headers.authorization.startsWith("Bearer ")) {
          token = req.headers.authorization.split(" ")[1];
        } else {
          token = req.headers.authorization;
        }
      }

      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
      }

      const verifyUser = jwtHelper.verifyToken(
        token,
        config.jwt.access_token_secret as string,
      );

      req.user = verifyUser;

      if (roles.length && !roles.includes(verifyUser.role)) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default auth;
