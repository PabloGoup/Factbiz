"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileUp, Loader2, RefreshCcw, Scale, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScoreBadge } from "@/components/ui/score-badge";
import { Textarea } from "@/components/ui/textarea";
import { parseImportedProjectFile } from "@/lib/report/import";
import { formatDate, formatMoney } from "@/lib/utils";
import type { EvaluationSnapshot } from "@/types";

type SlotId = "left" | "right";
type SlotSource = "current" | "file" | "text" | "empty";

type ComparisonSlot = {
  snapshot: EvaluationSnapshot | null;
  text: string;
  loading: boolean;
  error: string | null;
  note: string | null;
  source: SlotSource;
  fileName: string | null;
};

function createEmptySlot(): ComparisonSlot {
  return {
    snapshot: null,
    text: "",
    loading: false,
    error: null,
    note: null,
    source: "empty",
    fileName: null
  };
}

function createCurrentSlot(snapshot: EvaluationSnapshot): ComparisonSlot {
  return {
    snapshot,
    text: "",
    loading: false,
    error: null,
    note: "Se está usando la evaluación actual del dashboard.",
    source: "current",
    fileName: null
  };
}

function getSlotTitle(side: SlotId) {
  return side === "left" ? "Proyecto A" : "Proyecto B";
}

function getBetterProjectLabel(
  leftSnapshot: EvaluationSnapshot,
  rightSnapshot: EvaluationSnapshot
) {
  if (leftSnapshot.scoreBreakdown.finalScore === rightSnapshot.scoreBreakdown.finalScore) {
    return "Empate técnico";
  }

  return leftSnapshot.scoreBreakdown.finalScore > rightSnapshot.scoreBreakdown.finalScore
    ? leftSnapshot.input.projectName
    : rightSnapshot.input.projectName;
}

async function buildSnapshotFromText(content: string) {
  const response = await fetch("/api/project-import", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content
    })
  });

  if (!response.ok) {
    const payload = (await response.json()) as { error?: string };
    throw new Error(payload.error ?? "No fue posible estructurar el proyecto importado.");
  }

  return (await response.json()) as {
    snapshot: EvaluationSnapshot;
    note: string;
    mode: "gemini" | "fallback";
    missingFields: string[];
  };
}

function SlotSummary({
  slot,
  label,
  onUseAsCurrent
}: {
  slot: ComparisonSlot;
  label: string;
  onUseAsCurrent: () => void;
}) {
  if (!slot.snapshot) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-sm leading-6 text-slate-500 dark:border-slate-800 dark:text-slate-400">
        Carga un archivo, pega un texto o usa la evaluación actual para construir este lado de la comparativa.
      </div>
    );
  }

  const snapshot = slot.snapshot;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
            <h4 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">
              {snapshot.input.projectName}
            </h4>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {snapshot.input.city}, {snapshot.input.country}
            </p>
          </div>
          <ScoreBadge
            score={snapshot.scoreBreakdown.finalScore}
            classification={snapshot.scoreBreakdown.classification}
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Inversión</p>
            <p className="mt-1.5 text-sm font-semibold text-slate-950 dark:text-slate-50">
              {formatMoney(snapshot.input.initialInvestment, snapshot.input.country)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Ventas mensuales
            </p>
            <p className="mt-1.5 text-sm font-semibold text-slate-950 dark:text-slate-50">
              {formatMoney(snapshot.input.monthlySalesProjection, snapshot.input.country)}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {snapshot.insights.mainFindings[0] ?? snapshot.insights.executiveSummary}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={onUseAsCurrent}>
          <Download className="mr-2 h-4 w-4" />
          Cargar en la app
        </Button>
        <p className="self-center text-xs text-slate-500 dark:text-slate-400">
          Generado el {formatDate(snapshot.generatedAt)}
        </p>
      </div>
    </div>
  );
}

