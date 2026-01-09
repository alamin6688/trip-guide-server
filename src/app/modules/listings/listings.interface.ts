// export interface IListing {
//   id: string;
//   guideId: string;
//   title: string;
//   description: string;
//   itinerary: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

import e from "express";

export type createListingInput = {
  title: string;
  description: string;
  itinerary: string;
  price: number;
  durationHours: number;
  meetingPoint: string;
  maxGroupSize: number;
  city: string;
  images: string;
  languages: string[];
  categoryId: string;
};

export type updateListingInput = {
  title?: string;
  description?: string;
  itinerary?: string;
  price?: number;
  durationHours?: number;
  meetingPoint?: string;
  maxGroupSize?: number;
  city?: string;
  images?: string;
  languages?: string[];
  categoryId?: string;
};
