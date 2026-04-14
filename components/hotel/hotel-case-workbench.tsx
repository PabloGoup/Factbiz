"use client";

import type { ComponentType } from "react";
import { useCallback, useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  BedDouble,
  BookOpenText,
  Building2,
  Calculator,
  ChevronRight,
  CircleHelp,
  Download,
  FileSearch,
  Hotel,
  Lightbulb,
  Loader2,
  MapPinned,
  ReceiptText,
  RefreshCcw,
  Save,
  Sparkles,
  Target,
  Trash2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createDefaultHotelCase,
  DEFAULT_HOTEL_CHANNELS,
  HOTEL_CHANNEL_LABELS,
  HOTEL_REFERENCE_CATALOG,
  HOTEL_DESTINATION_OPTIONS,
  HOTEL_DESTINATION_PROFILES,
  normalizeHotelCaseInput
} from "@/lib/hotel/data";
import { normalizeHotelCaseResult } from "@/lib/hotel/forecast";
import {
  clearStoredHotelResult,
  getStoredHotelBenchmarkFilters,
  getStoredHotelBenchmarkResult,
  getStoredHotelCase,
  getStoredHotelResult,
  setStoredHotelBenchmarkFilters,
  setStoredHotelBenchmarkResult,
  setStoredHotelCase,
  setStoredHotelResult
} from "@/lib/storage";
import { downloadHotelExcel, printCurrentPage } from "@/lib/report/export";
import type {
  HotelBenchmarkReport,
  HotelBenchmarkSearchInput,
  HotelCaseInput,
  HotelCaseResult,
  HotelReferenceHotel,
  HotelRecommendation,
  HotelSalesChannelId,
  SavedHotelCaseListItem,
  SavedHotelCaseRecord
} from "@/types";

type HotelWorkbenchTab = "saved" | "benchmarks" | "case" | "research" | "forecast" | "strategy";

const ROOM_TYPE_ORDER = ["single", "double", "triple", "suite"] as const;
const CHANNEL_ORDER = ["tourOperators", "onlineAgencies", "direct", "corporate"] as const;

const ROOM_TYPE_LABELS: Record<(typeof ROOM_TYPE_ORDER)[number], string> = {
  single: "Single",
  double: "Doble",
  triple: "Triple",
  suite: "Suite"
};

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("es-419", {
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("es-419", {
    maximumFractionDigits: 1
  }).format(value)}%`;
}

function formatRoomNightCell(value: number) {
  return new Intl.NumberFormat("es-419", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function downloadHotelResult(result: HotelCaseResult) {
  const blob = new Blob([JSON.stringify(result, null, 2)], {
    type: "application/json"
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${result.input.hotelName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "hotel-case"}-resultado.json`;
  link.click();
  window.URL.revokeObjectURL(url);
}

function GuideCard({
  title,
  description,
  icon: Icon
}: {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-white p-2 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <Icon className="h-4 w-4" />
        </div>
        <p className="font-semibold text-slate-950 dark:text-slate-50">{title}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}

function HelperDetails({
  title,
  children,
  defaultOpen = false
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details
      open={defaultOpen}
      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-900 marker:content-none dark:text-slate-50">
        <span className="inline-flex items-center gap-2">
          <CircleHelp className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          {title}
        </span>
        <ChevronRight className="h-4 w-4 text-slate-400" />
      </summary>
      <div className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{children}</div>
    </details>
  );
}

function SectionIntro({
  step,
  title,
  description
}: {
  step?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      {step ? (
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{step}</p>
      ) : null}
      <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  helper
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{helper}</p>
    </div>
  );
}

function Highlight({
  title,
  text,
  tone = "slate"
}: {
  title: string;
  text: string;
  tone?: "slate" | "amber" | "emerald";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
        : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
    </div>
  );
}

function normalizeRecommendationText(value?: string | null) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.:;,]+$/g, "");
}

function isGenericRecommendationText(value?: string | null) {
  const normalized = normalizeRecommendationText(value);

  return (
    !normalized ||
    normalized === "la proyección solo se cumple si la palanca se ejecuta sin deteriorar ocupación ni tarifa pública" ||
    normalized === "definir indicador, responsable y frecuencia de revisión antes de ejecutar" ||
    normalized === "definir responsable, plazo e indicador de seguimiento antes de implementar"
  );
}

