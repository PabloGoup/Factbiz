"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Bot, Download, Printer } from "lucide-react";

import { BlocksBarChart } from "@/components/charts/blocks-bar-chart";
import { FinalScoreDonut } from "@/components/charts/final-score-donut";
import { SalesProjectionChart } from "@/components/charts/sales-projection-chart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ScoreBadge } from "@/components/ui/score-badge";
import { buildEvaluationSnapshot } from "@/lib/evaluation";
import { printCurrentPage } from "@/lib/report/export";
import { getStoredEvaluation, setStoredEvaluation } from "@/lib/storage";
import { formatDate, formatMoney, getCurrencyByCountry } from "@/lib/utils";
import { demoProjects } from "@/data/demoProjects";
import type { EvaluationSnapshot } from "@/types";

export function ReportPage() {
  const [snapshot, setSnapshot] = useState<EvaluationSnapshot | null>(null);

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
          <Button variant="secondary" onClick={printCurrentPage}>
            <Printer className="mr-2 h-4 w-4" />
            Vista de impresión
          </Button>
          <Button onClick={printCurrentPage}>
            <Download className="mr-2 h-4 w-4" />
            Descargar informe PDF
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
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                <Bot className="h-3.5 w-3.5" />
                {snapshot.insights.source === "openai"
                  ? `OpenAI${snapshot.insights.model ? ` · ${snapshot.insights.model}` : ""}`
                  : "Simulación local"}
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{snapshot.insights.executiveSummary}</p>
              <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{snapshot.insights.conclusion}</p>
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
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Clasificación</p>
                  <p className="mt-2 font-medium text-slate-950 dark:text-slate-50">{snapshot.scoreBreakdown.classification}</p>
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

        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Metodología usada
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
            El informe combina una matriz multicriterio compuesta por SEPTE, Porter, FODA, mercado, finanzas y
            operación / legalidad. Cada bloque recibe un peso configurable y se descompone en subdimensiones
            evaluadas con entradas del usuario y contexto automático por ubicación.
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{snapshot.insights.methodologyNote}</p>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Scores por bloque
            </p>
            <BlocksBarChart blocks={snapshot.scoreBreakdown.blocks} />
          </Card>
          <Card>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Proyección simple de ventas
            </p>
            <SalesProjectionChart
              data={snapshot.scoreBreakdown.salesProjection}
              currency={getCurrencyByCountry(snapshot.input.country)}
            />
          </Card>
        </div>

        <Card>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Datos clave del proyecto
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Tipo</p>
              <p className="mt-2 font-medium text-slate-950 dark:text-slate-50">{snapshot.input.businessType}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Rubro</p>
              <p className="mt-2 font-medium text-slate-950 dark:text-slate-50">{snapshot.input.sector}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Inversión</p>
              <p className="mt-2 font-medium text-slate-950 dark:text-slate-50">
                {formatMoney(snapshot.input.initialInvestment, snapshot.input.country)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Ventas proyectadas</p>
              <p className="mt-2 font-medium text-slate-950 dark:text-slate-50">
                {formatMoney(snapshot.input.monthlySalesProjection, snapshot.input.country)}
              </p>
            </div>
          </div>
        </Card>

        {snapshot.scoreBreakdown.blocks.map((block) => (
          <Card key={block.id}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Detalle
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{block.label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{block.summary}</p>
              </div>
              <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
                {block.score.toFixed(1)} / 10
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
          </Card>
        ))}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Riesgos principales
            </p>
            <div className="mt-5 grid gap-3">
              {snapshot.insights.principalRisks.map((risk) => (
                <div key={`${risk.relatedBlock}-${risk.title}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
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
              Recomendaciones finales
            </p>
            <div className="mt-5 grid gap-3">
              {snapshot.insights.recommendations.map((recommendation) => (
                <div key={recommendation} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  {recommendation}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </article>
    </div>
  );
}
