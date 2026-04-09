import { NextResponse } from "next/server";
import { z } from "zod";

import { searchHotelBenchmarks } from "@/lib/ai/hotelBenchmarkSearch";
import type { HotelBenchmarkSearchInput } from "@/types";

const requestSchema = z.object({
  country: z.string().min(2),
  region: z.string().min(2),
  municipality: z.string().default(""),
  hotelType: z.string().default(""),
  stars: z.number().min(1).max(5).nullable().optional()
});

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json()) as HotelBenchmarkSearchInput;
    const result = await searchHotelBenchmarks(input, {
      requireGemini: true
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Solicitud invalida para la busqueda comparativa hotelera.",
          issues: error.flatten()
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No fue posible ejecutar la búsqueda comparativa hotelera."
      },
      { status: 500 }
    );
  }
}
