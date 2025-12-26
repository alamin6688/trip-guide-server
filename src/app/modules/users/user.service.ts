import { Request } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../shared/prisma";
import { fileUploader } from "../../helper/fileUploader";
import { Admin, Guide, Tourist, UserRole } from "@prisma/client";
import config from "../../../config";

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

export const userService = {
  createAdmin,
  createGuide,
  createTourist,
};