function RecommendationDecisionCard({ recommendation, index }: { recommendation: HotelRecommendation; index: number }) {
  const toneClass =
    recommendation.tone === "amber"
      ? "border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30"
      : recommendation.tone === "emerald"
        ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/30"
        : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900";
  const solution = recommendation.solution?.trim();
  const nextAction = recommendation.nextAction?.trim();
  const assumption = recommendation.assumption?.trim();
  const validationMetric = recommendation.validationMetric?.trim();
  const showSolution = Boolean(solution) && normalizeRecommendationText(solution) !== normalizeRecommendationText(recommendation.text);
  const showAssumption = Boolean(assumption) && !isGenericRecommendationText(assumption);
  const showValidation = Boolean(validationMetric) && !isGenericRecommendationText(validationMetric);
  const showNextAction =
    Boolean(nextAction) &&
    normalizeRecommendationText(nextAction) !== normalizeRecommendationText(solution) &&
    !isGenericRecommendationText(nextAction);

  return (
    <div className={`rounded-3xl border p-5 ${toneClass}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Recomendación {index + 1}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">{recommendation.title}</h3>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-950/80 dark:text-slate-300">
          Acción sugerida
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-200">{recommendation.text}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-white/80 p-4 dark:bg-slate-950/70">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Argumento
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {recommendation.rationale ?? recommendation.text}
          </p>
        </div>
        <div className="rounded-2xl bg-white/80 p-4 dark:bg-slate-950/70">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Dato usado
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {recommendation.evidence ?? "La recomendación se basa en los resultados del forecast y el mix comercial."}
          </p>
        </div>
        {showSolution ? (
          <div className="rounded-2xl bg-white/80 p-4 dark:bg-slate-950/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Solución realizable
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{solution}</p>
          </div>
        ) : null}
        <div className="rounded-2xl bg-white/80 p-4 dark:bg-slate-950/70">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Proyección o mejora posible
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {recommendation.expectedImpact ?? "Impacto esperado: mejorar margen, ADR o control comercial si se ejecuta con seguimiento semanal."}
          </p>
        </div>
        {showAssumption ? (
          <div className="rounded-2xl bg-white/80 p-4 dark:bg-slate-950/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Condición de cumplimiento
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{assumption}</p>
          </div>
        ) : null}
        {showValidation ? (
          <div className="rounded-2xl bg-white/80 p-4 dark:bg-slate-950/70">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Validación semanal
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{validationMetric}</p>
          </div>
        ) : null}
        {showNextAction ? (
          <div className="rounded-2xl bg-white/80 p-4 dark:bg-slate-950/70 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Próximo paso
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{nextAction}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TableCard({
  title,
  description,
  helperTitle,
  helperContent,
  children
}: {
  title: string;
  description: string;
  helperTitle?: string;
  helperContent?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
        </div>
        {helperTitle && helperContent ? (
          <div className="w-full xl:w-[320px]">
            <HelperDetails title={helperTitle}>{helperContent}</HelperDetails>
          </div>
        ) : null}
      </div>
      <div className="mt-5 overflow-x-auto">{children}</div>
    </Card>
  );
}

function SourceBadge({
  title,
  url,
  asOf
}: {
  title?: string;
  url?: string;
  asOf?: string;
}) {
  if (!title || !url) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
      <span className="rounded-full border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-950">
        Fuente
      </span>
      <a href={url} target="_blank" rel="noreferrer" className="underline">
        {title}
      </a>
      {asOf ? <span>· {asOf}</span> : null}
    </div>
  );
}

function ComboField({
  label,
  hint,
  value,
  onChange,
  options,
  listId,
  placeholder
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  listId: string;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-2">
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{label}</p>
        {hint ? <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{hint}</p> : null}
      </div>
      <Input list={listId} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </div>
  );
}

function sortOptions(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right, "es"));
}

function hasUsableBenchmarkRate(reference: HotelReferenceHotel, type: keyof HotelReferenceHotel["rates"]) {
  return Number.isFinite(reference.rates[type]) && reference.rates[type] > 0;
}

function averageRate(references: HotelReferenceHotel[], type: keyof HotelReferenceHotel["rates"]) {
  const usableReferences = references.filter((reference) => hasUsableBenchmarkRate(reference, type));

  if (!usableReferences.length) return 0;

  return usableReferences.reduce((total, reference) => total + reference.rates[type], 0) / usableReferences.length;
}

function formatBenchmarkRate(reference: HotelReferenceHotel, type: keyof HotelReferenceHotel["rates"]) {
  const value = reference.rates[type];

  if (!Number.isFinite(value) || value <= 0) {
    return "Sin valor";
  }

  if (reference.rateConfidence === "estimated") {
    return `Ref. ${formatUsd(value)}`;
  }

  if (reference.rateConfidence === "package") {
    return `Paq. ${formatUsd(value)}`;
  }

  if (reference.rateConfidence === "unverified") {
    return `Ref. ${formatUsd(value)}`;
  }

  return formatUsd(value);
}

function getRateConfidenceLabel(confidence?: HotelReferenceHotel["rateConfidence"]) {
  switch (confidence) {
    case "published":
      return "Tarifa publicada";
    case "package":
      return "Paquete / all-inclusive";
    case "estimated":
      return "Referencia estimada";
    case "unverified":
      return "Referencia débil";
    default:
      return "Sin clasificar";
  }
}

function getHotelCaseComparisonRows(records: SavedHotelCaseRecord[]) {
  const [left, right] = records;

  if (!left?.caseResult || !right?.caseResult) return [];

  return [
    {
      label: "ADR",
      kind: "money" as const,
      left: left.caseResult.summary.weightedAverageAdr,
      right: right.caseResult.summary.weightedAverageAdr,
      insight: "Tarifa promedio lograda por habitación vendida."
    },
    {
      label: "Ingreso neto",
      kind: "money" as const,
      left: left.caseResult.summary.totalNetRoomRevenue,
      right: right.caseResult.summary.totalNetRoomRevenue,
      insight: "Ingreso por habitaciones después de comisiones."
    },
    {
      label: "Comisiones",
      kind: "money" as const,
      left: left.caseResult.summary.totalCommissions,
      right: right.caseResult.summary.totalCommissions,
      lowerIsBetter: true,
      insight: "Costo comercial pagado a canales de venta."
    },
    {
      label: "Desayuno extra",
      kind: "money" as const,
      left: left.caseResult.summary.totalBreakfastDelta,
      right: right.caseResult.summary.totalBreakfastDelta,
      insight: "Ingreso adicional por subir el precio del desayuno."
    },
    {
      label: "Ocupación enero",
      kind: "percent" as const,
      left: left.caseInput.occupancyJanuary,
      right: right.caseInput.occupancyJanuary,
      insight: "Demanda esperada de enero."
    },
    {
      label: "Ocupación febrero",
      kind: "percent" as const,
      left: left.caseInput.occupancyFebruary,
      right: right.caseInput.occupancyFebruary,
      insight: "Demanda esperada de febrero."
    }
  ];
}

function formatComparisonValue(value: number, kind: "money" | "percent") {
  return kind === "money" ? formatUsd(value) : formatPercent(value);
}

function HotelComparisonVisuals({ records }: { records: SavedHotelCaseRecord[] }) {
  const [left, right] = records;
  const rows = getHotelCaseComparisonRows(records);

  if (!left?.caseResult || !right?.caseResult || rows.length === 0) return null;

  const financialData = rows
    .filter((row) => row.kind === "money")
    .map((row) => ({
      metric: row.label,
      left: row.left,
      right: row.right
    }));
  const occupancyData = rows
    .filter((row) => row.kind === "percent")
    .map((row) => ({
      metric: row.label.replace("Ocupación ", ""),
      left: row.left,
      right: row.right
    }));

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Dinero y margen
          </p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="metric" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(value) => `$${Number(value) / 1000}k`} />
                <Tooltip formatter={(value) => formatUsd(Number(value))} />
                <Legend />
                <Bar dataKey="left" name={left.hotelName} fill="#0f172a" radius={[10, 10, 0, 0]} />
                <Bar dataKey="right" name={right.hotelName} fill="#059669" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Ocupación mensual
          </p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occupancyData}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="metric" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(value) => `${value}%`} />
                <Tooltip formatter={(value) => formatPercent(Number(value))} />
                <Legend />
                <Bar dataKey="left" name={left.hotelName} fill="#0f172a" radius={[10, 10, 0, 0]} />
                <Bar dataKey="right" name={right.hotelName} fill="#059669" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="grid gap-3">
        {rows.map((row) => {
          const maxValue = Math.max(row.left, row.right, 1);
          const leftWins = row.lowerIsBetter ? row.left <= row.right : row.left >= row.right;
          const rightWins = row.lowerIsBetter ? row.right <= row.left : row.right >= row.left;

          return (
            <div key={row.label} className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-950 dark:text-slate-50">{row.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{row.insight}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  {row.lowerIsBetter ? "Menor es mejor" : "Mayor es mejor"}
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                <div>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="truncate text-slate-600 dark:text-slate-300">{left.hotelName}</span>
                    <span className={`font-semibold ${leftWins ? "text-emerald-600 dark:text-emerald-300" : "text-slate-600 dark:text-slate-300"}`}>
                      {formatComparisonValue(row.left, row.kind)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-900">
                    <div className="h-2 rounded-full bg-slate-950 dark:bg-slate-100" style={{ width: `${Math.max((row.left / maxValue) * 100, 4)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between gap-4 text-sm">
                    <span className="truncate text-slate-600 dark:text-slate-300">{right.hotelName}</span>
                    <span className={`font-semibold ${rightWins ? "text-emerald-600 dark:text-emerald-300" : "text-slate-600 dark:text-slate-300"}`}>
                      {formatComparisonValue(row.right, row.kind)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-900">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.max((row.right / maxValue) * 100, 4)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HotelCaseWorkbench() {
  const [hotelCase, setHotelCase] = useState<HotelCaseInput>(createDefaultHotelCase());
  const [benchmarkFilters, setBenchmarkFilters] = useState<HotelBenchmarkSearchInput>({
    country: "Chile",
    region: createDefaultHotelCase().region,
    municipality: HOTEL_DESTINATION_PROFILES[createDefaultHotelCase().destination].label,
    hotelType: "",
    stars: 5
  });
  const [benchmarkResult, setBenchmarkResult] = useState<HotelBenchmarkReport | null>(null);
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string | null>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);
  const [result, setResult] = useState<HotelCaseResult | null>(null);
  const [currentSavedCaseId, setCurrentSavedCaseId] = useState<string | null>(null);
  const [savedCases, setSavedCases] = useState<SavedHotelCaseListItem[]>([]);
  const [savedCasesLoading, setSavedCasesLoading] = useState(false);
  const [savedCasesError, setSavedCasesError] = useState<string | null>(null);
  const [savedCasesQuery, setSavedCasesQuery] = useState("");
  const [savedCasesDestination, setSavedCasesDestination] = useState<HotelCaseInput["destination"] | "">("");
  const [savingCase, setSavingCase] = useState(false);
  const [deletingCaseId, setDeletingCaseId] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [compareRecords, setCompareRecords] = useState<SavedHotelCaseRecord[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<HotelWorkbenchTab>("benchmarks");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const clearCurrentResult = useCallback(() => {
    setResult(null);
    clearStoredHotelResult();
  }, []);

  useEffect(() => {
    const storedCase = normalizeHotelCaseInput(getStoredHotelCase(createDefaultHotelCase()));
    setHotelCase(storedCase);
    setBenchmarkFilters(
      getStoredHotelBenchmarkFilters({
        country: storedCase.country,
        region: storedCase.region,
        municipality: HOTEL_DESTINATION_PROFILES[storedCase.destination].label,
        hotelType: "",
        stars: storedCase.category.includes("4") ? 4 : 5
      })
    );
    const storedBenchmarkResult = getStoredHotelBenchmarkResult();
    setBenchmarkResult(storedBenchmarkResult);
    setSelectedBenchmarkId(storedBenchmarkResult?.hotels[0]?.id ?? null);
    setResult(normalizeHotelCaseResult(getStoredHotelResult()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setStoredHotelCase(hotelCase);
  }, [hotelCase, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    setStoredHotelBenchmarkFilters(benchmarkFilters);
  }, [benchmarkFilters, hydrated]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setSavedCasesLoading(true);
    setSavedCasesError(null);

    void fetch("/api/hotel-cases")
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error ?? "No fue posible cargar los casos guardados.");
        }

        setSavedCases(payload.items as SavedHotelCaseListItem[]);
      })
      .catch((currentError) => {
        setSavedCasesError(currentError instanceof Error ? currentError.message : "No fue posible cargar los casos guardados.");
      })
      .finally(() => {
        setSavedCasesLoading(false);
      });
  }, [hydrated]);

  const loadSavedCases = async (filters?: { query?: string; destination?: HotelCaseInput["destination"] | "" }) => {
    setSavedCasesLoading(true);
    setSavedCasesError(null);

    try {
      const params = new URLSearchParams();
      const query = filters?.query ?? savedCasesQuery;
      const destination = filters?.destination ?? savedCasesDestination;

      if (query.trim()) params.set("q", query.trim());
      if (destination) params.set("destination", destination);

      const response = await fetch(`/api/hotel-cases${params.toString() ? `?${params.toString()}` : ""}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No fue posible cargar los casos guardados.");
      }

      setSavedCases(payload.items as SavedHotelCaseListItem[]);
    } catch (currentError) {
      setSavedCasesError(currentError instanceof Error ? currentError.message : "No fue posible cargar los casos guardados.");
    } finally {
      setSavedCasesLoading(false);
    }
  };

  const saveCurrentCase = async () => {
    setSavingCase(true);
    setSaveMessage(null);
    setSavedCasesError(null);

    try {
      const isUpdating = Boolean(currentSavedCaseId);
      const response = await fetch(currentSavedCaseId ? `/api/hotel-cases/${currentSavedCaseId}` : "/api/hotel-cases", {
        method: currentSavedCaseId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          input: hotelCase,
          result
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No fue posible guardar el caso hotelero.");
      }

      const savedRecord = payload as SavedHotelCaseRecord;
      setCurrentSavedCaseId(savedRecord.id);
      setSaveMessage(
        isUpdating
          ? result
            ? "Caso resuelto actualizado en la base de datos."
            : "Borrador actualizado en la base de datos."
          : result
            ? "Caso resuelto guardado en la base de datos."
            : "Borrador del caso guardado en la base de datos."
      );
      await loadSavedCases();
      setActiveTab("saved");
    } catch (currentError) {
      setSavedCasesError(currentError instanceof Error ? currentError.message : "No fue posible guardar el caso hotelero.");
    } finally {
      setSavingCase(false);
    }
  };

  const deleteSavedCase = async (id: string, hotelName: string) => {
    const confirmed = window.confirm(`¿Eliminar "${hotelName}" de la biblioteca? Esta acción no se puede deshacer.`);

    if (!confirmed) return;

    setDeletingCaseId(id);
    setSavedCasesError(null);
    setSaveMessage(null);

    try {
      const response = await fetch(`/api/hotel-cases/${id}`, {
        method: "DELETE"
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No fue posible eliminar el caso hotelero.");
      }

      setSavedCases((current) => current.filter((item) => item.id !== id));
      setSelectedCompareIds((current) => current.filter((currentId) => currentId !== id));
      setCompareRecords((current) => current.filter((record) => record.id !== id));

      if (currentSavedCaseId === id) {
        setCurrentSavedCaseId(null);
        setSaveMessage(`Se eliminó ${hotelName}. El formulario queda disponible para guardarlo como un caso nuevo si lo necesitas.`);
      } else {
        setSaveMessage(`Se eliminó ${hotelName} de la biblioteca.`);
      }
    } catch (currentError) {
      setSavedCasesError(currentError instanceof Error ? currentError.message : "No fue posible eliminar el caso hotelero.");
    } finally {
      setDeletingCaseId(null);
    }
  };

  const loadSavedCaseIntoWorkbench = async (id: string) => {
    setCompareLoading(true);
    setSavedCasesError(null);

    try {
      const response = await fetch(`/api/hotel-cases/${id}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No fue posible cargar el caso guardado.");
      }

      const record = payload as SavedHotelCaseRecord;
      const normalizedInput = normalizeHotelCaseInput(record.caseInput);
      const normalizedResult = normalizeHotelCaseResult(record.caseResult ?? null);
      setCurrentSavedCaseId(record.id);
      setHotelCase(normalizedInput);
      setResult(normalizedResult);
      setActiveTab(normalizedResult ? "research" : "case");
      setSaveMessage(`Se cargó ${record.hotelName} desde la base de datos.`);
    } catch (currentError) {
      setSavedCasesError(currentError instanceof Error ? currentError.message : "No fue posible cargar el caso guardado.");
    } finally {
      setCompareLoading(false);
    }
  };

  const runCaseComparison = useCallback(async (ids: string[]) => {
    if (ids.length !== 2) {
      setCompareRecords([]);
      return;
    }

    setCompareLoading(true);
    setSavedCasesError(null);

    try {
      const responses = await Promise.all(ids.map((id) => fetch(`/api/hotel-cases/${id}`)));
      const payloads = await Promise.all(responses.map((response) => response.json()));

      const failed = responses.findIndex((response) => !response.ok);
      if (failed >= 0) {
        throw new Error(payloads[failed].error ?? "No fue posible comparar los casos guardados.");
      }

      setCompareRecords(
        (payloads as SavedHotelCaseRecord[]).map((record) => ({
          ...record,
          caseInput: normalizeHotelCaseInput(record.caseInput),
          caseResult: normalizeHotelCaseResult(record.caseResult ?? null)
        }))
      );
    } catch (currentError) {
      setSavedCasesError(currentError instanceof Error ? currentError.message : "No fue posible comparar los casos guardados.");
      setCompareRecords([]);
    } finally {
      setCompareLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void runCaseComparison(selectedCompareIds);
  }, [hydrated, runCaseComparison, selectedCompareIds]);

  const updateCase = <K extends keyof HotelCaseInput>(key: K, value: HotelCaseInput[K]) => {
    clearCurrentResult();
    setHotelCase((current) => ({
      ...current,
      [key]: value
    }));
  };

  const updateRoomMix = (key: keyof HotelCaseInput["roomMix"], value: number) => {
    clearCurrentResult();
    setHotelCase((current) => ({
      ...current,
      roomMix: {
        ...current.roomMix,
        [key]: value
      }
    }));
  };

  const updateRoomRate = (key: keyof HotelCaseInput["roomRates"], value: number) => {
    clearCurrentResult();
    setHotelCase((current) => ({
      ...current,
      roomRates: {
        ...current.roomRates,
        [key]: value
      }
    }));
  };

  const updateChannelField = (channel: HotelSalesChannelId, field: "share" | "commission", value: number) => {
    clearCurrentResult();
    setHotelCase((current) => ({
      ...current,
      channels: {
        ...current.channels,
        [channel]: {
          ...current.channels[channel],
          [field]: value
        }
      }
    }));
  };

  const updateChannelRate = (channel: HotelSalesChannelId, type: (typeof ROOM_TYPE_ORDER)[number], value: number) => {
    clearCurrentResult();
    setHotelCase((current) => ({
      ...current,
      channels: {
        ...current.channels,
        [channel]: {
          ...current.channels[channel],
          rates: {
            ...current.channels[channel].rates,
            [type]: value
          }
        }
      }
    }));
  };

  const updateChannelAllocation = (channel: HotelSalesChannelId, type: (typeof ROOM_TYPE_ORDER)[number], value: number) => {
    clearCurrentResult();
    setHotelCase((current) => ({
      ...current,
      channels: {
        ...current.channels,
        [channel]: {
          ...current.channels[channel],
          roomAllocation: {
            ...current.channels[channel].roomAllocation,
            [type]: value
          }
        }
      }
    }));
  };

  const applyDestination = (destinationId: HotelCaseInput["destination"]) => {
    const profile = HOTEL_DESTINATION_PROFILES[destinationId];
    const nextRates = {
      ...profile.marketRateReference
    };

    clearCurrentResult();
    setHotelCase((current) =>
      normalizeHotelCaseInput({
        ...current,
        destination: destinationId,
        region: profile.region,
        country: profile.country,
        roomRates: nextRates,
        channels: {
          tourOperators: { ...current.channels.tourOperators, rates: { ...nextRates } },
          onlineAgencies: { ...current.channels.onlineAgencies, rates: { ...nextRates } },
          direct: { ...current.channels.direct, rates: { ...nextRates } },
          corporate: { ...current.channels.corporate, rates: { ...nextRates } }
        }
      })
    );

    setBenchmarkFilters((current) => ({
      ...current,
      country: profile.country,
      region: profile.region,
      municipality: profile.label
    }));
  };

  const applyReferenceToCase = (reference: HotelReferenceHotel) => {
    const profile = HOTEL_DESTINATION_PROFILES[reference.destination];
    const combinedServices = Array.from(new Set([...reference.services, ...reference.facilities])).join(", ");
    setSelectedBenchmarkId(reference.id);
    setCurrentSavedCaseId(null);
    clearCurrentResult();
    setSaveMessage(
      reference.rateConfidence === "published"
        ? "Se armó un caso nuevo desde el benchmark con tarifas publicadas. Resuélvelo antes de guardarlo como caso resuelto."
        : "Se armó un caso nuevo con tarifas de referencia competitiva. Revisa la base de tarifa, porque puede venir de paquete, all-inclusive o estimación de mercado."
    );
    setBenchmarkFilters({
      country: reference.country,
      region: reference.region,
      municipality: reference.municipality,
      hotelType: reference.hotelType,
      stars: reference.stars
    });

    setHotelCase((current) => ({
      ...normalizeHotelCaseInput({
        ...current,
        destination: reference.destination,
        region: reference.region,
        country: reference.country,
        category: `${reference.stars} estrellas`,
        roomRates: { ...reference.rates },
        channels: {
          tourOperators: { ...current.channels.tourOperators, rates: { ...reference.rates } },
          onlineAgencies: { ...current.channels.onlineAgencies, rates: { ...reference.rates } },
          direct: { ...current.channels.direct, rates: { ...reference.rates } },
          corporate: { ...current.channels.corporate, rates: { ...reference.rates } }
        },
        concept: `${reference.hotelType} inspirado en referencias premium de ${profile.label}, con foco en ${reference.positioning.toLowerCase()}.`,
        services: combinedServices,
        differentiation: reference.differentiationIdeas[0] ?? current.differentiation
      })
    }));
  };

  const totalRoomMix =
    hotelCase.roomMix.single + hotelCase.roomMix.double + hotelCase.roomMix.triple + hotelCase.roomMix.suite;
  const totalChannelShare =
    hotelCase.channels.tourOperators.share +
    hotelCase.channels.onlineAgencies.share +
    hotelCase.channels.direct.share +
    hotelCase.channels.corporate.share;
  const roomAllocationTotals = ROOM_TYPE_ORDER.reduce<Record<(typeof ROOM_TYPE_ORDER)[number], number>>(
    (current, type) => ({
      ...current,
      [type]: CHANNEL_ORDER.reduce((sum, channel) => sum + hotelCase.channels[channel].roomAllocation[type], 0)
    }),
    {} as Record<(typeof ROOM_TYPE_ORDER)[number], number>
  );

  const countryOptions = sortOptions(HOTEL_REFERENCE_CATALOG.map((reference) => reference.country));
  const regionOptions = sortOptions(
    HOTEL_REFERENCE_CATALOG.filter((reference) => !benchmarkFilters.country || reference.country === benchmarkFilters.country).map(
      (reference) => reference.region
    )
  );
  const municipalityOptions = sortOptions(
    HOTEL_REFERENCE_CATALOG.filter(
      (reference) =>
        (!benchmarkFilters.country || reference.country === benchmarkFilters.country) &&
        (!benchmarkFilters.region || reference.region === benchmarkFilters.region)
    ).map((reference) => reference.municipality)
  );
  const hotelTypeOptions = sortOptions(
    HOTEL_REFERENCE_CATALOG.filter(
      (reference) =>
        (!benchmarkFilters.country || reference.country === benchmarkFilters.country) &&
        (!benchmarkFilters.region || reference.region === benchmarkFilters.region) &&
        (!benchmarkFilters.municipality || reference.municipality === benchmarkFilters.municipality)
    ).map((reference) => reference.hotelType)
  );
  const starOptions = sortOptions(HOTEL_REFERENCE_CATALOG.map((reference) => String(reference.stars)));

  const benchmarkHotels = benchmarkResult?.hotels ?? [];
  const selectedReference =
    benchmarkHotels.find((reference) => reference.id === selectedBenchmarkId) ?? benchmarkHotels[0] ?? null;
  const averageDoubleReferenceRate = averageRate(benchmarkHotels, "double");
  const averageSuiteReferenceRate = averageRate(benchmarkHotels, "suite");
  const featureCounts = benchmarkHotels.reduce<Record<string, number>>((accumulator, reference) => {
    for (const feature of [...reference.services, ...reference.facilities]) {
      accumulator[feature] = (accumulator[feature] ?? 0) + 1;
    }

    return accumulator;
  }, {});
  const repeatedFeatures = Object.entries(featureCounts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "es"))
    .slice(0, 4)
    .map(([feature]) => feature);
  const differentiationIdeas =
    selectedReference?.differentiationIdeas ??
    benchmarkResult?.differentiationIdeas ??
    [
      `Tomar ${HOTEL_DESTINATION_PROFILES[hotelCase.destination].attractions[0]?.toLowerCase() ?? "el destino"} como eje del producto, y no solo como contexto del hotel.`,
      "Diseñar una ventaja clara en servicio, paquetes o wellness para no competir solo por tarifa.",
      "Proteger el ADR con más venta directa y una propuesta propia de experiencias."
    ];
  const starValueLabel = benchmarkFilters.stars ? `${benchmarkFilters.stars} estrellas` : "Todas las categorias";

  const runBenchmarkSearch = async () => {
    setBenchmarkLoading(true);
    setBenchmarkError(null);

    try {
      const response = await fetch("/api/hotel-benchmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(benchmarkFilters)
      });

      const payload = await response.json();

      if (!response.ok) {
        const message = payload.error ?? "No fue posible ejecutar la búsqueda comparativa hotelera.";
        throw new Error(message);
      }

      const parsed = payload as HotelBenchmarkReport;
      setBenchmarkResult(parsed);
      setSelectedBenchmarkId(parsed.hotels[0]?.id ?? null);
      setStoredHotelBenchmarkResult(parsed);
    } catch (currentError) {
      setBenchmarkError(
        currentError instanceof Error ? currentError.message : "No fue posible ejecutar la búsqueda comparativa hotelera."
      );
    } finally {
      setBenchmarkLoading(false);
    }
  };

  const solveHotelCase = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/hotel-case", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(hotelCase)
      });

      const payload = await response.json();

      if (!response.ok) {
        const message = payload.issues?.join(" ") ?? payload.error ?? "No fue posible resolver el caso hotelero.";
        throw new Error(message);
      }

      setResult(payload as HotelCaseResult);
      setStoredHotelResult(payload as HotelCaseResult);
      setActiveTab("research");
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "No fue posible resolver el caso hotelero.");
    } finally {
      setLoading(false);
    }
  };

  const tabs: Array<{
    id: HotelWorkbenchTab;
    label: string;
    subtitle: string;
    icon: ComponentType<{ className?: string }>;
  }> = [
    { id: "saved", label: "Biblioteca", subtitle: "Casos guardados y comparación", icon: Building2 },
    { id: "benchmarks", label: "0. Buscar Benchmark", subtitle: "Comparativa", icon: FileSearch },
    { id: "case", label: "1. Preparar Caso", subtitle: "Datos base del proyecto", icon: Hotel },
    { id: "research", label: "2. Entender Mercado", subtitle: "Destino, competencia y fuentes", icon: BookOpenText },
    { id: "forecast", label: "3. Ver Numeros", subtitle: "Ocupacion, ADR y comisiones", icon: ReceiptText },
    { id: "strategy", label: "4. Tomar Decision", subtitle: "Plan, alertas y recomendaciones", icon: Target }
  ];

  const destinationProfile = HOTEL_DESTINATION_PROFILES[hotelCase.destination];
  const januaryPreviewRoomNights = hotelCase.totalRooms * 31 * (hotelCase.occupancyJanuary / 100);
  const februaryPreviewRoomNights = hotelCase.totalRooms * 28 * (hotelCase.occupancyFebruary / 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="no-print mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Modulo especializado
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
            Casos hoteleros
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Este espacio está pensado para que cualquier persona pueda entender un caso hotelero paso a paso.
            Primero revisas referencias comparables, luego armas tu caso, después la app investiga el mercado,
            calcula los números y finalmente te explica qué significan.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => void saveCurrentCase()} disabled={savingCase}>
            {savingCase ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {currentSavedCaseId ? "Actualizar caso" : "Guardar caso"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const example = createDefaultHotelCase();
              setHotelCase(example);
              setBenchmarkFilters({
                country: example.country,
                region: example.region,
                municipality: HOTEL_DESTINATION_PROFILES[example.destination].label,
                hotelType: "",
                stars: example.category.includes("4") ? 4 : 5
              });
              setSelectedBenchmarkId(null);
              setBenchmarkResult(null);
              setBenchmarkError(null);
              clearCurrentResult();
              setCurrentSavedCaseId(null);
              setError(null);
              setActiveTab("benchmarks");
            }}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Cargar ejemplo docente
          </Button>
          {result ? (
            <Button variant="secondary" onClick={() => printCurrentPage(result.input.hotelName)}>
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF completo
            </Button>
          ) : null}
          {result ? (
            <Button variant="secondary" onClick={() => void downloadHotelExcel(result)}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel de canales
            </Button>
          ) : null}
          {result ? (
            <Button variant="secondary" onClick={() => downloadHotelResult(result)}>
              <Download className="mr-2 h-4 w-4" />
              Exportar JSON
            </Button>
          ) : null}
        </div>
      </div>

      {saveMessage ? (
        <div className="no-print mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          {saveMessage}
        </div>
      ) : null}
      {savedCasesError ? (
        <div className="no-print mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          {savedCasesError}
        </div>
      ) : null}

      <div className="no-print mb-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5 sm:p-6">
          <SectionIntro
            title="Como funciona este modulo"
            description="No necesitas saber hotelería para usarlo. La app te acompaña en cuatro pasos y además te va explicando qué significa cada dato."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <GuideCard
              title="Armar caso"
              description="Defines hotel, destino, habitaciones, tarifas y canales de venta."
              icon={Hotel}
            />
            <GuideCard
              title="Entender mercado"
              description="Investiga destino, atractivos, competencia y tarifas de referencia."
              icon={FileSearch}
            />
            <GuideCard
              title="Ver numeros"
              description="La app calcula ocupación, ingreso por habitaciones, desayuno y comisiones."
              icon={Calculator}
            />
            <GuideCard
              title="Tomar decision"
              description="Te muestra alertas, conclusiones y un plan comercial en lenguaje simple."
              icon={Lightbulb}
            />
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Glosario rapido
          </p>
          <div className="mt-4 grid gap-3">
            <HelperDetails title="¿Qué es ADR?" defaultOpen>
              Es la tarifa promedio diaria por habitación vendida. Sirve para saber si el hotel está vendiendo
              barato o caro en relación con su meta.
            </HelperDetails>
            <HelperDetails title="¿Qué es ocupacion?">
              Es el porcentaje de habitaciones que esperas vender. No es lo mismo tener muchas habitaciones que
              tener muchas habitaciones ocupadas.
            </HelperDetails>
            <HelperDetails title="¿Qué son las comisiones por canal?">
              Son los costos de vender por cada intermediario. Un canal puede traer muchas reservas, pero dejar
              poco dinero neto.
            </HelperDetails>
          </div>
        </Card>
      </div>

      <Card className="no-print mb-6 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const disabled = tab.id !== "saved" && tab.id !== "benchmarks" && tab.id !== "case" && !result;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                disabled={disabled}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  activeTab === tab.id
                    ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-950"
                    : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 dark:hover:bg-slate-900"
                } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <p className="text-sm font-semibold">{tab.label}</p>
                </div>
                <p className={`mt-2 text-xs ${activeTab === tab.id ? "text-white/80 dark:text-slate-700" : "text-slate-500 dark:text-slate-400"}`}>
                  {tab.subtitle}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {activeTab === "saved" ? (
        <div className="no-print space-y-6">
          <Card>
            <SectionIntro
              title="Biblioteca de casos guardados"
              description="Aquí queda tu base estándar de casos hoteleros. Puedes buscar por nombre o destino, volver a cargar un caso al formulario y comparar dos casos resueltos lado a lado."
            />
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_auto]">
              <FormField label="Buscar caso" hint="Nombre, región o país">
                <Input value={savedCasesQuery} onChange={(event) => setSavedCasesQuery(event.target.value)} placeholder="Ej. Atacama" />
              </FormField>
              <FormField label="Destino" hint="Filtro opcional">
                <Select
                  value={savedCasesDestination}
                  onChange={(event) => setSavedCasesDestination(event.target.value as HotelCaseInput["destination"] | "")}
                >
                  <option value="">Todos los destinos</option>
                  {HOTEL_DESTINATION_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <div className="flex items-end gap-3">
                <Button onClick={() => void loadSavedCases()} disabled={savedCasesLoading}>
                  {savedCasesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                  Actualizar biblioteca
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
            <Card>
              <SectionIntro
                title="Casos disponibles"
                description="Selecciona uno para cargarlo o marca dos casos resueltos para compararlos."
              />
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <SummaryMetric
                  label="Total"
                  value={String(savedCases.length)}
                  helper="Casos visibles con los filtros actuales."
                />
                <SummaryMetric
                  label="Resueltos"
                  value={String(savedCases.filter((item) => item.status === "solved").length)}
                  helper="Disponibles para comparación rápida."
                />
                <SummaryMetric
                  label="Seleccionados"
                  value={`${selectedCompareIds.length}/2`}
                  helper="Marca dos casos resueltos para comparar."
                />
              </div>
              <div className="space-y-3">
                {savedCases.map((item) => {
                  const isChecked = selectedCompareIds.includes(item.id);
                  const isLoaded = currentSavedCaseId === item.id;
                  const isSolved = item.status === "solved";
                  const destinationLabel = HOTEL_DESTINATION_PROFILES[item.destination].label;

                  return (
                    <article
                      key={item.id}
                      className={`rounded-3xl border p-4 transition ${
                        isLoaded
                          ? "border-slate-900 bg-slate-50 shadow-sm dark:border-slate-100 dark:bg-slate-900"
                          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex min-w-0 gap-3">
                          <label
                            className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                              isSolved
                                ? "cursor-pointer border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                                : "cursor-not-allowed border-slate-200 bg-slate-100 opacity-60 dark:border-slate-800 dark:bg-slate-900"
                            }`}
                            title={isSolved ? "Marcar para comparar" : "Solo se comparan casos resueltos"}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-slate-900"
                              checked={isChecked}
                              disabled={!isSolved && !isChecked}
                              onChange={(event) => {
                                const nextIds = event.target.checked
                                  ? [...selectedCompareIds, item.id].slice(-2)
                                  : selectedCompareIds.filter((currentId) => currentId !== item.id);
                                setSelectedCompareIds(nextIds);
                              }}
                            />
                          </label>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="break-words text-lg font-semibold text-slate-950 dark:text-slate-50">
                                {item.hotelName}
                              </h3>
                              <span
                                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                                  isSolved
                                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                }`}
                              >
                                {isSolved ? "Resuelto" : "Borrador"}
                              </span>
                              {isLoaded ? (
                                <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white dark:bg-slate-100 dark:text-slate-950">
                                  Cargado
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                              {item.category} · {item.region} · {destinationLabel}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Button variant="secondary" onClick={() => void loadSavedCaseIntoWorkbench(item.id)} disabled={compareLoading}>
                            Cargar
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => void deleteSavedCase(item.id, item.hotelName)}
                            disabled={deletingCaseId === item.id}
                            aria-label={`Eliminar ${item.hotelName}`}
                          >
                            {deletingCaseId === item.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Eliminar
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">ADR</p>
                          <p className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-50">
                            {typeof item.weightedAverageAdr === "number" ? formatUsd(item.weightedAverageAdr) : "Sin resolver"}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Actualizado</p>
                          <p className="mt-1 text-sm font-semibold leading-5 text-slate-950 dark:text-slate-50">{formatDateTime(item.updatedAt)}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Comparación</p>
                          <p className="mt-1 text-sm font-semibold leading-5 text-slate-950 dark:text-slate-50">
                            {isSolved ? (isChecked ? "Marcado para comparar" : "Disponible") : "Resolver primero"}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              {!savedCases.length ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Aún no hay casos guardados en la base de datos. Guarda tu primer caso con el botón `Guardar caso`.
                </div>
              ) : null}
            </Card>

            <Card>
              <SectionIntro
                title="Comparación rápida"
                description="Selecciona dos casos resueltos y la app mostrará gráficos, lectura ejecutiva y diferencias clave."
              />
              <div className="mb-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                Seleccionados: <strong>{selectedCompareIds.length}/2</strong>. Solo se pueden comparar casos en estado `Resuelto`.
              </div>
              {compareLoading ? (
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando comparación...
                </div>
              ) : compareRecords.length === 2 ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {compareRecords.map((record) => (
                      <Highlight
                        key={record.id}
                        title={record.hotelName}
                        text={`${HOTEL_DESTINATION_PROFILES[record.destination].label} · ADR ${formatUsd(
                          record.caseResult?.summary.weightedAverageAdr ?? 0
                        )} · Canal rentable ${record.caseResult ? HOTEL_CHANNEL_LABELS[record.caseResult.summary.mostProfitableChannel] : "Sin resolver"}`}
                        tone="emerald"
                      />
                    ))}
                  </div>
                  <HotelComparisonVisuals records={compareRecords} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Highlight
                      title="Lectura comparativa"
                      text={`${
                        (compareRecords[0].caseResult?.summary.weightedAverageAdr ?? 0) >=
                        (compareRecords[1].caseResult?.summary.weightedAverageAdr ?? 0)
                          ? compareRecords[0].hotelName
                          : compareRecords[1].hotelName
                      } lidera en ADR, mientras ${
                        (compareRecords[0].caseResult?.summary.totalNetRoomRevenue ?? 0) >=
                        (compareRecords[1].caseResult?.summary.totalNetRoomRevenue ?? 0)
                          ? compareRecords[0].hotelName
                          : compareRecords[1].hotelName
                      } lidera en ingreso neto total.`}
                    />
                    <Highlight
                      title="Uso recomendado"
                      text="Usa esta comparación para decidir qué caso sostiene mejor tarifa, cuál controla mejor las comisiones y qué propuesta comercial conviene replicar o ajustar."
                      tone="slate"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="pb-3">Indicador</th>
                          <th className="pb-3">{compareRecords[0].hotelName}</th>
                          <th className="pb-3">{compareRecords[1].hotelName}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-slate-200 dark:border-slate-800">
                          <td className="py-3 font-medium text-slate-900 dark:text-slate-50">ADR proyectado</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(compareRecords[0].caseResult?.summary.weightedAverageAdr ?? 0)}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(compareRecords[1].caseResult?.summary.weightedAverageAdr ?? 0)}</td>
                        </tr>
                        <tr className="border-t border-slate-200 dark:border-slate-800">
                          <td className="py-3 font-medium text-slate-900 dark:text-slate-50">Meta ADR cumplida</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">
                            {compareRecords[0].caseResult?.summary.adrTargetMet ? "Sí" : "No"}
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">
                            {compareRecords[1].caseResult?.summary.adrTargetMet ? "Sí" : "No"}
                          </td>
                        </tr>
                        <tr className="border-t border-slate-200 dark:border-slate-800">
                          <td className="py-3 font-medium text-slate-900 dark:text-slate-50">Ingreso neto habitaciones</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(compareRecords[0].caseResult?.summary.totalNetRoomRevenue ?? 0)}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(compareRecords[1].caseResult?.summary.totalNetRoomRevenue ?? 0)}</td>
                        </tr>
                        <tr className="border-t border-slate-200 dark:border-slate-800">
                          <td className="py-3 font-medium text-slate-900 dark:text-slate-50">Comisiones totales</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(compareRecords[0].caseResult?.summary.totalCommissions ?? 0)}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(compareRecords[1].caseResult?.summary.totalCommissions ?? 0)}</td>
                        </tr>
                        <tr className="border-t border-slate-200 dark:border-slate-800">
                          <td className="py-3 font-medium text-slate-900 dark:text-slate-50">Delta desayuno</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(compareRecords[0].caseResult?.summary.totalBreakfastDelta ?? 0)}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(compareRecords[1].caseResult?.summary.totalBreakfastDelta ?? 0)}</td>
                        </tr>
                        <tr className="border-t border-slate-200 dark:border-slate-800">
                          <td className="py-3 font-medium text-slate-900 dark:text-slate-50">Canal más rentable</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">
                            {compareRecords[0].caseResult ? HOTEL_CHANNEL_LABELS[compareRecords[0].caseResult.summary.mostProfitableChannel] : "Sin resolver"}
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">
                            {compareRecords[1].caseResult ? HOTEL_CHANNEL_LABELS[compareRecords[1].caseResult.summary.mostProfitableChannel] : "Sin resolver"}
                          </td>
                        </tr>
                        <tr className="border-t border-slate-200 dark:border-slate-800">
                          <td className="py-3 font-medium text-slate-900 dark:text-slate-50">Mayor aporte neto</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">
                            {compareRecords[0].caseResult ? HOTEL_CHANNEL_LABELS[compareRecords[0].caseResult.summary.largestNetContributor] : "Sin resolver"}
                          </td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">
                            {compareRecords[1].caseResult ? HOTEL_CHANNEL_LABELS[compareRecords[1].caseResult.summary.largestNetContributor] : "Sin resolver"}
                          </td>
                        </tr>
                        <tr className="border-t border-slate-200 dark:border-slate-800">
                          <td className="py-3 font-medium text-slate-900 dark:text-slate-50">Ocupación enero</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatPercent(compareRecords[0].caseInput.occupancyJanuary)}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatPercent(compareRecords[1].caseInput.occupancyJanuary)}</td>
                        </tr>
                        <tr className="border-t border-slate-200 dark:border-slate-800">
                          <td className="py-3 font-medium text-slate-900 dark:text-slate-50">Ocupación febrero</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatPercent(compareRecords[0].caseInput.occupancyFebruary)}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatPercent(compareRecords[1].caseInput.occupancyFebruary)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {compareRecords.map((record) => (
                      <Card key={`recommendations-${record.id}`} className="p-5">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Recomendaciones clave
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">{record.hotelName}</h3>
                        <div className="mt-4 grid gap-3">
                          {(record.caseResult?.summary.recommendations ?? []).slice(0, 3).map((recommendation) => (
                            <Highlight
                              key={`${record.id}-${recommendation.title}`}
                              title={recommendation.title}
                              text={recommendation.text}
                              tone={recommendation.tone ?? "emerald"}
                            />
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {selectedCompareIds.length === 2
                    ? "La selección está lista, pero todavía no se cargaron los datos completos. Pulsa Actualizar biblioteca o vuelve a marcar los casos; si el problema sigue, revisa que la sesión esté iniciada."
                    : "Marca dos casos resueltos para compararlos aquí. Si cargas uno de ellos al formulario, puedes seguir editándolo con las pestañas normales del módulo."}
                </div>
              )}
            </Card>
          </div>
        </div>
      ) : null}

      {activeTab === "benchmarks" ? (
        <div className="no-print space-y-6">
          <Card>
            <SectionIntro
              step="Paso 0"
              title="Búsqueda comparativa"
              description="Aquí haces la búsqueda competitiva antes de armar el caso. La app investiga la zona, propone comparables y organiza la salida para revisar tarifas, tipo de hotel y opciones de diferenciación."
            />
            <HelperDetails title="¿Cómo usar esta pestaña?" defaultOpen>
              Parte por región y, si quieres, acota por comuna, tipo de hotel y estrellas. Luego revisa la grilla de comparables y toma uno como base para completar el caso con menos fricción.
            </HelperDetails>
            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Filtros de búsqueda
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Esta búsqueda consulta referencias de mercado y luego te devuelve una comparativa usable en tablas tipo grilla.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setBenchmarkFilters({
                        country: "Chile",
                        region: "",
                        municipality: "",
                        hotelType: "",
                        stars: null
                      });
                      setSelectedBenchmarkId(null);
                      setBenchmarkResult(null);
                      setBenchmarkError(null);
                    }}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Limpiar filtros
                  </Button>
                  <Button onClick={() => void runBenchmarkSearch()} disabled={benchmarkLoading || benchmarkFilters.region.trim().length < 2}>
                    {benchmarkLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSearch className="mr-2 h-4 w-4" />}
                    Buscar
                  </Button>
                </div>
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <ComboField
                  label="País"
                  hint="Base geográfica"
                  value={benchmarkFilters.country}
                  onChange={(value) => setBenchmarkFilters((current) => ({ ...current, country: value }))}
                  options={countryOptions}
                  listId="hotel-benchmark-country"
                  placeholder="Ej. Chile"
                />
                <ComboField
                  label="Región"
                  hint="Dato principal para buscar"
                  value={benchmarkFilters.region}
                  onChange={(value) => setBenchmarkFilters((current) => ({ ...current, region: value }))}
                  options={regionOptions}
                  listId="hotel-benchmark-region"
                  placeholder="Ej. Antofagasta"
                />
                <ComboField
                  label="Comuna o destino"
                  hint="Opcional"
                  value={benchmarkFilters.municipality}
                  onChange={(value) => setBenchmarkFilters((current) => ({ ...current, municipality: value }))}
                  options={municipalityOptions}
                  listId="hotel-benchmark-municipality"
                  placeholder="Ej. San Pedro de Atacama"
                />
                <ComboField
                  label="Tipo de hotel"
                  hint="Opcional"
                  value={benchmarkFilters.hotelType}
                  onChange={(value) => setBenchmarkFilters((current) => ({ ...current, hotelType: value }))}
                  options={hotelTypeOptions}
                  listId="hotel-benchmark-type"
                  placeholder="Ej. Luxury Lodge"
                />
                <ComboField
                  label="Estrellas"
                  hint="Opcional"
                  value={benchmarkFilters.stars ? String(benchmarkFilters.stars) : ""}
                  onChange={(value) =>
                    setBenchmarkFilters((current) => ({
                      ...current,
                      stars: value ? Number(value) : null
                    }))
                  }
                  options={starOptions}
                  listId="hotel-benchmark-stars"
                  placeholder="4 o 5"
                />
              </div>
            </div>
            {benchmarkError ? <p className="mt-4 text-sm text-red-600 dark:text-red-400">{benchmarkError}</p> : null}
          </Card>

          {benchmarkResult ? (
            <>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Resultado del benchmark
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                      {benchmarkResult.mode === "gemini" ? "Comparativa construida" : "Comparativa base del módulo"}
                    </h2>
                    <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {benchmarkResult.overview}
                    </p>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    {benchmarkResult.mode === "gemini" ? "Investigación activa" : "Referencia base"}
                  </div>
                </div>
                {benchmarkResult.warning ? (
                  <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{benchmarkResult.warning}</p>
                ) : null}
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <SummaryMetric
                    label="Hoteles"
                    value={formatCompactNumber(benchmarkHotels.length)}
                    helper="Cantidad de comparables detectados por la búsqueda."
                  />
                  <SummaryMetric
                    label="Tarifa doble ref."
                    value={formatUsd(averageDoubleReferenceRate)}
                    helper="Promedio competitivo del set: puede mezclar tarifa publicada, paquete o estimación etiquetada."
                  />
                  <SummaryMetric
                    label="Tarifa suite ref."
                    value={formatUsd(averageSuiteReferenceRate)}
                    helper="Referencia para comparar mercado, no necesariamente tarifa room-only exacta."
                  />
                  <SummaryMetric
                    label="Filtro"
                    value={starValueLabel}
                    helper={benchmarkFilters.municipality || benchmarkFilters.region || benchmarkFilters.country}
                  />
                </div>
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  <strong className="text-slate-950 dark:text-slate-50">Lectura de tarifas:</strong> siempre se muestra
                  una referencia numérica para comparar competencia. Si ves Paq., el valor puede incluir
                  all-inclusive, excursiones, traslados o precio por persona. Si ves Ref., es una tarifa de
                  referencia estimada desde el set competitivo y debe revisarse antes de usarla como ADR final.
                </div>
              </Card>

              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-6">
                  <TableCard
                    title="Grilla comparativa de hoteles"
                    description="La tabla resume los comparables de la zona para que puedas revisar rápidamente formato, tarifas y foco competitivo."
                    helperTitle="Cómo leer la grilla"
                    helperContent={
                      <>
                        La grilla muestra números porque el caso necesita comparación de mercado. La columna Confianza explica si el valor es publicado, paquete o referencia estimada.
                      </>
                    }
                  >
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="pb-3">Hotel</th>
                          <th className="pb-3">Destino</th>
                          <th className="pb-3">Tipo</th>
                          <th className="pb-3">Estrellas</th>
                          <th className="pb-3">Single</th>
                          <th className="pb-3">Doble</th>
                          <th className="pb-3">Suite</th>
                          <th className="pb-3">Confianza</th>
                        </tr>
                      </thead>
                      <tbody>
                        {benchmarkHotels.map((reference) => {
                          const isSelected = selectedReference?.id === reference.id;

                          return (
                            <tr
                              key={reference.id}
                              onClick={() => setSelectedBenchmarkId(reference.id)}
                              className={`cursor-pointer border-t border-slate-200 dark:border-slate-800 ${isSelected ? "bg-slate-50 dark:bg-slate-900" : ""}`}
                            >
                              <td className="py-3 font-medium text-slate-900 dark:text-slate-50">{reference.name}</td>
                              <td className="py-3 text-slate-600 dark:text-slate-300">{reference.municipality}</td>
                              <td className="py-3 text-slate-600 dark:text-slate-300">{reference.hotelType}</td>
                              <td className="py-3 text-slate-600 dark:text-slate-300">{reference.stars}</td>
                              <td className="py-3 text-slate-600 dark:text-slate-300">{formatBenchmarkRate(reference, "single")}</td>
                              <td className="py-3 text-slate-600 dark:text-slate-300">{formatBenchmarkRate(reference, "double")}</td>
                              <td className="py-3 text-slate-600 dark:text-slate-300">{formatBenchmarkRate(reference, "suite")}</td>
                              <td className="py-3 text-slate-600 dark:text-slate-300">{getRateConfidenceLabel(reference.rateConfidence)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </TableCard>

                  <TableCard
                    title="Señales de mercado"
                    description="Estas señales te ayudan a justificar por qué la zona soporta o dificulta un nuevo hotel."
                  >
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="pb-3">Indicador</th>
                          <th className="pb-3">Valor</th>
                          <th className="pb-3">Lectura</th>
                        </tr>
                      </thead>
                      <tbody>
                        {benchmarkResult.marketSignals.map((signal) => (
                          <tr key={`${signal.label}-${signal.value}`} className="border-t border-slate-200 dark:border-slate-800">
                            <td className="py-3 font-medium text-slate-900 dark:text-slate-50">{signal.label}</td>
                            <td className="py-3 text-slate-600 dark:text-slate-300">{signal.value}</td>
                            <td className="py-3 text-slate-600 dark:text-slate-300">
                              {signal.note}
                              <SourceBadge title={signal.sourceTitle} url={signal.sourceUrl} asOf={signal.asOf} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableCard>
                </div>

                <div className="space-y-6 xl:sticky xl:top-24 self-start">
                  <Card className="p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Hotel seleccionado
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                      {selectedReference?.name ?? "Selecciona un hotel de la grilla"}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {selectedReference
                        ? `${selectedReference.municipality} · ${selectedReference.area}. ${selectedReference.note}`
                        : "El detalle del benchmark aparecerá aquí para ayudarte a decidir si lo usas como base del caso."}
                    </p>
                    {selectedReference ? (
                      <>
                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                          <Highlight title="Tarifa doble" text={formatBenchmarkRate(selectedReference, "double")} tone="emerald" />
                          <Highlight title="Producto" text={`${selectedReference.hotelType} · ${selectedReference.stars} estrellas`} />
                        </div>
                        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900">
                          <p className="font-semibold text-slate-950 dark:text-slate-50">Base de tarifa</p>
                          <p className="mt-2 leading-6 text-slate-600 dark:text-slate-300">
                            {getRateConfidenceLabel(selectedReference.rateConfidence)} · {selectedReference.rateBasis ?? "Base no especificada"}
                          </p>
                          <p className="mt-2 leading-6 text-slate-600 dark:text-slate-300">
                            {selectedReference.rateNote ?? "Valida esta tarifa en la fuente antes de usarla como supuesto final."}
                          </p>
                          <SourceBadge
                            title={selectedReference.rateSourceTitle ?? selectedReference.sourceTitle}
                            url={selectedReference.rateSourceUrl ?? selectedReference.sourceUrl}
                            asOf={selectedReference.rateAsOf}
                          />
                        </div>
                        <div className="mt-5">
                          <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Servicios e instalaciones</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {[...selectedReference.services, ...selectedReference.facilities].join(", ")}
                          </p>
                        </div>
                        <div className="mt-5 grid gap-3">
                          {selectedReference.differentiationIdeas.map((idea, index) => (
                            <Highlight key={`${idea}-${index}`} title={`Diferenciación ${index + 1}`} text={idea} />
                          ))}
                        </div>
                        <div className="mt-5 flex flex-wrap gap-3">
                          <Button
                            onClick={() => {
                              applyReferenceToCase(selectedReference);
                              setActiveTab("case");
                            }}
                          >
                            Usar este benchmark en mi caso
                          </Button>
                          <SourceBadge title={selectedReference.sourceTitle} url={selectedReference.sourceUrl} />
                        </div>
                      </>
                    ) : null}
                  </Card>

                  <Card className="p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Patrones y consejos
                    </p>
                    <div className="mt-4 grid gap-3">
                      {benchmarkResult.commonPatterns.map((pattern, index) => (
                        <Highlight key={`${pattern}-${index}`} title={`Patrón ${index + 1}`} text={pattern} />
                      ))}
                      {benchmarkResult.differentiationIdeas.map((idea, index) => (
                        <Highlight key={`${idea}-${index}`} title={`Consejo ${index + 1}`} text={idea} tone={index === 0 ? "emerald" : "amber"} />
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </>
          ) : (
            <Card>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                Completa al menos la región y ejecuta la búsqueda. Cuando lleguen los resultados, esta pestaña mostrará la comparativa en tablas, la lectura del benchmark y un botón para usar uno de los hoteles como base del caso.
              </div>
            </Card>
          )}
        </div>
      ) : null}

      {activeTab === "case" ? (
        <div className="no-print space-y-6">
          <Card>
            <SectionIntro
              step="Paso 1"
              title="Prepara tu caso hotelero"
              description="Esta pestaña se usa para modelar el proyecto. Si aún no elegiste benchmark, vuelve a la pestaña anterior y trae una referencia comparativa para trabajar con una base más realista."
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryMetric
                label="Benchmark activo"
                value={selectedReference?.name ?? "Sin benchmark"}
                helper="Puedes volver a la pestaña Buscar Benchmark y traer un comparable real para usarlo como base."
              />
              <SummaryMetric
                label="ADR doble benchmark"
                value={selectedReference ? formatUsd(selectedReference.rates.double) : formatUsd(averageDoubleReferenceRate)}
                helper="Sirve para no construir un caso fuera del rango del mercado."
              />
              <SummaryMetric
                label="Filtro usado"
                value={starValueLabel}
                helper={benchmarkFilters.municipality || benchmarkFilters.region || benchmarkFilters.country}
              />
              <SummaryMetric
                label="Consejo"
                value="Modela desde una referencia"
                helper="Tomar un benchmark antes de completar tarifas y servicios hace que el caso sea mucho más creíble."
              />
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <Card>
              <SectionIntro
                step="Paso 1"
                title="Configura el hotel y el destino"
                description="Aquí defines qué hotel quieres evaluar. Si ya elegiste una referencia arriba, este bloque te servirá para adaptar esa base a tu propio proyecto."
              />
              <HelperDetails title="¿Qué conviene completar bien aquí?" defaultOpen>
                Lo más importante es elegir bien el destino, definir cuántas habitaciones tendrá el hotel, qué
                nivel de servicio ofrecerá y cuál es la meta de tarifa promedio que quieres defender.
              </HelperDetails>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <FormField label="Nombre del hotel" hint="Nombre del proyecto">
                  <Input value={hotelCase.hotelName} onChange={(event) => updateCase("hotelName", event.target.value)} />
                </FormField>
                <FormField label="Destino" hint="Lugar del caso">
                  <Select
                    value={hotelCase.destination}
                    onChange={(event) => applyDestination(event.target.value as HotelCaseInput["destination"])}
                  >
                    {HOTEL_DESTINATION_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Region" hint="Se completa con el destino">
                  <Input value={hotelCase.region} onChange={(event) => updateCase("region", event.target.value)} />
                </FormField>
                <FormField label="Pais">
                  <Input value={hotelCase.country} onChange={(event) => updateCase("country", event.target.value)} />
                </FormField>
                <FormField label="Categoria" hint="Ej. 5 estrellas">
                  <Input value={hotelCase.category} onChange={(event) => updateCase("category", event.target.value)} />
                </FormField>
                <FormField label="Total de habitaciones" hint="Capacidad total">
                  <Input
                    type="number"
                    value={hotelCase.totalRooms}
                    onChange={(event) => updateCase("totalRooms", Number(event.target.value))}
                  />
                </FormField>
                <FormField label="Concepto del hotel" className="md:col-span-2" hint="Qué tipo de hotel quieres abrir">
                  <Textarea value={hotelCase.concept} onChange={(event) => updateCase("concept", event.target.value)} />
                </FormField>
                <FormField label="Servicios a ofrecer" className="md:col-span-2" hint="Spa, restaurant, concierge, etc.">
                  <Textarea value={hotelCase.services} onChange={(event) => updateCase("services", event.target.value)} />
                </FormField>
                <FormField label="Diferenciacion" className="md:col-span-2" hint="Por qué alguien te elegiría">
                  <Textarea value={hotelCase.differentiation} onChange={(event) => updateCase("differentiation", event.target.value)} />
                </FormField>
              </div>
            </Card>

            <Card>
              <SectionIntro
                step="Paso 2"
                title="Completa habitaciones, tarifas y demanda"
                description="Esta parte alimenta el cálculo del forecast. La app usará estos datos para estimar ingresos, ADR y presión comercial."
              />
              <HelperDetails title="¿Cómo pensar este bloque?">
                Primero distribuye las habitaciones entre Single, Doble, Triple y Suite. Luego asigna una tarifa
                por tipo. La meta no es solo vender mucho, sino vender con una tarifa promedio sana.
              </HelperDetails>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <FormField label="Single" hint="Cantidad de habitaciones">
                  <Input type="number" value={hotelCase.roomMix.single} onChange={(event) => updateRoomMix("single", Number(event.target.value))} />
                </FormField>
                <FormField label="Tarifa Single (USD)" hint="Precio promedio">
                  <Input type="number" value={hotelCase.roomRates.single} onChange={(event) => updateRoomRate("single", Number(event.target.value))} />
                </FormField>
                <FormField label="Doble" hint="Cantidad de habitaciones">
                  <Input type="number" value={hotelCase.roomMix.double} onChange={(event) => updateRoomMix("double", Number(event.target.value))} />
                </FormField>
                <FormField label="Tarifa Doble (USD)" hint="Precio promedio">
                  <Input type="number" value={hotelCase.roomRates.double} onChange={(event) => updateRoomRate("double", Number(event.target.value))} />
                </FormField>
                <FormField label="Triple" hint="Cantidad de habitaciones">
                  <Input type="number" value={hotelCase.roomMix.triple} onChange={(event) => updateRoomMix("triple", Number(event.target.value))} />
                </FormField>
                <FormField label="Tarifa Triple (USD)" hint="Precio promedio">
                  <Input type="number" value={hotelCase.roomRates.triple} onChange={(event) => updateRoomRate("triple", Number(event.target.value))} />
                </FormField>
                <FormField label="Suite" hint="Cantidad de habitaciones">
                  <Input type="number" value={hotelCase.roomMix.suite} onChange={(event) => updateRoomMix("suite", Number(event.target.value))} />
                </FormField>
                <FormField label="Tarifa Suite (USD)" hint="Precio promedio">
                  <Input type="number" value={hotelCase.roomRates.suite} onChange={(event) => updateRoomRate("suite", Number(event.target.value))} />
                </FormField>
                <FormField label="ADR historico (USD)" hint="Tarifa promedio previa">
                  <Input
                    type="number"
                    value={hotelCase.previousAverageRate}
                    onChange={(event) => updateCase("previousAverageRate", Number(event.target.value))}
                  />
                </FormField>
                <FormField label="Meta ADR mensual (USD)" hint="Meta de gerencia">
                  <Input
                    type="number"
                    value={hotelCase.targetAverageRate}
                    onChange={(event) => updateCase("targetAverageRate", Number(event.target.value))}
                  />
                </FormField>
                <FormField label="Ocupacion Enero 2027 (%)" hint="Temporada alta">
                  <Input
                    type="number"
                    value={hotelCase.occupancyJanuary}
                    onChange={(event) => updateCase("occupancyJanuary", Number(event.target.value))}
                  />
                </FormField>
                <FormField label="Ocupacion Febrero 2027 (%)" hint="Temporada alta">
                  <Input
                    type="number"
                    value={hotelCase.occupancyFebruary}
                    onChange={(event) => updateCase("occupancyFebruary", Number(event.target.value))}
                  />
                </FormField>
                <FormField label="Factor huespedes por habitacion" hint="Ej. 2 personas">
                  <Input
                    type="number"
                    value={hotelCase.guestFactor}
                    onChange={(event) => updateCase("guestFactor", Number(event.target.value))}
                  />
                </FormField>
                <FormField label="Desayuno actual (USD por persona)" hint="Precio actual">
                  <Input
                    type="number"
                    value={hotelCase.breakfastPriceCurrent}
                    onChange={(event) => updateCase("breakfastPriceCurrent", Number(event.target.value))}
                  />
                </FormField>
                <FormField label="Desayuno propuesto (USD por persona)" hint="Precio nuevo">
                  <Input
                    type="number"
                    value={hotelCase.breakfastPriceProposed}
                    onChange={(event) => updateCase("breakfastPriceProposed", Number(event.target.value))}
                  />
                </FormField>
              </div>
              <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Tabla maestra de habitaciones</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Vista estilo presupuesto hotelero para revisar inventario y tarifas antes de calcular.
                    </p>
                  </div>
                </div>
                <table className="min-w-full text-left text-sm">
                  <thead className="text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="pb-3">Tipo</th>
                      <th className="pb-3">Habitaciones</th>
                      <th className="pb-3">% inventario</th>
                      <th className="pb-3">Tarifa caso</th>
                      <th className="pb-3">Mercado destino</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ROOM_TYPE_ORDER.map((type) => {
                      const rooms = hotelCase.roomMix[type];
                      const share = hotelCase.totalRooms > 0 ? (rooms / hotelCase.totalRooms) * 100 : 0;

                      return (
                        <tr key={type} className="border-t border-slate-200 dark:border-slate-800">
                          <td className="py-3 font-medium text-slate-900 dark:text-slate-50">{ROOM_TYPE_LABELS[type]}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatCompactNumber(rooms)}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatPercent(share)}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(hotelCase.roomRates[type])}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(destinationProfile.marketRateReference[type])}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <SectionIntro
                step="Paso 3"
                title="Define canales, tarifarios y cupos"
                description="Aquí modelas tres cosas a la vez: qué peso tendrá cada canal, qué tarifa venderá por tipología y cuántas habitaciones tendrá asignadas para operar."
              />
              <HelperDetails title="¿Por qué esto importa tanto?" defaultOpen>
                Dos hoteles pueden tener la misma ocupación y dejar rentabilidades muy distintas. La diferencia
                está en la tarifa que se ofrece por canal, la comisión que se paga y el cupo real que se asigna a
                cada intermediario o canal propio.
              </HelperDetails>
              <div className="mt-5 grid gap-4">
                {(Object.keys(DEFAULT_HOTEL_CHANNELS) as HotelSalesChannelId[]).map((channel) => (
                  <div
                    key={channel}
                    className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_160px_160px]"
                  >
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-slate-50">{HOTEL_CHANNEL_LABELS[channel]}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Define cuánto venderá este canal y cuál será su costo comercial.
                      </p>
                    </div>
                    <FormField label="Participacion %" className="gap-1">
                      <Input
                        type="number"
                        value={hotelCase.channels[channel].share}
                        onChange={(event) => updateChannelField(channel, "share", Number(event.target.value))}
                      />
                    </FormField>
                    <FormField label="Comision %" className="gap-1">
                      <Input
                        type="number"
                        value={hotelCase.channels[channel].commission}
                        onChange={(event) => updateChannelField(channel, "commission", Number(event.target.value))}
                      />
                    </FormField>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <SummaryMetric
                  label="Mix de canal"
                  value={formatPercent(totalChannelShare)}
                  helper="La suma de participación de los canales debe quedar en 100%."
                />
                <SummaryMetric
                  label="Asignación Single"
                  value={`${roomAllocationTotals.single} / ${hotelCase.roomMix.single}`}
                  helper="Control rápido del cupo asignado para la tipología Single."
                />
                <SummaryMetric
                  label="Asignación Doble"
                  value={`${roomAllocationTotals.double} / ${hotelCase.roomMix.double}`}
                  helper="Control rápido del cupo asignado para la tipología Doble."
                />
              </div>
              <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Grilla de tarifario por canal</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cada fila representa un canal de venta. Aquí defines el precio con el que ese canal comercializará cada tipología.
                  </p>
                </div>
                <table className="min-w-full text-left text-sm">
                  <thead className="text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="pb-3">Canal</th>
                      {ROOM_TYPE_ORDER.map((type) => (
                        <th key={type} className="pb-3">
                          {ROOM_TYPE_LABELS[type]}
                        </th>
                      ))}
                      <th className="pb-3">Comisión</th>
                      <th className="pb-3">Mix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CHANNEL_ORDER.map((channel) => (
                      <tr key={channel} className="border-t border-slate-200 dark:border-slate-800">
                        <td className="py-3 font-medium text-slate-900 dark:text-slate-50">{HOTEL_CHANNEL_LABELS[channel]}</td>
                        {ROOM_TYPE_ORDER.map((type) => (
                          <td key={type} className="py-3 pr-3">
                            <Input
                              type="number"
                              value={hotelCase.channels[channel].rates[type]}
                              onChange={(event) => updateChannelRate(channel, type, Number(event.target.value))}
                            />
                          </td>
                        ))}
                        <td className="py-3 text-slate-600 dark:text-slate-300">{formatPercent(hotelCase.channels[channel].commission)}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">{formatPercent(hotelCase.channels[channel].share)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Grilla de asignación de habitaciones por canal</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Aquí asignas el inventario operativo por canal. La suma de cada columna debe coincidir con el inventario total por tipología.
                  </p>
                </div>
                <table className="min-w-full text-left text-sm">
                  <thead className="text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="pb-3">Canal</th>
                      {ROOM_TYPE_ORDER.map((type) => (
                        <th key={type} className="pb-3">
                          {ROOM_TYPE_LABELS[type]}
                        </th>
                      ))}
                      <th className="pb-3">Total asignado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CHANNEL_ORDER.map((channel) => (
                      <tr key={channel} className="border-t border-slate-200 dark:border-slate-800">
                        <td className="py-3 font-medium text-slate-900 dark:text-slate-50">{HOTEL_CHANNEL_LABELS[channel]}</td>
                        {ROOM_TYPE_ORDER.map((type) => (
                          <td key={type} className="py-3 pr-3">
                            <Input
                              type="number"
                              value={hotelCase.channels[channel].roomAllocation[type]}
                              onChange={(event) => updateChannelAllocation(channel, type, Number(event.target.value))}
                            />
                          </td>
                        ))}
                        <td className="py-3 text-slate-600 dark:text-slate-300">
                          {formatCompactNumber(
                            ROOM_TYPE_ORDER.reduce((sum, type) => sum + hotelCase.channels[channel].roomAllocation[type], 0)
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-slate-300 font-semibold text-slate-900 dark:border-slate-700 dark:text-slate-50">
                      <td className="py-3">Control total</td>
                      {ROOM_TYPE_ORDER.map((type) => (
                        <td key={type} className="py-3">
                          {formatCompactNumber(roomAllocationTotals[type])} / {formatCompactNumber(hotelCase.roomMix[type])}
                        </td>
                      ))}
                      <td className="py-3">{formatCompactNumber(totalRoomMix)} / {formatCompactNumber(hotelCase.totalRooms)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Resumen ejecutivo de canales</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Esta tabla condensa peso comercial, comisión y habitaciones asignadas por canal.
                  </p>
                </div>
                <table className="min-w-full text-left text-sm">
                  <thead className="text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="pb-3">Canal</th>
                      <th className="pb-3">Participación</th>
                      <th className="pb-3">Comisión</th>
                      <th className="pb-3">Habitaciones asignadas</th>
                      <th className="pb-3">Lectura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CHANNEL_ORDER.map((channel) => (
                      <tr key={channel} className="border-t border-slate-200 dark:border-slate-800">
                        <td className="py-3 font-medium text-slate-900 dark:text-slate-50">{HOTEL_CHANNEL_LABELS[channel]}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">{formatPercent(hotelCase.channels[channel].share)}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">{formatPercent(hotelCase.channels[channel].commission)}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">
                          {formatCompactNumber(
                            ROOM_TYPE_ORDER.reduce((sum, type) => sum + hotelCase.channels[channel].roomAllocation[type], 0)
                          )}
                        </td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">
                          {channel === "direct"
                            ? "Canal clave para capturar margen y defender tarifas premium."
                            : channel === "tourOperators"
                              ? "Útil para volumen, pero necesita cupos y tarifas controladas."
                              : channel === "onlineAgencies"
                                ? "Aporta visibilidad y pickup, con presión comercial más alta."
                                : "Puede estabilizar fechas corporativas y demanda de hombro."}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void solveHotelCase()} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Resolver caso hotelero
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setHotelCase(createDefaultHotelCase());
                    clearCurrentResult();
                    setCurrentSavedCaseId(null);
                    setError(null);
                  }}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Reiniciar
                </Button>
              </div>

              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
            </div>

            <div className="space-y-6 xl:sticky xl:top-24 self-start">
              <Card>
              <SectionIntro
                title="Revision rapida"
                description="Antes de resolver el caso, aquí ves si los datos están consistentes."
              />
              <div className="grid gap-3">
                <SummaryMetric
                  label="Mix de habitaciones"
                  value={`${totalRoomMix} / ${hotelCase.totalRooms}`}
                  helper="La suma de Single, Doble, Triple y Suite debería coincidir con el total del hotel."
                />
                <SummaryMetric
                  label="Canales"
                  value={`${totalChannelShare}%`}
                  helper="La mezcla de canales debería sumar 100% para que el forecast sea coherente."
                />
                <SummaryMetric
                  label="Meta ADR"
                  value={formatUsd(hotelCase.targetAverageRate)}
                  helper="Esta es la tarifa promedio mensual mínima que el hotel quiere alcanzar."
                />
              </div>
            </Card>

              <Card>
              <div className="flex items-center gap-3">
                <MapPinned className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Destino seleccionado
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                    {destinationProfile.label}
                  </h3>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {destinationProfile.destinationDiagnosis}
              </p>
              <HelperDetails title="¿Qué atractivos sostienen la demanda?">
                <div className="grid gap-2">
                  {destinationProfile.attractions.map((attraction) => (
                    <div key={attraction} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                      {attraction}
                    </div>
                  ))}
                </div>
              </HelperDetails>
            </Card>

              <Card>
              <div className="flex items-center gap-3">
                <BedDouble className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Vista previa del caso
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                    Lo que ya se puede anticipar
                  </h3>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                <Highlight
                  title="Enero 2027"
                  text={`Con ${hotelCase.occupancyJanuary}% de ocupación, el hotel movería aproximadamente ${formatCompactNumber(januaryPreviewRoomNights)} room nights.`}
                  tone="emerald"
                />
                <Highlight
                  title="Febrero 2027"
                  text={`Con ${hotelCase.occupancyFebruary}% de ocupación, el hotel movería aproximadamente ${formatCompactNumber(februaryPreviewRoomNights)} room nights.`}
                />
                <Highlight
                  title="Tarifa objetivo"
                  text={`El análisis buscará comprobar si el hotel puede sostener un ADR superior a ${formatUsd(hotelCase.targetAverageRate)} sin depender en exceso de canales caros.`}
                  tone="amber"
                />
              </div>
              </Card>
            </div>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className={activeTab === "research" ? "space-y-6" : "hidden print:block print:space-y-6"}>
          <div className="print-only report-page-break mb-6 rounded-3xl border border-slate-200 bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Informe hotelero completo</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">{result.input.hotelName}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {HOTEL_DESTINATION_PROFILES[result.input.destination].label}
              {" · "}
              {result.input.region}
              {" · "}
              {result.input.country}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <SummaryMetric label="ADR proyectado" value={formatUsd(result.summary.weightedAverageAdr)} helper="Tarifa promedio del caso resuelto." />
              <SummaryMetric label="Meta ADR" value={formatUsd(result.input.targetAverageRate)} helper="Objetivo mensual definido por gerencia." />
              <SummaryMetric label="Canal mas rentable" value={HOTEL_CHANNEL_LABELS[result.summary.mostProfitableChannel]} helper="Canal con mejor retorno neto relativo." />
            </div>
          </div>
          <Card>
            <SectionIntro
              title="El mercado explicado en simple"
              description="Aquí la app transforma la investigación del destino en una lectura fácil. La idea es que entiendas si el lugar realmente ayuda o complica al hotel."
            />
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Sparkles className="h-3.5 w-3.5" />
              {result.research.mode === "gemini" ? "Investigacion actualizada" : "Referencia base"}
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              {result.research.destinationDiagnosis}
            </p>
            {result.research.warning ? (
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{result.research.warning}</p>
            ) : null}
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <SectionIntro
                title="SEPTE"
                description="Cada factor SEPTE cruza señal de mercado, lectura estratégica e implicancia competitiva para el caso. El foco está en argumentar cómo los datos endurecen o favorecen la tesis del hotel."
              />
              <div className="grid gap-3">
                {result.research.septeFactors.map((factor, index) => (
                  <HelperDetails key={factor.id} title={`${index + 1}. ${factor.label}`} defaultOpen={index === 0}>
                    <p className="text-sm leading-7 text-slate-700 dark:text-slate-300">{factor.analysis}</p>
                    <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-950 dark:text-slate-50">Implicancia competitiva:</span>{" "}
                      {factor.implication}
                    </p>
                    {factor.evidence.length ? (
                      <div className="mt-4 grid gap-3">
                        {factor.evidence.map((evidence) => (
                          <div
                            key={`${factor.id}-${evidence.label}-${evidence.value}`}
                            className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950"
                          >
                            <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                              {evidence.label}: {evidence.value}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{evidence.note}</p>
                            <SourceBadge title={evidence.sourceTitle} url={evidence.sourceUrl} asOf={evidence.asOf} />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </HelperDetails>
                ))}
              </div>
            </Card>

            <Card>
              <SectionIntro
                title="Atractivos y señales de demanda"
                description="Estos son los motivos principales por los que una persona viajaría a este destino y por qué eso puede sostener al hotel. Las métricas y los atractivos muestran su fuente directamente."
              />
              <div className="grid gap-3">
                {result.research.touristStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30"
                  >
                    <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                      {stat.label}: {stat.value}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{stat.note}</p>
                    <SourceBadge title={stat.sourceTitle} url={stat.sourceUrl} asOf={stat.asOf} />
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-3">
                {result.research.attractions.map((attraction) => (
                  <div
                    key={attraction.name}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <p className="font-semibold text-slate-950 dark:text-slate-50">{attraction.name}</p>
                    <p className="mt-2 text-slate-600 dark:text-slate-300">{attraction.relevance}</p>
                    <SourceBadge title={attraction.sourceTitle} url={attraction.sourceUrl} />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <SectionIntro
              title="Competencia explicada de forma simple"
              description="La app compara tu hotel con referencias premium del destino. No solo mira precio: también servicios, instalaciones y posicionamiento."
            />
            <Highlight
              title="Lectura general"
              text={result.research.competitionSummary}
              tone="amber"
            />
            <div className="mt-5 grid gap-3">
              {result.research.competitors.map((competitor, index) => (
                <HelperDetails key={competitor.name} title={`${index + 1}. ${competitor.name}`} defaultOpen={index === 0}>
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{competitor.area}</p>
                  <p className="mt-2">{competitor.positioning}</p>
                  <div className="mt-4 grid gap-2">
                    <div>Servicios: {competitor.services.join(", ")}</div>
                    <div>Instalaciones: {competitor.facilities.join(", ")}</div>
                    <div>
                      Tarifas de referencia: {formatUsd(competitor.rates.single)} / {formatUsd(competitor.rates.double)} / {formatUsd(competitor.rates.triple)} / {formatUsd(competitor.rates.suite)}
                    </div>
                  </div>
                  <p className="mt-4">{competitor.note}</p>
                </HelperDetails>
              ))}
            </div>
          </Card>

          <Card>
            <SectionIntro
              title="Fuentes para revisar"
              description="Si quieres validar el análisis, aquí tienes las fuentes base usadas por la app."
            />
            <div className="grid gap-3">
              {result.research.sources.map((source) => (
                <HelperDetails key={`${source.title}-${source.url}`} title={source.title}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-blue-700 underline dark:text-blue-300"
                  >
                    {source.url}
                  </a>
                  <p className="mt-3">{source.note}</p>
                </HelperDetails>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {result ? (
        <div
          className={activeTab === "forecast" ? "space-y-6" : "hidden print:block print:space-y-6"}
        >
          <Card>
            <SectionIntro
              title="Panel operativo del caso"
              description="Esta vista toma como referencia una planilla hotelera de presupuesto, pero la traduce a una experiencia más simple. Cada mes se divide en fases para que puedas entender qué se ofrece, cómo se reparte, cuánto vende y dónde se pierde margen."
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <SummaryMetric
                label="ADR ponderado"
                value={formatUsd(result.summary.weightedAverageAdr)}
                helper="Es la tarifa promedio lograda entre todas las habitaciones vendidas."
              />
              <SummaryMetric
                label="Meta ADR"
                value={result.summary.adrTargetMet ? "Cumplida" : "Bajo meta"}
                helper="Indica si el hotel alcanza la meta tarifaria definida por gerencia."
              />
              <SummaryMetric
                label="Comisiones"
                value={formatUsd(result.summary.totalCommissions)}
                helper="Es lo que el hotel paga a intermediarios por vender habitaciones."
              />
              <SummaryMetric
                label="Delta desayuno"
                value={formatUsd(result.summary.totalBreakfastDelta)}
                helper="Muestra cuánto más ingresaría el hotel con el nuevo precio del desayuno."
              />
              <SummaryMetric
                label="Canal mas rentable"
                value={HOTEL_CHANNEL_LABELS[result.summary.mostProfitableChannel]}
                helper="Es el canal que deja mejor resultado neto relativo después de comisiones."
              />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Highlight
                title="Lectura directa"
                text={
                  result.summary.adrTargetMet
                    ? `El caso logra sostener la meta de ADR. Eso significa que no solo vende habitaciones, sino que las vende con una tarifa suficientemente saludable.`
                    : `El caso todavía no logra la meta de ADR. Eso significa que el hotel sí podría vender, pero con una tarifa media más baja de la que la gerencia quiere.`
                }
                tone={result.summary.adrTargetMet ? "emerald" : "amber"}
              />
              <Highlight
                title="Qué debes mirar primero"
                text="Si el ADR no alcanza, revisa primero las tarifas por tipo de habitación y la mezcla de canales. Si las comisiones son muy altas, la ocupación por sí sola no basta."
              />
              <Highlight
                title="Lectura estilo app hotelera"
                text="Piensa este bloque como un tablero de revenue: primero validas inventario y tarifas, luego revisas cómo se distribuye la demanda, cuánto factura cada parte y cuál canal deja mejor margen."
              />
            </div>
            <div className="mt-5">
              <HelperDetails title="¿Cómo leer estas fases?" defaultOpen>
                La app ordena el forecast igual que una hoja de trabajo hotelera. Fase 1 muestra inventario y
                tarifas. Fase 2 reparte la ocupación entre los canales. Fase 3 traduce esa ocupación a ingresos.
                Fase 4 mide comisiones y rentabilidad. Fase 5 revisa desayuno y consumo por huésped.
              </HelperDetails>
            </div>
            <div className="mt-3">
              <HelperDetails title="¿Cómo calcula la app este forecast?">
                La app toma la capacidad del hotel, la ocupación prevista por mes, la distribuye según el mix de
                habitaciones y luego estima ingresos por tarifa, desayuno y canal de venta. Las conclusiones
                finales salen de ese cálculo, no de una opinión de la IA.
              </HelperDetails>
            </div>
          </Card>

          {result.monthlyForecasts.map((month, index) => (
            <details
              key={month.month}
              open={isPrinting || index === 0}
              className="report-page-break rounded-3xl border border-slate-200 bg-white/80 p-0 dark:border-slate-800 dark:bg-slate-950/70 print:block"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 marker:content-none">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    {month.month}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">
                    Resultado mensual
                  </h2>
                </div>
                <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-950">
                  {month.occupancyRate.toFixed(1)}% ocupacion
                </div>
              </summary>

              <div className="border-t border-slate-200 px-6 py-6 dark:border-slate-800">
                <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                  <SummaryMetric
                    label="RN disponibles"
                    value={formatCompactNumber(month.availableRoomNights)}
                    helper="Cantidad total de noches-habitación que el hotel puede vender en el mes."
                  />
                  <SummaryMetric
                    label="RN vendidas"
                    value={formatCompactNumber(month.occupiedRoomNights)}
                    helper="Noches-habitación efectivamente ocupadas según la ocupación prevista."
                  />
                  <SummaryMetric
                    label="Huespedes"
                    value={formatCompactNumber(month.totalGuests)}
                    helper="Estimación de personas alojadas usando el factor de huéspedes por habitación."
                  />
                  <SummaryMetric
                    label="ADR logrado"
                    value={formatUsd(month.achievedAdr)}
                    helper="Tarifa promedio conseguida durante este mes."
                  />
                  <SummaryMetric
                    label="Revenue habitaciones"
                    value={formatUsd(month.grossRoomRevenue)}
                    helper="Ingreso bruto generado solo por venta de habitaciones."
                  />
                  <SummaryMetric
                    label="Revenue desayuno"
                    value={formatUsd(month.breakfastRevenueProposed)}
                    helper="Ingreso estimado por desayuno con el precio nuevo propuesto."
                  />
                </div>

                <div className="space-y-6">
                  <TableCard
                    title="Fase 1. Oferta de habitaciones y tarifas"
                    description="Primero validas qué inventario tiene el hotel, cómo se reparte entre tipos de habitación y si las tarifas del caso están alineadas con el mercado del destino."
                    helperTitle="Cómo leer esta tabla"
                    helperContent={
                      <>
                        Si una tarifa del caso queda muy por debajo del mercado, puede ayudar a llenar ocupación
                        pero también hundir el ADR. Si queda muy por encima, necesitará una propuesta de valor muy
                        convincente.
                      </>
                    }
                  >
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="pb-3">Tipo</th>
                          <th className="pb-3">Habitaciones</th>
                          <th className="pb-3">% inventario</th>
                          <th className="pb-3">RN vendidas</th>
                          <th className="pb-3">Tarifa caso</th>
                          <th className="pb-3">Mercado</th>
                          <th className="pb-3">Ingreso total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ROOM_TYPE_ORDER.map((type) => {
                          const roomRow = month.roomTypeResults.find((item) => item.type === type);
                          const inventoryShare = result.input.totalRooms > 0 ? (result.input.roomMix[type] / result.input.totalRooms) * 100 : 0;

                          return (
                            <tr key={type} className="border-t border-slate-200 dark:border-slate-800">
                              <td className="py-3 font-medium text-slate-900 dark:text-slate-50">{ROOM_TYPE_LABELS[type]}</td>
                              <td className="py-3 text-slate-600 dark:text-slate-300">{formatCompactNumber(result.input.roomMix[type])}</td>
                              <td className="py-3 text-slate-600 dark:text-slate-300">{formatPercent(inventoryShare)}</td>
                              <td className="py-3 text-slate-600 dark:text-slate-300">{roomRow?.soldRoomNights.toFixed(1) ?? "0.0"}</td>
                              <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(result.input.roomRates[type])}</td>
                              <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(result.research.marketRateReference[type])}</td>
                              <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(roomRow?.revenue ?? 0)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </TableCard>

                  <TableCard
                    title="Fase 2. Ocupación por canal y tipología"
                    description="Esta grilla cruza el cupo asignado a cada canal con las room nights que realmente proyecta vender. Así puedes ver qué canal está tensionado y cuál queda con capacidad ociosa."
                    helperTitle="Qué representa cada número"
                    helperContent={
                      <>
                        Cada celda muestra habitaciones asignadas, room nights vendidas y ocupación proyectada sobre
                        el cupo de ese canal. Si una ocupación supera 100%, la asignación comercial quedó corta.
                      </>
                    }
                  >
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="pb-3">Canal</th>
                          {ROOM_TYPE_ORDER.map((type) => (
                            <th key={type} className="pb-3">
                              {ROOM_TYPE_LABELS[type]}
                            </th>
                          ))}
                          <th className="pb-3">RN totales</th>
                          <th className="pb-3">Ocupación canal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {CHANNEL_ORDER.map((channel) => {
                          const channelRow = month.channelResults.find((item) => item.channel === channel);

                          return (
                            <tr key={channel} className="border-t border-slate-200 dark:border-slate-800">
                              <td className="py-3 font-medium text-slate-900 dark:text-slate-50">{HOTEL_CHANNEL_LABELS[channel]}</td>
                              {ROOM_TYPE_ORDER.map((type) => {
                                const channelTypeRow = month.channelRoomTypeResults.find(
                                  (item) => item.channel === channel && item.type === type
                                );

                                return (
                                  <td key={type} className="py-3 text-slate-600 dark:text-slate-300">
                                    <div className="font-medium text-slate-900 dark:text-slate-50">
                                      {formatCompactNumber(channelTypeRow?.assignedRooms ?? 0)} hab
                                    </div>
                                    <div className="text-xs">
                                      {formatRoomNightCell(channelTypeRow?.occupiedRoomNights ?? 0)} RN · {formatPercent(channelTypeRow?.occupancyRate ?? 0)}
                                    </div>
                                  </td>
                                );
                              })}
                              <td className="py-3 text-slate-600 dark:text-slate-300">{formatRoomNightCell(channelRow?.occupiedRoomNights ?? 0)}</td>
                              <td className="py-3 text-slate-600 dark:text-slate-300">{formatPercent(channelRow?.occupancyRate ?? 0)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </TableCard>

                  <TableCard
                    title="Fase 3. Tarifario e ingreso por canal"
                    description="Aquí se cruza el tarifario de cada canal con la ocupación vendida. La grilla muestra qué tarifa se aplicó por tipología y cuánto dinero generó cada combinación."
                    helperTitle="Cómo usar esta fase"
                    helperContent={
                      <>
                        La celda junta precio e ingreso. Eso te deja detectar si un canal vende mucho con tarifa baja
                        o si una tipología premium está quedando mal distribuida entre canales.
                      </>
                    }
                  >
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="pb-3">Canal</th>
                          {ROOM_TYPE_ORDER.map((type) => (
                            <th key={type} className="pb-3">
                              {ROOM_TYPE_LABELS[type]}
                            </th>
                          ))}
                          <th className="pb-3">Gross total</th>
                          <th className="pb-3">Neto total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {CHANNEL_ORDER.map((channel) => {
                          const channelRow = month.channelResults.find((item) => item.channel === channel);

                          return (
                            <tr key={channel} className="border-t border-slate-200 dark:border-slate-800">
                              <td className="py-3 font-medium text-slate-900 dark:text-slate-50">{HOTEL_CHANNEL_LABELS[channel]}</td>
                              {ROOM_TYPE_ORDER.map((type) => {
                                const channelTypeRow = month.channelRoomTypeResults.find(
                                  (item) => item.channel === channel && item.type === type
                                );

                                return (
                                  <td key={type} className="py-3 text-slate-600 dark:text-slate-300">
                                    <div className="font-medium text-slate-900 dark:text-slate-50">
                                      {formatUsd(channelTypeRow?.rate ?? 0)}
                                    </div>
                                    <div className="text-xs">{formatUsd(channelTypeRow?.grossRevenue ?? 0)}</div>
                                  </td>
                                );
                              })}
                              <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(channelRow?.grossRevenue ?? 0)}</td>
                              <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(channelRow?.netRevenue ?? 0)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </TableCard>

                  <TableCard
                    title="Fase 4. Comisiones y rentabilidad de canales"
                    description="Esta es la tabla de control comercial. Resume cupo asignado, capacidad disponible, room nights vendidas, ingreso bruto, costo de comisión y retorno neto por canal."
                    helperTitle="Regla simple"
                    helperContent={
                      <>
                        Un canal sano no es solo el que vende más. Mira juntos cupo asignado, ocupación del canal,
                        gross, comisión y net ADR para decidir dónde conviene crecer y dónde conviene limitar cupos.
                      </>
                    }
                  >
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="pb-3">Canal</th>
                          <th className="pb-3">% mix</th>
                          <th className="pb-3">Habitaciones asignadas</th>
                          <th className="pb-3">RN disponibles</th>
                          <th className="pb-3">RN vendidas</th>
                          <th className="pb-3">Ocupación</th>
                          <th className="pb-3">Gross</th>
                          <th className="pb-3">Comisión</th>
                          <th className="pb-3">Neto</th>
                          <th className="pb-3">Net ADR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {month.channelResults.map((item) => (
                          <tr key={item.channel} className="border-t border-slate-200 dark:border-slate-800">
                            <td className="py-3 font-medium text-slate-900 dark:text-slate-50">
                              {HOTEL_CHANNEL_LABELS[item.channel]}
                            </td>
                            <td className="py-3 text-slate-600 dark:text-slate-300">{formatPercent(item.share)}</td>
                            <td className="py-3 text-slate-600 dark:text-slate-300">{formatCompactNumber(item.assignedRooms)}</td>
                            <td className="py-3 text-slate-600 dark:text-slate-300">{formatRoomNightCell(item.availableRoomNights)}</td>
                            <td className="py-3 text-slate-600 dark:text-slate-300">{formatRoomNightCell(item.occupiedRoomNights)}</td>
                            <td className="py-3 text-slate-600 dark:text-slate-300">{formatPercent(item.occupancyRate)}</td>
                            <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(item.grossRevenue)}</td>
                            <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(item.commissionCost)}</td>
                            <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(item.netRevenue)}</td>
                            <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(item.netAdr)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableCard>

                  <TableCard
                    title="Fase 5. Desayuno y consumo por huesped"
                    description="El Excel de referencia también separa el ingreso complementario. Aquí la app muestra cuánto ingresaría el hotel por desayuno con el precio actual y con el precio propuesto."
                    helperTitle="Qué responde esta fase"
                    helperContent={
                      <>
                        Sirve para mostrar si un ajuste pequeño en el ticket de desayuno genera un ingreso adicional
                        relevante sin depender solo de vender más habitaciones.
                      </>
                    }
                  >
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="pb-3">Indicador</th>
                          <th className="pb-3">Valor</th>
                          <th className="pb-3">Lectura</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-slate-200 dark:border-slate-800">
                          <td className="py-3 font-medium text-slate-900 dark:text-slate-50">Huéspedes estimados</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatCompactNumber(month.totalGuests)}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">
                            Se calcula con el factor promedio de {result.input.guestFactor} huéspedes por habitación ocupada.
                          </td>
                        </tr>
                        <tr className="border-t border-slate-200 dark:border-slate-800">
                          <td className="py-3 font-medium text-slate-900 dark:text-slate-50">Desayuno actual</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(result.input.breakfastPriceCurrent)}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">
                            Precio base con el que hoy se proyecta este consumo complementario.
                          </td>
                        </tr>
                        <tr className="border-t border-slate-200 dark:border-slate-800">
                          <td className="py-3 font-medium text-slate-900 dark:text-slate-50">Desayuno propuesto</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(result.input.breakfastPriceProposed)}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">
                            Nuevo precio planteado por gerencia para elevar el ingreso por huésped.
                          </td>
                        </tr>
                        <tr className="border-t border-slate-200 dark:border-slate-800">
                          <td className="py-3 font-medium text-slate-900 dark:text-slate-50">Ingreso con precio actual</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(month.breakfastRevenueCurrent)}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">
                            Ingreso estimado manteniendo la tarifa actual de desayuno.
                          </td>
                        </tr>
                        <tr className="border-t border-slate-200 dark:border-slate-800">
                          <td className="py-3 font-medium text-slate-900 dark:text-slate-50">Ingreso con precio nuevo</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(month.breakfastRevenueProposed)}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">
                            Ingreso estimado aplicando el ajuste tarifario propuesto.
                          </td>
                        </tr>
                        <tr className="border-t border-slate-200 dark:border-slate-800">
                          <td className="py-3 font-medium text-slate-900 dark:text-slate-50">Delta adicional</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(month.breakfastRevenueDelta)}</td>
                          <td className="py-3 text-slate-600 dark:text-slate-300">
                            Diferencia directa entre ambos escenarios de desayuno para este mes.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </TableCard>
                </div>
              </div>
            </details>
          ))}
        </div>
      ) : null}

      {result ? (
        <div className={activeTab === "strategy" ? "space-y-6" : "hidden print:block print:space-y-6"}>
          <Card>
            <SectionIntro
              title="Conclusion y plan de accion"
              description="Esta es la parte más ejecutiva. Resume qué haría una gerencia con este caso y qué decisiones conviene tomar."
            />
            <Highlight
              title="Objetivo del plan"
              text={result.research.strategicPlan.objective}
              tone="emerald"
            />
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <Highlight
                title="Posicionamiento propuesto"
                text={result.research.strategicPlan.positioning}
              />
              <Highlight
                title="Lectura final en simple"
                text={
                  result.summary.adrTargetMet
                    ? `El hotel podría cumplir la meta comercial principal, pero aun así debe controlar comisiones y defender mejor el canal más rentable.`
                    : `El hotel todavía no cumple la meta comercial principal. La prioridad es mejorar mezcla de canales, precios por habitación y propuesta de valor.`
                }
                tone={result.summary.adrTargetMet ? "emerald" : "amber"}
              />
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <SectionIntro
                title="Metas y acciones"
                description="Piensa esta parte como el plan de trabajo que le presentarías a la gerencia."
              />
              <HelperDetails title="Metas del plan" defaultOpen>
                <div className="grid gap-3">
                  {result.research.strategicPlan.goals.map((goal) => (
                    <div key={goal} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                      {goal}
                    </div>
                  ))}
                </div>
              </HelperDetails>
              <div className="mt-3" />
              <HelperDetails title="Acciones concretas">
                <div className="grid gap-3">
                  {result.research.strategicPlan.actions.map((action) => (
                    <div key={action} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950">
                      {action}
                    </div>
                  ))}
                </div>
              </HelperDetails>
            </Card>

            <Card>
              <SectionIntro
                title="Argumentos del plan"
                description="Aquí la app explica por qué ese plan tiene sentido desde el punto de vista comercial y tarifario."
              />
              <Highlight
                title="Razon comercial"
                text={result.research.strategicPlan.commercialRationale}
              />
              <div className="mt-4">
                <Highlight
                  title="Razon tarifaria"
                  text={result.research.strategicPlan.pricingRationale}
                />
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <SectionIntro
                title="Alertas importantes"
                description="No son errores: son focos de atención antes de tomar una decisión."
              />
              <div className="grid gap-3">
                {result.summary.warnings.length ? (
                  result.summary.warnings.map((warning, index) => (
                    <Highlight key={warning} title={`Alerta ${index + 1}`} text={warning} tone="amber" />
                  ))
                ) : (
                  <Highlight
                    title="Sin alertas criticas"
                    text="El caso no presenta inconsistencias relevantes en inventario, mix de canales, ADR objetivo, comisiones o desayuno. Aun así, revisa las recomendaciones antes de decidir."
                    tone="emerald"
                  />
                )}
              </div>
            </Card>

            <Card>
              <SectionIntro
                title="Recomendaciones"
                description="La app las genera a partir de los números y del mercado investigado. Cada recomendación incluye argumento, evidencia, mejora esperada y siguiente acción."
              />
              <div className="grid gap-4">
                {result.summary.recommendations.map((recommendation, index) => (
                  <RecommendationDecisionCard
                    key={`${recommendation.title}-${recommendation.text}`}
                    recommendation={recommendation}
                    index={index}
                  />
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <SectionIntro
              title="Como leer la decision final"
              description="Si alguien sin experiencia hotelera revisa este caso, debería fijarse en este orden."
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <GuideCard
                title="1. Mercado"
                description="Primero verificar si el destino realmente tiene demanda, atractivos y competencia comparable."
                icon={MapPinned}
              />
              <GuideCard
                title="2. Tarifa"
                description="Luego revisar si el ADR llega a la meta. Si no llega, el caso queda débil aunque venda bien."
                icon={Calculator}
              />
              <GuideCard
                title="3. Canales"
                description="Después mirar cuánto se pierde en comisiones y cuál canal deja mejor margen."
                icon={ReceiptText}
              />
              <GuideCard
                title="4. Plan"
                description="Finalmente revisar si el plan comercial corrige los riesgos detectados."
                icon={BookOpenText}
              />
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
