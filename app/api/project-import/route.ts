import { NextResponse } from "next/server";
import { z } from "zod";

import { importProjectFromText } from "@/lib/ai/projectImport";

const requestSchema = z.object({
  content: z.string().min(20)
});

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json());
    const result = await importProjectFromText(payload.content);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "El contenido importado es demasiado corto para generar un proyecto.",
          issues: error.flatten()
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No fue posible importar el proyecto."
      },
      { status: 500 }
    );
  }
}
