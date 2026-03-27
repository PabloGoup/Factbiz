"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  ClipboardList,
  Loader2,
  MessageSquareText,
  RefreshCcw,
  Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScoreBadge } from "@/components/ui/score-badge";
import { demoProjects } from "@/data/demoProjects";
import { buildEvaluationSnapshot } from "@/lib/evaluation";
import { DEFAULT_WEIGHTS, EMPTY_PROJECT } from "@/lib/constants";
import {
  getStoredInterview,
  setStoredEvaluation,
  setStoredInterview,
  setStoredProject,
  setStoredWeights
} from "@/lib/storage";
import { mergeProjectDraft } from "@/lib/project-draft";
import { formatMoney } from "@/lib/utils";
import type { ChatMessage, EvaluationSnapshot, InterviewSession, InterviewTurnResult, ProjectDraft, ProjectWeights } from "@/types";

const weightPresets: Record<string, ProjectWeights> = {
  balanceado: DEFAULT_WEIGHTS,
  mercado: {
    septe: 20,
    porter: 15,
    foda: 10,
    mercado: 30,
    finanzas: 15,
    operacionLegalidad: 10
  },
  conservador: {
    septe: 20,
    porter: 15,
    foda: 10,
    mercado: 15,
    finanzas: 25,
    operacionLegalidad: 15
  }
};

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString()
  };
}

function createWelcomeSession(): InterviewSession {
  return {
    messages: [
      createMessage(
        "assistant",
        "Soy Factibiz AI. Te voy a entrevistar paso a paso para entender tu negocio, estimar su factibilidad y redactar un informe ejecutivo. Empecemos simple: dime qué proyecto quieres lanzar, en qué ciudad y para qué tipo de cliente."
      )
    ],
    draft: {},
    completionScore: 8,
    readyForReport: false,
    missingFields: ["nombre del proyecto", "tipo de negocio", "ciudad", "público objetivo"],
    quickReplies: [
      "Quiero abrir una cafetería para universitarios en Santiago",
      "Estoy evaluando un hotel boutique en Pucón",
      "Quiero lanzar una tienda online de productos para mascotas"
    ],
    didacticTip: "La idea base define qué datos realmente necesito y evita que el análisis parta con preguntas irrelevantes.",
    recommendedNextFocus: "Definir la idea base del negocio"
  };
}

async function upgradeSnapshotInsights(snapshot: EvaluationSnapshot) {
  const response = await fetch("/api/insights", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: snapshot.input,
      context: snapshot.context,
      scoreBreakdown: snapshot.scoreBreakdown,
      strict: true,
      useGroundedContext: true
    })
  });

  if (!response.ok) {
    const payload = (await response.json()) as { error?: string };
    throw new Error(payload.error ?? "No fue posible generar el informe con Gemini.");
  }

  const payload = (await response.json()) as {
    insights: EvaluationSnapshot["insights"];
    context?: EvaluationSnapshot["context"];
    scoreBreakdown?: EvaluationSnapshot["scoreBreakdown"];
  };

  return {
    ...snapshot,
    context: payload.context ?? snapshot.context,
    scoreBreakdown: payload.scoreBreakdown ?? snapshot.scoreBreakdown,
    insights: payload.insights
  };
}

