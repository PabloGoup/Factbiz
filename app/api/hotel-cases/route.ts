import { z } from "zod";

import { listHotelCaseRecords, saveHotelCaseRecord } from "@/lib/db/hotelCases";
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
  commission: z.number()
});

const hotelCaseInputSchema: z.ZodType<HotelCaseInput> = z.object({
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

const saveSchema = z.object({
  input: hotelCaseInputSchema,
  result: z.unknown().nullable().optional()
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") ?? "";
    const destination = searchParams.get("destination") ?? "";
    const items = await listHotelCaseRecords({
      search,
      destination: destination as HotelCaseInput["destination"] | ""
    });

    return Response.json({ items });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "No fue posible listar los casos hoteleros."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = saveSchema.parse(await request.json());
    const record = await saveHotelCaseRecord({
      input: body.input,
      result: (body.result as never) ?? null
    });

    return Response.json(record);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error: "Solicitud inválida para guardar el caso hotelero.",
          issues: error.flatten()
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : "No fue posible guardar el caso hotelero."
      },
      { status: 500 }
    );
  }
}
