// export interface IListing {
//   id: string;
//   guideId: string;
//   title: string;
//   description: string;
//   itinerary: string;
//   createdAt: Date;
//   updatedAt: Date;
// }

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
};
