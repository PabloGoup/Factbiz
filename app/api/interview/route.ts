import { NextResponse } from "next/server";
import { z } from "zod";

import { describeGeminiError } from "@/lib/ai/gemini";
import { createWelcomeTurn, generateMockInterviewTurn, runInterviewTurn } from "@/lib/ai/interview";
import type { ChatMessage, ProjectDraft } from "@/types";

const requestSchema = z.object({
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["assistant", "user"]),
      content: z.string(),
      createdAt: z.string()
    })
  ),
  draft: z.record(z.any()).optional()
});

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json()) as {
      messages: ChatMessage[];
      draft?: ProjectDraft;
    };

    if (payload.messages.length === 0) {
      return NextResponse.json({
        turn: createWelcomeTurn()
      });
    }

    let turn;
    try {
      turn = await runInterviewTurn(payload.messages, payload.draft ?? {});
    } catch (providerError) {
      turn = generateMockInterviewTurn(payload.messages, payload.draft ?? {});
      turn.didacticTip = describeGeminiError(providerError);
    }

    return NextResponse.json({
      turn
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No fue posible continuar la entrevista."
      },
      { status: 500 }
    );
  }
}
