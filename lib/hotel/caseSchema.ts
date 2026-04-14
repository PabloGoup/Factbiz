import { z } from "zod";

import type { HotelCaseInput } from "@/types";

const roomMixSchema = z.object({
  single: z.number(),
  double: z.number(),
  triple: z.number(),
  suite: z.number()
});

const roomRatesSchema = z.object({
  single: z.number(),
  double: z.number(),
  triple: z.number(),
  suite: z.number()
});

const channelSchema = z.object({
  share: z.number(),
  commission: z.number(),
  rates: roomRatesSchema,
  roomAllocation: roomMixSchema
});

export const hotelCaseInputSchema: z.ZodType<HotelCaseInput> = z.object({
  hotelName: z.string(),
  destination: z.enum(["patagonia-chilena", "puerto-varas", "villarrica", "san-pedro-de-atacama", "papudo"]),
  region: z.string(),
  country: z.string(),
  category: z.string(),
  concept: z.string(),
  services: z.string(),
  differentiation: z.string(),
  totalRooms: z.number(),
  roomMix: roomMixSchema,
  roomRates: roomRatesSchema,
  previousAverageRate: z.number(),
  targetAverageRate: z.number(),
  guestFactor: z.number(),
  breakfastPriceCurrent: z.number(),
  breakfastPriceProposed: z.number(),
  occupancyJanuary: z.number(),
  occupancyFebruary: z.number(),
  channels: z.object({
    tourOperators: channelSchema,
    onlineAgencies: channelSchema,
    direct: channelSchema,
    corporate: channelSchema
  })
});

export const saveHotelCaseSchema = z.object({
  input: hotelCaseInputSchema,
  result: z.unknown().nullable().optional()
});
