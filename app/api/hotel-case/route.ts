import { NextResponse } from "next/server";
import { z } from "zod";

import { generateHotelResearch } from "@/lib/ai/hotelResearch";
import { buildHotelCaseBaseResult, validateHotelCaseInput } from "@/lib/hotel/forecast";
import type { HotelCaseInput } from "@/types";

const roomMixSchema = z.object({
  single: z.number().min(0),
  double: z.number().min(0),
  triple: z.number().min(0),
  suite: z.number().min(0)
});

const roomRatesSchema = z.object({
  single: z.number().min(1),
  double: z.number().min(1),
  triple: z.number().min(1),
  suite: z.number().min(1)
});

const channelSchema = z.object({
  share: z.number().min(0).max(100),
  commission: z.number().min(0).max(100)
});

const requestSchema = z.object({
  hotelName: z.string().min(3),
  destination: z.enum([
    "patagonia-chilena",
    "puerto-varas",
    "villarrica",
    "san-pedro-de-atacama",
    "papudo"
  ]),
  region: z.string().min(2),
  country: z.string().min(2),
  category: z.string().min(3),
  concept: z.string().min(20),
  services: z.string().min(20),
  differentiation: z.string().min(20),
  totalRooms: z.number().min(1),
  roomMix: roomMixSchema,
  roomRates: roomRatesSchema,
  previousAverageRate: z.number().min(1),
  targetAverageRate: z.number().min(1),
  guestFactor: z.number().min(1).max(6),
  breakfastPriceCurrent: z.number().min(0),
  breakfastPriceProposed: z.number().min(0),
  occupancyJanuary: z.number().min(1).max(100),
  occupancyFebruary: z.number().min(1).max(100),
  channels: z.object({
    tourOperators: channelSchema,
    onlineAgencies: channelSchema,
    direct: channelSchema,
    corporate: channelSchema
  })
});

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json()) as HotelCaseInput;
    const issues = validateHotelCaseInput(input);

    if (issues.length > 0) {
      return NextResponse.json(
        {
          error: "El caso hotelero no paso las validaciones basicas.",
          issues
        },
        { status: 400 }
      );
    }

    const baseResult = buildHotelCaseBaseResult(input);
    const research = await generateHotelResearch(input, baseResult.summary, {
      requireGemini: true
    });

    return NextResponse.json({
      ...baseResult,
      research
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Solicitud invalida para el modulo hotelero.",
          issues: error.flatten()
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No fue posible resolver el caso hotelero."
      },
      { status: 500 }
    );
  }
}
