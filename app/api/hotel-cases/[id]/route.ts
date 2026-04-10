import { z } from "zod";

import { getAuthUserFromRequest, UnauthorizedError } from "@/lib/auth/supabaseSession";
import { deleteHotelCaseRecord, getHotelCaseRecordById, updateHotelCaseRecord } from "@/lib/db/hotelCases";
import { saveHotelCaseSchema } from "@/lib/hotel/caseSchema";

export async function GET(_: Request, context: { params: { id: string } }) {
  try {
    const user = await getAuthUserFromRequest(_);
    const record = await getHotelCaseRecordById(context.params.id, user.id);
    return Response.json(record);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : "No fue posible cargar el caso hotelero."
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  try {
    const user = await getAuthUserFromRequest(request);
    const body = saveHotelCaseSchema.parse(await request.json());
    const record = await updateHotelCaseRecord(context.params.id, user.id, {
      input: body.input,
      result: (body.result as never) ?? null
    });

    return Response.json(record);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          error: "Solicitud inválida para actualizar el caso hotelero.",
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
        error: error instanceof Error ? error.message : "No fue posible actualizar el caso hotelero."
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  try {
    const user = await getAuthUserFromRequest(request);
    const deletedId = await deleteHotelCaseRecord(context.params.id, user.id);
    return Response.json({ id: deletedId, ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ error: error.message }, { status: 401 });
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : "No fue posible eliminar el caso hotelero."
      },
      { status: 500 }
    );
  }
}
