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
  images?: string[];
  city: string;
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
  images?: string[];
  city?: string;
  languages?: string[];
  categoryId?: string;
};
