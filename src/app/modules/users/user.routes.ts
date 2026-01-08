import { UserRole } from "@prisma/client";
import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../helper/fileUploader";
import { userController } from "./user.controller";
import { userValidation } from "./user.validation";

const router = express.Router();

router.get(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  userController.getAllFromDB
);

router.get(
  "/guide",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  userController.getAllGuides
);

router.get("/guide/:id", userController.getGuideById);

router.get("/tourist/:id", userController.getTouristById);

router.post(
  "/create-admin",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = userValidation.createAdmin.parse(JSON.parse(req.body.data));
    return userController.createAdmin(req, res, next);
  }
);

router.post(
  "/create-guide",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.GUIDE),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = userValidation.createGuide.parse(JSON.parse(req.body.data));
    return userController.createGuide(req, res, next);
  }
);

router.post(
  "/create-tourist",
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = userValidation.createTourist.parse(JSON.parse(req.body.data));
    return userController.createTourist(req, res, next);
  }
);

router.patch(
  "/update-my-profile",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.GUIDE, UserRole.TOURIST),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = JSON.parse(req.body.data);
    return userController.updateMyProfie(req, res, next);
  }
);

router.delete(
  "/guide/soft/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  userController.deleteFromDB
);

export const userRoutes = router;
