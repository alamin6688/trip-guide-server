import { UserRole } from "@prisma/client";
import { Router } from "express";
import auth from "../../middlewares/auth";
import { ListingController } from "./listings.controller";

const router = Router();

router.post(
  "/",
  auth(UserRole.GUIDE),
  ListingController.createListing
);

export const ListingRoutes = router;