export function ProjectComparisonStudio({
  currentSnapshot,
  onLoadSnapshot
}: {
  currentSnapshot?: EvaluationSnapshot | null;
  onLoadSnapshot: (snapshot: EvaluationSnapshot) => void;
}) {
  const [leftSlot, setLeftSlot] = useState<ComparisonSlot>(
    currentSnapshot ? createCurrentSlot(currentSnapshot) : createEmptySlot()
  );
  const [rightSlot, setRightSlot] = useState<ComparisonSlot>(createEmptySlot());

  useEffect(() => {
    if (!currentSnapshot) {
      return;
    }

    setLeftSlot((current) => {
      if (current.source !== "current" && current.snapshot) {
        return current;
      }

      return createCurrentSlot(currentSnapshot);
    });
  }, [currentSnapshot]);

  const comparison = useMemo(() => {
    if (!leftSlot.snapshot || !rightSlot.snapshot) {
      return null;
    }

    const leftSnapshot = leftSlot.snapshot;
    const rightSnapshot = rightSlot.snapshot;
    const blocks = leftSnapshot.scoreBreakdown.blocks.map((block) => {
      const otherBlock = rightSnapshot.scoreBreakdown.blocks.find((item) => item.id === block.id);
      const delta = block.score - (otherBlock?.score ?? 0);

      return {
        id: block.id,
        label: block.label,
        delta,
        leftScore: block.score,
        rightScore: otherBlock?.score ?? 0
      };
    });

    const mainGap = [...blocks].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];

    return {
      winner: getBetterProjectLabel(leftSnapshot, rightSnapshot),
      scoreDelta: leftSnapshot.scoreBreakdown.finalScore - rightSnapshot.scoreBreakdown.finalScore,
      blocks,
      mainGap
    };
  }, [leftSlot.snapshot, rightSlot.snapshot]);

  const updateSlot = (side: SlotId, updater: (slot: ComparisonSlot) => ComparisonSlot) => {
    if (side === "left") {
      setLeftSlot(updater);
      return;
    }

    setRightSlot(updater);
  };

  const runTextImport = async (side: SlotId, textOverride?: string, notePrefix?: string) => {
    const currentText = (side === "left" ? leftSlot.text : rightSlot.text).trim();
    const content = textOverride?.trim() ?? currentText;

    if (!content) {
      updateSlot(side, (slot) => ({
        ...slot,
        error: "Escribe una descripción o sube un archivo antes de analizar."
      }));
      return;
    }

    updateSlot(side, (slot) => ({
      ...slot,
      loading: true,
      error: null
    }));

    try {
      const result = await buildSnapshotFromText(content);

      updateSlot(side, (slot) => ({
        ...slot,
        snapshot: result.snapshot,
        loading: false,
        error: null,
        note: notePrefix ? `${notePrefix} ${result.note}` : result.note,
        source: textOverride ? "file" : "text",
        fileName: textOverride ? slot.fileName : null
      }));
    } catch (error) {
      updateSlot(side, (slot) => ({
        ...slot,
        loading: false,
        error: error instanceof Error ? error.message : "No fue posible analizar este proyecto."
      }));
    }
  };

  const handleFileSelection = async (side: SlotId, file: File | null) => {
    if (!file) {
      return;
    }

    updateSlot(side, (slot) => ({
      ...slot,
      loading: true,
      error: null,
      fileName: file.name
    }));

    try {
      const parsed = await parseImportedProjectFile(file);

      if (parsed.kind === "snapshot") {
        updateSlot(side, (slot) => ({
          ...slot,
          snapshot: parsed.snapshot,
          loading: false,
          error: null,
          note: parsed.note,
          source: "file"
        }));
        return;
      }

      updateSlot(side, (slot) => ({
        ...slot,
        text: parsed.text,
        note: parsed.note
      }));
      await runTextImport(side, parsed.text, parsed.note);
    } catch (error) {
      updateSlot(side, (slot) => ({
        ...slot,
        loading: false,
        error: error instanceof Error ? error.message : "No fue posible cargar el archivo."
      }));
    }
  };

  const applyCurrentSnapshot = (side: SlotId) => {
    if (!currentSnapshot) {
      updateSlot(side, (slot) => ({
        ...slot,
        error: "No hay una evaluación actual para reutilizar."
      }));
      return;
    }

    updateSlot(side, () => createCurrentSlot(currentSnapshot));
  };

  const resetSlot = (side: SlotId) => {
    if (side === "left" && currentSnapshot) {
      setLeftSlot(createCurrentSlot(currentSnapshot));
      return;
    }

    updateSlot(side, () => createEmptySlot());
  };

  const analyzeBothTexts = async () => {
    await Promise.all([runTextImport("left"), runTextImport("right")]);
  };

  const renderSlot = (side: SlotId, slot: ComparisonSlot) => {
    return (
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {getSlotTitle(side)}
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
              Archivo o texto libre
            </h3>
          </div>
          <Button variant="ghost" onClick={() => resetSlot(side)}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reiniciar
          </Button>
        </div>

        <div className="mt-5 grid gap-3">
          <label className="rounded-2xl border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500">
            <span className="flex items-center gap-2 font-medium text-slate-900 dark:text-slate-50">
              <FileUp className="h-4 w-4" />
              Subir PDF, JSON o TXT
            </span>
            <span className="mt-2 block text-xs text-slate-500 dark:text-slate-400">
              Si subes un JSON exportado por la app, conserva el informe completo. Un PDF o TXT se reinterpreta.
            </span>
            <Input
              className="mt-4"
              type="file"
              accept=".json,.pdf,.txt,.md"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                void handleFileSelection(side, file);
                event.currentTarget.value = "";
              }}
            />
          </label>

          <Textarea
            value={slot.text}
            onChange={(event) =>
              updateSlot(side, (current) => ({
                ...current,
                text: event.target.value,
                error: null
              }))
            }
            placeholder="Pega aquí la descripción del proyecto o el contenido resumido del informe para evaluarlo y compararlo."
            className="min-h-[180px]"
          />

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => void runTextImport(side)} disabled={slot.loading}>
              {slot.loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Analizar texto
            </Button>
            <Button variant="secondary" onClick={() => applyCurrentSnapshot(side)} disabled={!currentSnapshot}>
              <Download className="mr-2 h-4 w-4" />
              Usar proyecto actual
            </Button>
          </div>

          {slot.fileName ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">Archivo cargado: {slot.fileName}</p>
          ) : null}
          {slot.note ? <p className="text-xs text-slate-500 dark:text-slate-400">{slot.note}</p> : null}
          {slot.error ? <p className="text-sm text-red-600 dark:text-red-400">{slot.error}</p> : null}

          <SlotSummary slot={slot} label={getSlotTitle(side)} onUseAsCurrent={() => slot.snapshot && onLoadSnapshot(slot.snapshot)} />
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-5">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Estudio comparativo
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
              Compara dos proyectos con archivo o texto libre
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Puedes cargar informes exportados por la app, subir PDFs o escribir dos proyectos en paralelo para
              contrastar score, bloques y lectura ejecutiva. Cualquier resultado también puede cargarse como evaluación activa.
            </p>
          </div>
          <Button variant="secondary" onClick={() => void analyzeBothTexts()} disabled={leftSlot.loading || rightSlot.loading}>
            <Scale className="mr-2 h-4 w-4" />
            Analizar ambos textos
          </Button>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        {renderSlot("left", leftSlot)}
        {renderSlot("right", rightSlot)}
      </div>

      <Card className="p-5 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Resultado de la comparación
        </p>

        {comparison ? (
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Mejor lectura global
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">{comparison.winner}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Brecha de score
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">
                  {comparison.scoreDelta >= 0 ? "+" : ""}
                  {comparison.scoreDelta.toFixed(1)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Mayor diferencia
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">
                  {comparison.mainGap?.label ?? "Sin diferencias"}
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {comparison.blocks.map((block) => (
                <div
                  key={block.id}
                  className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_auto_auto_auto]"
                >
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-slate-50">{block.label}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      A: {block.leftScore.toFixed(1)} | B: {block.rightScore.toFixed(1)}
                    </p>
                  </div>
                  <span className="text-slate-500 dark:text-slate-400">Diferencia</span>
                  <span
                    className={
                      block.delta >= 0
                        ? "font-semibold text-emerald-700 dark:text-emerald-300"
                        : "font-semibold text-red-700 dark:text-red-300"
                    }
                  >
                    {block.delta >= 0 ? "+" : ""}
                    {block.delta.toFixed(1)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {block.delta >= 0 ? "Favorece A" : "Favorece B"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Cuando tengas dos proyectos estructurados, aquí verás la brecha total, el bloque que más los separa y una lectura comparativa por dimensión.
          </p>
        )}
      </Card>
    </div>
  );
}
