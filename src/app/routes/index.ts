import express from "express";
import { userRoutes } from "../modules/users/user.routes";
import { authRoutes } from "../modules/auth/auth.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/user",
    route: userRoutes,
  },
  //   {
  //     path: "/admin",
  //     route: AdminRoutes,
  //   },
  {
    path: "/auth",
    route: authRoutes,
  },

  //   {
  //     path: "/metadata",
  //     route: MetaRoutes,
  //   },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
