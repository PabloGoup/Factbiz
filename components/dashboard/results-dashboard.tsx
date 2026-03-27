"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Copy, Download, FileText, RefreshCcw } from "lucide-react";

import { BlocksBarChart } from "@/components/charts/blocks-bar-chart";
import { BlocksRadarChart } from "@/components/charts/blocks-radar-chart";
import { FinalScoreDonut } from "@/components/charts/final-score-donut";
import { RiskBalanceChart } from "@/components/charts/risk-balance-chart";
import { SalesProjectionChart } from "@/components/charts/sales-projection-chart";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScoreBadge } from "@/components/ui/score-badge";
import { demoProjectList, demoProjects } from "@/data/demoProjects";
import { serializeEvaluationForClipboard } from "@/lib/ai/aiInsights";
import { buildEvaluationSnapshot } from "@/lib/evaluation";
import { downloadEvaluationJson } from "@/lib/report/export";
import { getStoredEvaluation, setStoredEvaluation } from "@/lib/storage";
import { formatDate, formatMoney, getCurrencyByCountry } from "@/lib/utils";
import type { EvaluationSnapshot } from "@/types";

export function ResultsDashboard() {
  const [snapshot, setSnapshot] = useState<EvaluationSnapshot | null>(null);
  const [comparisonId, setComparisonId] = useState<string>(demoProjectList[0]?.id ?? "");
  const [copied, setCopied] = useState(false);
  const [insightStatus, setInsightStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [insightMessage, setInsightMessage] = useState<string | null>(null);
  const requestedRef = useRef(false);

  useEffect(() => {
    const stored = getStoredEvaluation();
    if (stored) {
      setSnapshot(stored);
      return;
    }

    const fallback = buildEvaluationSnapshot(demoProjects.domino_buenos_aires);
    setStoredEvaluation(fallback);
    setSnapshot(fallback);
  }, []);

  const refreshInsights = async (currentSnapshot: EvaluationSnapshot) => {
    setInsightStatus("loading");
    setInsightMessage(null);

    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          input: currentSnapshot.input,
          context: currentSnapshot.context,
          scoreBreakdown: currentSnapshot.scoreBreakdown
        })
      });

      if (!response.ok) {
        const errorPayload = (await response.json()) as { error?: string };
        throw new Error(errorPayload.error ?? "No fue posible generar insights.");
      }

      const payload = (await response.json()) as {
        insights: EvaluationSnapshot["insights"];
        mode: "mock" | "gemini";
      };
      const nextSnapshot = {
        ...currentSnapshot,
        insights: payload.insights
      };

      setSnapshot(nextSnapshot);
      setStoredEvaluation(nextSnapshot);
      setInsightStatus("ready");
      setInsightMessage(
        payload.mode === "gemini"
          ? `Insights generados con ${payload.insights.model ?? "modelo configurado"}.`
          : payload.insights.fallbackReason ?? "Se mantuvo la simulación local."
      );
    } catch (error) {
      setInsightStatus("error");
      setInsightMessage(error instanceof Error ? error.message : "No fue posible generar insights.");
    }
  };

  useEffect(() => {
    if (!snapshot || requestedRef.current) return;

    requestedRef.current = true;

    if (snapshot.insights.source === "gemini") {
      setInsightStatus("ready");
      setInsightMessage(`Insights generados con ${snapshot.insights.model ?? "Gemini"}.`);
      return;
    }

    void refreshInsights(snapshot);
  }, [snapshot]);

  const comparisonSnapshot = useMemo(() => {
    if (!comparisonId || !demoProjects[comparisonId]) return null;
    return buildEvaluationSnapshot(demoProjects[comparisonId]);
  }, [comparisonId]);

  if (!snapshot) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState
          title="No hay una evaluación cargada"
          description="Completa el wizard o carga una demo para generar el dashboard ejecutivo."
        />
      </div>
    );
  }

  const positivesCount = snapshot.scoreBreakdown.blocks.reduce((sum, block) => sum + block.positives.length, 0);
  const risksCount = snapshot.scoreBreakdown.blocks.reduce((sum, block) => sum + block.risks.length, 0);
  const contextMetrics = [
    ["Turismo", snapshot.context.tourismLevel],
    ["Flujo comercial", snapshot.context.commercialFlow],
    ["Competencia", snapshot.context.competitivePressure],
    ["Estabilidad", snapshot.context.economicStability],
    ["Sensibilidad precio", snapshot.context.priceSensitivity],
    ["Facilidad regulatoria", snapshot.context.regulatoryEase]
  ] as const;
  const executiveSentences =
    snapshot.insights.executiveSummary.match(/[^.!?]+[.!?]?/g)?.map((sentence) => sentence.trim()).filter(Boolean) ?? [];
  const executiveLead = executiveSentences.slice(0, 2).join(" ");
  const topInsightCards = [
    {
      label: "Lectura principal",
      value: snapshot.insights.mainFindings[0] ?? snapshot.scoreBreakdown.interpretation
    },
    {
      label: "Riesgo crítico",
      value: snapshot.insights.principalRisks[0]?.title ?? "Sin riesgo dominante identificado"
    },
    {
      label: "Siguiente acción",
      value: snapshot.insights.recommendations[0] ?? "Consolidar la validación comercial y operativa."
    }
  ];

  const copySummary = async () => {
    await navigator.clipboard.writeText(serializeEvaluationForClipboard(snapshot));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Dashboard ejecutivo
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
            {snapshot.input.projectName}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Evaluación generada el {formatDate(snapshot.generatedAt)} para {snapshot.input.city}, {snapshot.input.country}.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => snapshot && refreshInsights(snapshot)} disabled={insightStatus === "loading"}>
            <Bot className="mr-2 h-4 w-4" />
            {insightStatus === "loading" ? "Generando insights..." : "Regenerar con IA"}
          </Button>
          <Button variant="secondary" onClick={copySummary}>
            <Copy className="mr-2 h-4 w-4" />
            {copied ? "Resumen copiado" : "Copiar resumen"}
          </Button>
          <Button variant="secondary" onClick={() => downloadEvaluationJson(snapshot)}>
            <Download className="mr-2 h-4 w-4" />
            Exportar JSON
          </Button>
          <Link href="/informe">
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              Abrir informe
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)] xl:items-start">
          <div className="mx-auto w-full max-w-[260px] xl:mx-0">
            <FinalScoreDonut score={snapshot.scoreBreakdown.finalScore} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <ScoreBadge
                score={snapshot.scoreBreakdown.finalScore}
                classification={snapshot.scoreBreakdown.classification}
              />
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <Bot className="h-3.5 w-3.5" />
                {snapshot.insights.source === "gemini" ? "Insights con Gemini" : "Simulación local"}
              </div>
            </div>
            {insightMessage ? (
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{insightMessage}</p>
            ) : null}
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Resumen ejecutivo
              </p>
              <h2 className="mt-2 max-w-4xl text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 sm:text-[2rem]">
                {executiveLead}
              </h2>
            </div>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {snapshot.scoreBreakdown.interpretation}
            </p>
            <div className="mt-4 grid gap-2.5 xl:grid-cols-3">
              {topInsightCards.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Inversión</p>
                <p className="mt-1.5 text-sm font-semibold text-slate-950 dark:text-slate-50">
                  {formatMoney(snapshot.input.initialInvestment, snapshot.input.country)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Ventas mensuales</p>
                <p className="mt-1.5 text-sm font-semibold text-slate-950 dark:text-slate-50">
                  {formatMoney(snapshot.input.monthlySalesProjection, snapshot.input.country)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Ubicación</p>
                <p className="mt-1.5 text-sm font-semibold text-slate-950 dark:text-slate-50">
                  {snapshot.context.city}, {snapshot.context.country}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Contexto</p>
                <p className="mt-1.5 text-sm font-semibold text-slate-950 dark:text-slate-50">{snapshot.context.source}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mt-5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Ubicación y contexto
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
              {snapshot.context.city}, {snapshot.context.country}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{snapshot.context.narrative}</p>
          </div>
          <div className="grid w-full gap-2 sm:grid-cols-3 xl:max-w-3xl xl:grid-cols-6">
            {contextMetrics.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-1.5 text-lg font-semibold text-slate-950 dark:text-slate-50">{Number(value).toFixed(1)}/10</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Radar de bloques
          </p>
          <BlocksRadarChart blocks={snapshot.scoreBreakdown.blocks} />
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Scores por bloque
          </p>
          <BlocksBarChart blocks={snapshot.scoreBreakdown.blocks} />
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Balance positivos / riesgos
          </p>
          <RiskBalanceChart positives={positivesCount} risks={risksCount} />
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Proyección simple de ventas
          </p>
          <SalesProjectionChart
            data={snapshot.scoreBreakdown.salesProjection}
            currency={getCurrencyByCountry(snapshot.input.country)}
          />
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            {snapshot.insights.source === "gemini" ? "Hallazgos con Gemini" : "Hallazgos tipo IA"}
          </p>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Resumen desarrollado</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{snapshot.insights.executiveSummary}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Explicación del score</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{snapshot.insights.scoreExplanation}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Hallazgos principales</h3>
              <div className="mt-3 grid gap-2.5">
                {snapshot.insights.mainFindings.map((item) => (
                  <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Oportunidades</h3>
              <ul className="mt-3 space-y-2.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {snapshot.insights.opportunities.map((item) => (
                  <li key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">Recomendaciones</h3>
              <ul className="mt-3 space-y-2.5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {snapshot.insights.recommendations.map((item) => (
                  <li key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Comparación conceptual
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                Contrasta este caso con otro proyecto demo
              </h3>
            </div>
            <select
              value={comparisonId}
              onChange={(event) => setComparisonId(event.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              {demoProjectList.map(({ id, project }) => (
                <option key={id} value={id}>
                  {project.projectName}
                </option>
              ))}
            </select>
          </div>

          {comparisonSnapshot ? (
            <div className="mt-5 space-y-3">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Proyecto actual</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">{snapshot.input.projectName}</p>
                  <p className="mt-4 font-serif text-4xl font-semibold text-slate-950 dark:text-slate-50">
                    {snapshot.scoreBreakdown.finalScore.toFixed(1)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{snapshot.scoreBreakdown.classification}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Proyecto comparado</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">{comparisonSnapshot.input.projectName}</p>
                  <p className="mt-4 font-serif text-4xl font-semibold text-slate-950 dark:text-slate-50">
                    {comparisonSnapshot.scoreBreakdown.finalScore.toFixed(1)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{comparisonSnapshot.scoreBreakdown.classification}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                  Diferencia: {(snapshot.scoreBreakdown.finalScore - comparisonSnapshot.scoreBreakdown.finalScore).toFixed(1)} puntos
                </p>
                <div className="mt-4 grid gap-2">
                  {snapshot.scoreBreakdown.blocks.map((block) => {
                    const otherBlock = comparisonSnapshot.scoreBreakdown.blocks.find((item) => item.id === block.id);
                    const delta = block.score - (otherBlock?.score ?? 0);

                    return (
                      <div key={block.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950">
                        <span className="font-medium text-slate-900 dark:text-slate-50">{block.label}</span>
                        <span className={delta >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"}>
                          {delta >= 0 ? "+" : ""}
                          {delta.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Riesgos principales
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">Focos de mitigación</h2>
            </div>
            <Link href="/evaluacion">
              <Button variant="secondary">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Ajustar datos
              </Button>
            </Link>
          </div>
          <div className="mt-4 grid gap-2.5">
            {snapshot.insights.principalRisks.map((risk) => (
              <div key={`${risk.relatedBlock}-${risk.title}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-slate-900 dark:text-slate-50">{risk.title}</p>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase text-amber-900 dark:bg-amber-950/60 dark:text-amber-100">
                    {risk.severity}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{risk.detail}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Detalle por bloque
          </p>
          <div className="mt-4 space-y-3">
            {snapshot.scoreBreakdown.blocks.map((block) => (
              <div key={block.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{block.label}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{block.summary}</p>
                  </div>
                  <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
                    {block.score.toFixed(1)} / 10
                  </div>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="pb-2">Factor</th>
                        <th className="pb-2">Score</th>
                        <th className="pb-2">Lectura</th>
                      </tr>
                    </thead>
                    <tbody>
                      {block.factors.map((factor) => (
                        <tr key={factor.id} className="border-t border-slate-200 dark:border-slate-800">
                          <td className="py-3 font-medium text-slate-900 dark:text-slate-50">{factor.label}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{factor.score.toFixed(1)}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{factor.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
