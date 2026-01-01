import { UserRole } from "@prisma/client";
import { Router } from "express";
import auth from "../../middlewares/auth";
import { ReviewController } from "./review.controller";

const router = Router();

router.post("/", auth(UserRole.TOURIST), ReviewController.createReview);

export const ReviewRoutes = router;
