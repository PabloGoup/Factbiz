"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Printer } from "lucide-react";

import { BlocksBarChart } from "@/components/charts/blocks-bar-chart";
import { BlocksRadarChart } from "@/components/charts/blocks-radar-chart";
import { FinalScoreDonut } from "@/components/charts/final-score-donut";
import { RiskBalanceChart } from "@/components/charts/risk-balance-chart";
import { SalesProjectionChart } from "@/components/charts/sales-projection-chart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ScoreBadge } from "@/components/ui/score-badge";
import { demoProjects } from "@/data/demoProjects";
import { buildEvaluationSnapshot } from "@/lib/evaluation";
import { printCurrentPage } from "@/lib/report/export";
import { getStoredEvaluation, setStoredEvaluation } from "@/lib/storage";
import { formatDate, getCurrencyByCountry } from "@/lib/utils";
import type { EvaluationSnapshot } from "@/types";

type ReportTabId =
  | "resumen"
  | "score"
  | "metodologia"
  | "contexto"
  | "investigacion"
  | "fuentes"
  | "graficos"
  | "septe"
  | "porter"
  | "foda"
  | "mercado"
  | "finanzas"
  | "operacionLegalidad"
  | "conclusion"
  | "recomendaciones";

function normalizeParagraph(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/[.:;,\-–—]+$/g, "")
    .trim()
    .toLowerCase();
}

function collectUniqueParagraphs(...values: string[]) {
  const collected: { raw: string; normalized: string }[] = [];

  values
    .flatMap((value) => value.split(/\n{2,}|\n/))
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const normalized = normalizeParagraph(item);
      if (!normalized) {
        return;
      }

      const existingIndex = collected.findIndex(({ normalized: existing }) => {
        return existing === normalized || existing.includes(normalized) || normalized.includes(existing);
      });

      if (existingIndex === -1) {
        collected.push({ raw: item, normalized });
        return;
      }

      if (normalized.length > collected[existingIndex].normalized.length) {
        collected[existingIndex] = { raw: item, normalized };
      }
    });

  return collected.map((item) => item.raw);
}

function ReportSection({
  title,
  children,
  className = ""
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`space-y-6 ${className}`.trim()}>
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{title}</p>
      {children}
    </section>
  );
}