export function ConversationalEvaluation({ demoId }: { demoId?: string }) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weightPreset, setWeightPreset] = useState<keyof typeof weightPresets>("balanceado");

  useEffect(() => {
    if (demoId && demoProjects[demoId]) {
      const demo = demoProjects[demoId];
      setSession({
        messages: [
          createMessage(
            "assistant",
            `Cargué un caso demo: ${demo.projectName}. Ya tengo un borrador completo con esa información. Si quieres, puedes pedirme ajustes, cambiar supuestos o generar el informe ahora.`
          )
        ],
        draft: demo,
        completionScore: 100,
        readyForReport: true,
        missingFields: [],
        quickReplies: [
          "Genera el informe",
          "Hazlo más conservador en finanzas",
          "Quiero cambiar la ciudad"
        ],
        didacticTip:
          "Puedes usar un demo como punto de partida y luego modificar datos conversando con la IA.",
        recommendedNextFocus: "Confirmar o ajustar supuestos antes del informe"
      });
      return;
    }

    const stored = getStoredInterview();
    setSession(stored ?? createWelcomeSession());
  }, [demoId]);

  useEffect(() => {
    if (!session) return;
    setStoredInterview(session);
  }, [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
  }, [loading, session?.messages]);

  const weights = weightPresets[weightPreset];
  const mergedInput = useMemo(() => mergeProjectDraft(session?.draft ?? EMPTY_PROJECT), [session?.draft]);
  const previewSnapshot = useMemo(() => buildEvaluationSnapshot(mergedInput, weights), [mergedInput, weights]);

  const sendUserMessage = async (content: string) => {
    if (!session || !content.trim()) return;

    const nextMessages = [...session.messages, createMessage("user", content.trim())];
    setSession({
      ...session,
      messages: nextMessages
    });
    setMessage("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: nextMessages,
          draft: session.draft
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "No fue posible continuar la entrevista.");
      }

      const payload = (await response.json()) as {
        turn: InterviewTurnResult;
      };
      const updatedDraft: ProjectDraft = {
        ...session.draft,
        ...payload.turn.projectPatch
      };

      setSession({
        messages: [...nextMessages, createMessage("assistant", payload.turn.assistantMessage)],
        draft: updatedDraft,
        completionScore: payload.turn.completionScore,
        readyForReport: payload.turn.readyForReport,
        missingFields: payload.turn.missingFields,
        quickReplies: payload.turn.quickReplies,
        didacticTip: payload.turn.didacticTip,
        recommendedNextFocus: payload.turn.recommendedNextFocus,
        lastModel: payload.turn.model
      });
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No fue posible continuar la entrevista.");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!session) return;

    setReportLoading(true);
    setError(null);

    try {
      let snapshot = buildEvaluationSnapshot(mergeProjectDraft(session.draft), weights);
      snapshot = await upgradeSnapshotInsights(snapshot);
      setStoredProject(snapshot.input);
      setStoredWeights(weights);
      setStoredEvaluation(snapshot);
      router.push("/resultado");
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No fue posible generar el informe.");
    } finally {
      setReportLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-300">
            <Sparkles className="h-4 w-4" />
            Experiencia guiada por IA
          </div>
          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
            Conversa con la IA y deja que construya el caso contigo
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Ya no necesitas llenar todo como formulario. La IA te entrevista, ordena los datos, estima variables
            faltantes con criterio académico y prepara un informe listo para presentar.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/evaluacion?modo=formulario">
            <Button variant="secondary">Usar formulario clásico</Button>
          </Link>
          <Button variant="secondary" onClick={() => setSession(createWelcomeSession())}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reiniciar entrevista
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="flex flex-col self-start">
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Entrevista inteligente
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">Factibiz AI</h2>
            </div>
            <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
              Progreso {session.completionScore}%
            </div>
          </div>

          <div className="mt-6 max-h-[56vh] space-y-4 overflow-y-auto pr-1">
            {session.messages.map((chatMessage) => (
              <div
                key={chatMessage.id}
                className={`max-w-[88%] rounded-3xl px-5 py-4 text-sm leading-7 ${
                  chatMessage.role === "assistant"
                    ? "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    : "ml-auto bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
                }`}
              >
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
                  {chatMessage.role === "assistant" ? <Bot className="h-3.5 w-3.5" /> : <MessageSquareText className="h-3.5 w-3.5" />}
                  {chatMessage.role === "assistant" ? "Factibiz AI" : "Tú"}
                </div>
                {chatMessage.content}
              </div>
            ))}
            {loading ? (
              <div className="max-w-[88%] rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  La IA está pensando la siguiente pregunta...
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-6">
            <div className="mb-3 flex flex-wrap gap-2">
              {session.quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => sendUserMessage(reply)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-950"
                >
                  {reply}
                </button>
              ))}
            </div>
            <div className="grid gap-3">
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Responde en lenguaje natural. Ejemplo: quiero abrir una pizzería para estudiantes en Santiago, cerca de universidades, con ticket medio y fuerte foco en delivery."
                className="min-h-[120px]"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  La IA hace preguntas didácticas, extrae datos y te lleva a un informe sin obligarte a llenar cada campo manualmente.
                </p>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={generateReport} disabled={reportLoading}>
                    {reportLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ClipboardList className="mr-2 h-4 w-4" />}
                    Generar informe ahora
                  </Button>
                  <Button onClick={() => sendUserMessage(message)} disabled={loading || !message.trim()}>
                    Enviar a la IA
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Guía didáctica
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
              Qué está haciendo la IA ahora
            </h3>
            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{session.didacticTip}</p>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Siguiente foco sugerido</p>
              <p className="mt-2 font-medium text-slate-950 dark:text-slate-50">{session.recommendedNextFocus}</p>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Reporte preliminar
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                  Lo que ya puede estimarse
                </h3>
              </div>
              <ScoreBadge
                score={previewSnapshot.scoreBreakdown.finalScore}
                classification={previewSnapshot.scoreBreakdown.classification}
              />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {previewSnapshot.insights.executiveSummary}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Inversión estimada</p>
                <p className="mt-2 font-semibold text-slate-950 dark:text-slate-50">
                  {formatMoney(mergedInput.initialInvestment, mergedInput.country)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Ventas mensuales</p>
                <p className="mt-2 font-semibold text-slate-950 dark:text-slate-50">
                  {formatMoney(mergedInput.monthlySalesProjection, mergedInput.country)}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Borrador estructurado
            </p>
            <div className="mt-5 grid gap-3">
              {[
                ["Proyecto", mergedInput.projectName || "Por definir"],
                ["Tipo", mergedInput.businessType || "Por definir"],
                ["Rubro", mergedInput.sector || "Por definir"],
                ["Ubicación", `${mergedInput.city || "Ciudad"} · ${mergedInput.country || "País"}`],
                ["Cliente", mergedInput.targetAudience || "Por definir"],
                ["Posicionamiento", mergedInput.priceRange]
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="mt-2 text-sm font-medium text-slate-950 dark:text-slate-50">{value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Sensibilidad del análisis
            </p>
            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={() => setWeightPreset("balanceado")}
                className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                  weightPreset === "balanceado"
                    ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950"
                    : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                Balanceado: lectura general para presentación académica.
              </button>
              <button
                type="button"
                onClick={() => setWeightPreset("mercado")}
                className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                  weightPreset === "mercado"
                    ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950"
                    : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                Mercado primero: prioriza demanda, contexto y tracción comercial.
              </button>
              <button
                type="button"
                onClick={() => setWeightPreset("conservador")}
                className={`rounded-2xl border px-4 py-3 text-left text-sm ${
                  weightPreset === "conservador"
                    ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950"
                    : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                Conservador: castiga más finanzas y ejecución antes de recomendar avanzar.
              </button>
            </div>
          </Card>

          <Card>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Aún conviene aclarar
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {session.missingFields.length > 0 ? (
                session.missingFields.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Ya hay base suficiente para generar informe
                </span>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
