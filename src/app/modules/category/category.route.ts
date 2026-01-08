import { Router } from "express";
import { CategoryController } from "./category.controller";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";

const router = Router();

// Create a new guide category
router.post(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.GUIDE),
  CategoryController.createGuideCategory
);

// Get all guide categories
router.get(
  "/",
//   auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  CategoryController.getGuideCategories
);

export const CategoryRoutes = router;
