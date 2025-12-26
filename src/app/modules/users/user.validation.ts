import { Gender } from "@prisma/client";
import { z } from "zod";

const createAdmin = z.object({
  password: z.string({
    error: "Password is required",
  }),
  admin: z.object({
    name: z.string({
      error: "Name is required!",
    }),
    email: z.string({
      error: "Email is required!",
    }),
    contactNumber: z.string({
      error: "Contact Number is required!",
    }),
  }),
});

export const createGuide = z.object({
  password: z.string({
    error: "Password is required",
  }),
  guide: z.object({
    email: z.string({
      error: "Email is required!",
    }),
    name: z.string({
      error: "Name is required!",
    }),
    languages: z.array(z.string()).min(1, "At least one language is required"),
    contactNumber: z.string({
      error: "Contact Number is required!",
    }),
    address: z.string().optional(),
    gender: z.enum(Object.values(Gender)),
    bio: z.string().optional(),
    city: z.string({
      error: "City is required!",
    }),
    country: z.string({
      error: "Country is required!",
    }),
    dailyRate: z.number({
      error: "Daily rate is required!",
    }),
    experience: z.number().min(0).optional(),
    averageRating: z.number().min(0).max(5).optional(),
  }),
});

export const createTourist = z.object({
  password: z.string({
    error: "Password is required",
  }),
  tourist: z.object({
    email: z.string({
      error: "Email is required!",
    }),
    name: z.string({
      error: "Name is required!",
    }),
    gender: z.enum(Object.values(Gender)).optional(),
    languages: z.array(z.string()).optional(),
    contactNumber: z.string().optional(),
    address: z.string().optional(),
    country: z.string({
      error: "Country is required!",
    }),
    travelPreferences: z.string().optional(),
  }),
});

export const userValidation = {
  createAdmin,
  createGuide,
  createTourist,
};
