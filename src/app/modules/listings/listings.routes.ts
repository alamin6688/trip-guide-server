import { UserRole } from "@prisma/client";
import { Router } from "express";
import auth from "../../middlewares/auth";
import { ListingController } from "./listings.controller";

const router = Router();

router.get(
  "/",
  // auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.GUIDE, UserRole.TOURIST),
  ListingController.getAllFromDB
);

router.post("/", auth(UserRole.GUIDE), ListingController.createListing);

router.patch("/:id", auth(UserRole.GUIDE), ListingController.updateListing);

router.delete("/:id", auth(UserRole.GUIDE), ListingController.deleteListing);

export const ListingRoutes = router;
