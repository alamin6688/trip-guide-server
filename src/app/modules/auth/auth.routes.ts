import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { AuthController } from "./auth.controller";

const router = express.Router();

router.post(
  "/login",
  // authLimiter,
  AuthController.loginUser
);

router.post("/refresh-token", AuthController.refreshToken);

router.post(
  "/change-password",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.GUIDE, UserRole.TOURIST),
  AuthController.changePassword
);

router.post("/forgot-password", AuthController.forgotPassword);

router.post(
  "/reset-password",
  (req: Request, res: Response, next: NextFunction) => {
    //user is resetting password without token and logged in newly created admin 
    if (!req.headers.authorization && req.cookies.accessToken) {
      console.log(req.headers.authorization, "from reset password route guard");
      console.log(req.cookies.accessToken, "from reset password route guard");
      auth(
        UserRole.SUPER_ADMIN,
        UserRole.ADMIN,
        UserRole.GUIDE,
        UserRole.TOURIST
      )(req, res, next);
    } else {
      //user is resetting password via email link with token
      next();
    }
  },
  AuthController.resetPassword
);

router.get("/me", AuthController.getMe);

export const authRoutes = router;
