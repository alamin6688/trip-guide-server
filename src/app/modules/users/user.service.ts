import { Request } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../shared/prisma";
import { fileUploader } from "../../helper/fileUploader";
import { Admin, Guide, Prisma, Tourist, UserRole } from "@prisma/client";
import config from "../../../config";
import {
  IPaginationOptions,
  paginationHelper,
} from "../../helper/paginationHelper";
import { userSearchAbleFields } from "./user.constant";

const createAdmin = async (req: Request): Promise<Admin> => {
  const file = req.file;

  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    req.body.admin.profilePhoto = uploadToCloudinary?.secure_url;
  }

  const hashedPassword: string = await bcrypt.hash(
    req.body.password,
    Number(config.bcrypt_salt_rounds)
  );

  const userData = {
    email: req.body.admin.email,
    password: hashedPassword,
    role: UserRole.ADMIN,
  };

  const result = await prisma.$transaction(async (transactionClient) => {
    await transactionClient.user.create({
      data: userData,
    });

    const createdAdminData = await transactionClient.admin.create({
      data: req.body.admin,
    });

    return createdAdminData;
  });

  return result;
};

const createGuide = async (req: Request): Promise<Guide> => {
  const file = req.file;

  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    req.body.guide.profilePhoto = uploadToCloudinary?.secure_url;
  }

  const hashedPassword: string = await bcrypt.hash(
    req.body.password,
    Number(config.bcrypt_salt_rounds)
  );

  const userData = {
    email: req.body.guide.email,
    password: hashedPassword,
    role: UserRole.GUIDE,
  };

  // Transaction: create User and Guide
  const createdGuide = await prisma.$transaction(async (tx) => {
    // Create User
    await tx.user.create({
      data: {
        ...userData,
        needPasswordChange: false,
      },
    });

    //Create Guide
    const createdGuideData = await tx.guide.create({
      data: req.body.guide,
    });

    return createdGuideData;
  });
  console.log("Created Guide", { createdGuide });
  return createdGuide;
};

const createTourist = async (req: Request): Promise<Tourist> => {
  const file = req.file;

  if (file) {
    const uploadToCloudinary = await fileUploader.uploadToCloudinary(file);
    req.body.tourist.profilePhoto = uploadToCloudinary?.secure_url;
  }

  const hashedPassword: string = await bcrypt.hash(
    req.body.password,
    Number(config.bcrypt_salt_rounds)
  );

  const userData = {
    email: req.body.tourist.email,
    password: hashedPassword,
    role: UserRole.TOURIST,
  };

  // Transaction: create User and Guide
  const createdTourist = await prisma.$transaction(async (tx) => {
    // Create User
    await tx.user.create({
      data: {
        ...userData,
        needPasswordChange: false,
      },
    });

    //Create Guide
    const createdTouristData = await tx.tourist.create({
      data: req.body.tourist,
    });

    return createdTouristData;
  });
  console.log("Created Tourist", { createdTourist });
  return createdTourist;
};

const getAllFromDB = async (params: any, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.UserWhereInput[] = [];

  if (params.searchTerm) {
    andConditions.push({
      OR: userSearchAbleFields.map((field) => ({
        [field]: {
          contains: params.searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
    select: {
      id: true,
      email: true,
      role: true,
      needPasswordChange: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      admin: true,
      guide: true,
      tourist: true,
    },
  });

  const total = await prisma.user.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const getGuideById = async (id: string) => {
  const result = await prisma.guide.findFirst({
    where: {
      id,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      bio: true,
      city: true,
      country: true,
      languages: true,
      experience: true,
      dailyRate: true,
      averageRating: true,
      profilePhoto: true,
      reviews: {
        select: {
          rating: true,
          comment: true,
          tourist: {
            select: {
              name: true,
            },
          },
        },
      },
      listings: {
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          price: true,
          durationHours: true,
        },
      },
    },
  });

  return result;
};

export const userService = {
  createAdmin,
  createGuide,
  createTourist,
  getAllFromDB,
  getGuideById,
};
