import ApiError from "../../errors/ApiError";
import { prisma } from "../../shared/prisma";
import httpStatus from "http-status";

interface CreateCategoryInput {
  title: string;
  icon: string;
}

export const CategoryService = {
  // Fetch all guide categories
  getGuideCategories: async () => {
    const categories = await prisma.category.findMany({
      select: { id: true, title: true, icon: true },
      orderBy: { title: "asc" },
    });
    return categories;
  },

  // Create a new guide category
  // createGuideCategory: async (input: CreateCategoryInput) => {
  //   const category = await prisma.category.create({
  //     data: {
  //       title: input.title,
  //       icon: input.icon,
  //     },
  //     select: { id: true, title: true, icon: true },
  //   });
  //   return category;
  // },
  createGuideCategory: async (input: CreateCategoryInput) => {
    const normalizedTitle = input.title.trim().toUpperCase();

    const exists = await prisma.category.findFirst({
      where: { title: normalizedTitle },
    });

    if (exists) {
      throw new ApiError(httpStatus.CONFLICT, "Category already exists");
    }

    return prisma.category.create({
      data: {
        title: normalizedTitle,
        icon: input.icon,
      },
      select: {
        id: true,
        title: true,
        icon: true,
      },
    });
  },
};

// export const CategoryService = {
//   createGuideCategories
// };
