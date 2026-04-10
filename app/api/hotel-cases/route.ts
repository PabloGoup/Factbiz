import { z } from "zod";

import { getAuthUserFromRequest, UnauthorizedError } from "@/lib/auth/supabaseSession";
import { listHotelCaseRecords, saveHotelCaseRecord } from "@/lib/db/hotelCases";
import { saveHotelCaseSchema } from "@/lib/hotel/caseSchema";
import type { HotelCaseInput } from "@/types";

export async function GET(request: Request) {
  try {
    const user = await getAuthUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("q") ?? "";
    const destination = searchParams.get("destination") ?? "";
    const items = await listHotelCaseRecords({
      userId: user.id,
      search,
      destination: destination as HotelCaseInput["destination"] | ""
    });

    return Response.json({ items });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ error: error.message }, { status: 401 });
    }

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
    const user = await getAuthUserFromRequest(request);
    const body = saveHotelCaseSchema.parse(await request.json());
    const record = await saveHotelCaseRecord({
      userId: user.id,
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

    if (error instanceof UnauthorizedError) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : "No fue posible guardar el caso hotelero."
      },
      { status: 500 }
    );
  }
}