export function ReportPage() {
  const [snapshot, setSnapshot] = useState<EvaluationSnapshot | null>(null);
  const [activeTab, setActiveTab] = useState<ReportTabId>("resumen");

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

  if (!snapshot) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <EmptyState
          title="No hay un informe disponible"
          description="Genera una evaluación o carga una demo para abrir el informe ejecutivo."
        />
      </div>
    );
  }

  const contextMetrics = [
    ["Turismo", snapshot.context.tourismLevel],
    ["Flujo comercial", snapshot.context.commercialFlow],
    ["Presión competitiva", snapshot.context.competitivePressure],
    ["Estabilidad económica", snapshot.context.economicStability],
    ["Sensibilidad al precio", snapshot.context.priceSensitivity],
    ["Digitalización", snapshot.context.digitalizationLevel],
    ["Atractivo del mercado", snapshot.context.marketAttractiveness]
  ] as const;
  const tabs: { id: ReportTabId; label: string }[] = [
    { id: "resumen", label: "Resumen" },
    { id: "score", label: "Score final" },
    { id: "metodologia", label: "Metodología" },
    { id: "contexto", label: "Contexto" },
    { id: "investigacion", label: "Investigación" },
    { id: "fuentes", label: "Fuentes" },
    { id: "graficos", label: "Gráficos" },
    { id: "septe", label: "SEPTE" },
    { id: "porter", label: "Porter" },
    { id: "foda", label: "FODA" },
    { id: "mercado", label: "Mercado" },
    { id: "finanzas", label: "Finanzas" },
    { id: "operacionLegalidad", label: "Operación" },
    { id: "conclusion", label: "Conclusión" },
    { id: "recomendaciones", label: "Recomendaciones" }
  ];
  const executiveParagraphs = collectUniqueParagraphs(
    snapshot.insights.executiveSummary,
    snapshot.insights.reportNarrative.scoreSummary
  );
  const headerExecutiveParagraphs = executiveParagraphs.slice(0, 2);
  const summarySupportParagraphs = executiveParagraphs.slice(2);
  const positivesCount = snapshot.scoreBreakdown.blocks.reduce((sum, block) => sum + block.positives.length, 0);
  const risksCount = snapshot.scoreBreakdown.blocks.reduce((sum, block) => sum + block.risks.length, 0);

  const renderTabContent = (tabId: ReportTabId) => {
    const activeBlock =
      tabId === "septe" ||
      tabId === "porter" ||
      tabId === "foda" ||
      tabId === "mercado" ||
      tabId === "finanzas" ||
      tabId === "operacionLegalidad"
        ? snapshot.scoreBreakdown.blocks.find((block) => block.id === tabId)
        : null;

    if (tabId === "resumen") {
      return (
        <ReportSection title="Resumen ejecutivo">
          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Hallazgos principales
              </p>
              <div className="mt-5 grid gap-3">
                {snapshot.insights.mainFindings.map((finding) => (
                  <div
                    key={finding}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {finding}
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Lectura ejecutiva
              </p>
              <div className="mt-4 space-y-4">
                {summarySupportParagraphs.length ? (
                  summarySupportParagraphs.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {snapshot.insights.scoreExplanation}
                  </p>
                )}
              </div>
            </Card>
          </div>
        </ReportSection>
      );
    }

    if (tabId === "score") {
      return (
        <ReportSection title="Score final">
          <Card>
            <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-center">
              <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                <ScoreBadge
                  score={snapshot.scoreBreakdown.finalScore}
                  classification={snapshot.scoreBreakdown.classification}
                />
                <FinalScoreDonut score={snapshot.scoreBreakdown.finalScore} />
              </div>
              <div>
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {snapshot.insights.reportNarrative.scoreSummary}
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {snapshot.insights.scoreExplanation}
                </p>
              </div>
            </div>
          </Card>
        </ReportSection>
      );
    }

    if (tabId === "metodologia") {
      return (
        <ReportSection title="Metodología">
          <Card>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              {snapshot.insights.reportNarrative.methodology}
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {snapshot.insights.methodologyNote}
            </p>
          </Card>
        </ReportSection>
      );
    }

    if (tabId === "contexto") {
      return (
        <ReportSection title="Contexto territorial">
          <Card>
            <h2 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">
              {snapshot.context.city}, {snapshot.context.region}, {snapshot.context.country}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {snapshot.insights.reportNarrative.contextSummary}
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              {contextMetrics.map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">
                    {Number(value).toFixed(1)}/10
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </ReportSection>
      );
    }

    if (tabId === "investigacion") {
      return (
        <ReportSection title="Investigación">
          <div className="space-y-6">
            <Card>
              <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                {snapshot.research?.projectSummary ??
                  "Aún no hay expediente académico enriquecido para este caso. Usa la opción de investigación asistida para generar hallazgos, fuentes y variables que alimenten el score."}
              </p>
            </Card>

            {snapshot.research ? (
              <div className="grid gap-6">
                {[
                  ["Macro y microentorno", snapshot.research.sections.macroMicro],
                  ["FODA", snapshot.research.sections.foda],
                  ["Ventaja competitiva", snapshot.research.sections.competitiveAdvantage],
                  ["Estudio de mercado", snapshot.research.sections.marketStudy],
                  ["Competencia", snapshot.research.sections.competitionStudy],
                  ["Promoción", snapshot.research.sections.promotionPlan],
                  ["Operación y RRHH", snapshot.research.sections.operationAndHR],
                  ["Legalidad y barreras", snapshot.research.sections.legalBarriers],
                  ["Conclusión académica", snapshot.research.sections.conclusion]
                ].map(([label, value]) => (
                  <Card key={label}>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {label}
                    </p>
                    <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{value}</p>
                  </Card>
                ))}
              </div>
            ) : null}
          </div>
        </ReportSection>
      );
    }

    if (tabId === "fuentes") {
      return (
        <ReportSection title="Fuentes y trazabilidad">
          <div className="space-y-6">
            <Card>
              {snapshot.research?.sources?.length ? (
                <div className="grid gap-3">
                  {snapshot.research.sources.map((source) => (
                    <div
                      key={`${source.title}-${source.url}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <p className="font-medium text-slate-950 dark:text-slate-50">{source.title}</p>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block text-sm text-blue-700 underline dark:text-blue-300"
                      >
                        {source.url}
                      </a>
                      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{source.note}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                  Aún no hay fuentes visibles porque este caso no se generó desde la investigación asistida.
                </p>
              )}
            </Card>

            {snapshot.research?.scoringInferences?.length ? (
              <Card>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Variables inferidas para el scoring
                </p>
                <div className="mt-5 grid gap-3">
                  {snapshot.research.scoringInferences.map((item) => (
                    <div
                      key={`${item.variable}-${item.rationale}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-medium text-slate-950 dark:text-slate-50">{item.variable}</p>
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
                          {String(item.value)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.rationale}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>
        </ReportSection>
      );
    }

    if (tabId === "graficos") {
      return (
        <ReportSection title="Gráficos y visualizaciones">
          <Card>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              {snapshot.insights.reportNarrative.chartsSummary}
            </p>
          </Card>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Score final
              </p>
              <FinalScoreDonut score={snapshot.scoreBreakdown.finalScore} />
            </Card>
            <Card>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Radar de bloques
              </p>
              <BlocksRadarChart blocks={snapshot.scoreBreakdown.blocks} />
            </Card>
            <Card>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Scores por bloque
              </p>
              <BlocksBarChart blocks={snapshot.scoreBreakdown.blocks} />
            </Card>
            <Card>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Balance positivos / riesgos
              </p>
              <RiskBalanceChart positives={positivesCount} risks={risksCount} />
            </Card>
            <Card className="md:col-span-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Proyección simple de ventas
              </p>
              <SalesProjectionChart
                data={snapshot.scoreBreakdown.salesProjection}
                currency={getCurrencyByCountry(snapshot.input.country)}
              />
            </Card>
          </div>
        </ReportSection>
      );
    }

    if (activeBlock) {
      return (
        <ReportSection title={activeBlock.label}>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{activeBlock.label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {snapshot.insights.reportNarrative.blockNarratives[activeBlock.id].summary}
                </p>
              </div>
              <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
                {activeBlock.score.toFixed(1)} / 10
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Análisis desarrollado
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {snapshot.insights.reportNarrative.blockNarratives[activeBlock.id].detailedAnalysis}
              </p>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Lecturas favorables
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {snapshot.insights.reportNarrative.blockNarratives[activeBlock.id].positives.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Alertas
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {snapshot.insights.reportNarrative.blockNarratives[activeBlock.id].risks.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Recomendación
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {snapshot.insights.reportNarrative.blockNarratives[activeBlock.id].recommendation}
                </p>
              </div>
            </div>
            <div className="mt-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Subdimensiones analizadas
              </p>
              <div className="mt-4 grid gap-4">
                {snapshot.insights.reportNarrative.blockNarratives[activeBlock.id].factorNarratives.map((factor) => (
                  <div
                    key={`${activeBlock.id}-${factor.label}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-slate-950 dark:text-slate-50">{factor.label}</h3>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        {factor.headline}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{factor.assessment}</p>
                    <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                      <span className="font-semibold">Impacto en el proyecto:</span> {factor.impact}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="pb-3">Subdimensión</th>
                    <th className="pb-3">Score</th>
                    <th className="pb-3">Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  {activeBlock.factors.map((factor) => (
                    <tr key={factor.id} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="py-3 font-medium text-slate-900 dark:text-slate-50">{factor.label}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{factor.score.toFixed(1)}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{factor.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </ReportSection>
      );
    }

    if (tabId === "conclusion") {
      return (
        <ReportSection title="Conclusión">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Riesgos principales
              </p>
              <div className="mt-5 grid gap-3">
                {snapshot.insights.principalRisks.map((risk) => (
                  <div
                    key={`${risk.relatedBlock}-${risk.title}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium text-slate-950 dark:text-slate-50">{risk.title}</p>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase text-amber-900 dark:bg-amber-950/60 dark:text-amber-100">
                        {risk.severity}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{risk.detail}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Conclusión final
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {snapshot.insights.conclusion}
              </p>
            </Card>
          </div>
        </ReportSection>
      );
    }

    return (
      <ReportSection title="Recomendaciones">
        <Card>
          <div className="grid gap-3">
            {snapshot.insights.recommendations.map((recommendation) => (
              <div
                key={recommendation}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                {recommendation}
              </div>
            ))}
          </div>
        </Card>
      </ReportSection>
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-4">
        <Link href="/resultado">
          <Button variant="secondary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al dashboard
          </Button>
        </Link>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => printCurrentPage(snapshot.input.projectName)}>
            <Printer className="mr-2 h-4 w-4" />
            Vista de impresión
          </Button>
          <Button onClick={() => printCurrentPage(snapshot.input.projectName)}>
            <Download className="mr-2 h-4 w-4" />
            Descargar informe completo
          </Button>
        </div>
      </div>

      <article className="space-y-6">
        <Card className="overflow-hidden p-0">
          <div className="bg-slate-900 px-8 py-10 text-white dark:bg-slate-100 dark:text-slate-950">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] opacity-80">Informe ejecutivo</p>
            <h1 className="mt-4 font-serif text-5xl font-semibold tracking-tight">{snapshot.input.projectName}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 opacity-80">{snapshot.input.description}</p>
          </div>
          <div className="grid gap-6 px-8 py-8 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Resumen ejecutivo
              </p>
              <div className="mt-4 space-y-4">
                {headerExecutiveParagraphs.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Fecha</p>
                  <p className="mt-2 font-medium text-slate-950 dark:text-slate-50">{formatDate(snapshot.generatedAt)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Ubicación</p>
                  <p className="mt-2 font-medium text-slate-950 dark:text-slate-50">{snapshot.input.city}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Clasificación
                  </p>
                  <p className="mt-2 font-medium text-slate-950 dark:text-slate-50">
                    {snapshot.scoreBreakdown.classification}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-[32px] border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
              <ScoreBadge
                score={snapshot.scoreBreakdown.finalScore}
                classification={snapshot.scoreBreakdown.classification}
              />
              <FinalScoreDonut score={snapshot.scoreBreakdown.finalScore} />
            </div>
          </div>
        </Card>

        <Card className="no-print p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Explorador del informe
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            En pantalla puedes navegar por pestañas. Al descargar en PDF, la app imprime todas las secciones y todos los gráficos en un solo documento.
          </p>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "primary" : "secondary"}
                className="whitespace-nowrap px-3 py-2 text-xs"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </Card>

        <div className="no-print">{renderTabContent(activeTab)}</div>

        <div className="print-only space-y-8">
          {tabs.map((tab) => (
            <div key={tab.id} className="report-page-break">
              {renderTabContent(tab.id)}
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
