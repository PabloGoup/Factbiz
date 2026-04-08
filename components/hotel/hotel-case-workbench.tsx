"use client";

import type { ComponentType } from "react";
import { useEffect, useState } from "react";
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
  Sparkles,
  Target
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
  HOTEL_DESTINATION_OPTIONS,
  HOTEL_DESTINATION_PROFILES
} from "@/lib/hotel/data";
import { getStoredHotelCase, getStoredHotelResult, setStoredHotelCase, setStoredHotelResult } from "@/lib/storage";
import type {
  HotelCaseInput,
  HotelCaseResult,
  HotelSalesChannelId
} from "@/types";

type HotelWorkbenchTab = "case" | "research" | "forecast" | "strategy";

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

export function HotelCaseWorkbench() {
  const [hotelCase, setHotelCase] = useState<HotelCaseInput>(createDefaultHotelCase());
  const [result, setResult] = useState<HotelCaseResult | null>(null);
  const [activeTab, setActiveTab] = useState<HotelWorkbenchTab>("case");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHotelCase(getStoredHotelCase(createDefaultHotelCase()));
    setResult(getStoredHotelResult());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setStoredHotelCase(hotelCase);
  }, [hotelCase, hydrated]);

  const updateCase = <K extends keyof HotelCaseInput>(key: K, value: HotelCaseInput[K]) => {
    setHotelCase((current) => ({
      ...current,
      [key]: value
    }));
  };

  const updateRoomMix = (key: keyof HotelCaseInput["roomMix"], value: number) => {
    setHotelCase((current) => ({
      ...current,
      roomMix: {
        ...current.roomMix,
        [key]: value
      }
    }));
  };

  const updateRoomRate = (key: keyof HotelCaseInput["roomRates"], value: number) => {
    setHotelCase((current) => ({
      ...current,
      roomRates: {
        ...current.roomRates,
        [key]: value
      }
    }));
  };

  const updateChannel = (channel: HotelSalesChannelId, field: "share" | "commission", value: number) => {
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

  const applyDestination = (destinationId: HotelCaseInput["destination"]) => {
    const profile = HOTEL_DESTINATION_PROFILES[destinationId];

    setHotelCase((current) => ({
      ...current,
      destination: destinationId,
      region: profile.region,
      country: profile.country,
      roomRates: {
        ...profile.marketRateReference
      }
    }));
  };

  const totalRoomMix =
    hotelCase.roomMix.single + hotelCase.roomMix.double + hotelCase.roomMix.triple + hotelCase.roomMix.suite;
  const totalChannelShare =
    hotelCase.channels.tourOperators.share +
    hotelCase.channels.onlineAgencies.share +
    hotelCase.channels.direct.share +
    hotelCase.channels.corporate.share;

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
    { id: "case", label: "1. Armar Caso", subtitle: "Completa los datos base", icon: Hotel },
    { id: "research", label: "2. Entender Mercado", subtitle: "Destino, competencia y fuentes", icon: FileSearch },
    { id: "forecast", label: "3. Ver Numeros", subtitle: "Ocupacion, ADR y comisiones", icon: ReceiptText },
    { id: "strategy", label: "4. Tomar Decision", subtitle: "Plan, alertas y recomendaciones", icon: Target }
  ];

  const destinationProfile = HOTEL_DESTINATION_PROFILES[hotelCase.destination];
  const januaryPreviewRoomNights = hotelCase.totalRooms * 31 * (hotelCase.occupancyJanuary / 100);
  const februaryPreviewRoomNights = hotelCase.totalRooms * 28 * (hotelCase.occupancyFebruary / 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Modulo especializado
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
            Casos hoteleros
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Este espacio está pensado para que cualquier persona pueda entender un caso hotelero paso a paso.
            Primero completas el caso, luego la app investiga el mercado, calcula los números y finalmente te
            explica qué significan.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              const example = createDefaultHotelCase();
              setHotelCase(example);
              setResult(null);
              setError(null);
              setActiveTab("case");
            }}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Cargar ejemplo docente
          </Button>
          {result ? (
            <Button variant="secondary" onClick={() => downloadHotelResult(result)}>
              <Download className="mr-2 h-4 w-4" />
              Exportar JSON
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
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
              description="Gemini investiga destino, atractivos, competencia y tarifas de referencia."
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

      <Card className="mb-6 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const disabled = tab.id !== "case" && !result;

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

      {activeTab === "case" ? (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Card>
              <SectionIntro
                step="Paso 1"
                title="Configura el hotel y el destino"
                description="Aquí defines qué hotel quieres evaluar. Si no tienes claro algún dato, puedes partir con el ejemplo y luego ajustar."
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
                title="Define los canales de venta"
                description="Aquí decides cuánto venderá el hotel por tour operadores, agencias online, cliente directo y empresas."
              />
              <HelperDetails title="¿Por qué esto importa tanto?" defaultOpen>
                Dos hoteles pueden vender lo mismo, pero ganar distinto. La diferencia está en cuánto se paga en
                comisiones y qué canales dejan más dinero neto.
              </HelperDetails>
              <div className="mt-5 grid gap-4">
                {(Object.keys(DEFAULT_HOTEL_CHANNELS) as HotelSalesChannelId[]).map((channel) => (
                  <div
                    key={channel}
                    className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[1fr_180px_180px]"
                  >
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-slate-50">{HOTEL_CHANNEL_LABELS[channel]}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Participación esperada de ventas y porcentaje de comisión de este canal.
                      </p>
                    </div>
                    <FormField label="Participacion %" className="gap-1">
                      <Input
                        type="number"
                        value={hotelCase.channels[channel].share}
                        onChange={(event) => updateChannel(channel, "share", Number(event.target.value))}
                      />
                    </FormField>
                    <FormField label="Comision %" className="gap-1">
                      <Input
                        type="number"
                        value={hotelCase.channels[channel].commission}
                        onChange={(event) => updateChannel(channel, "commission", Number(event.target.value))}
                      />
                    </FormField>
                  </div>
                ))}
              </div>
              <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3">
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Panel simple de canales</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Esta tabla resume cuánto dependerá el hotel de cada canal y cuánta comisión pagará.
                  </p>
                </div>
                <table className="min-w-full text-left text-sm">
                  <thead className="text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="pb-3">Canal</th>
                      <th className="pb-3">Participación</th>
                      <th className="pb-3">Comisión</th>
                      <th className="pb-3">Lectura simple</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CHANNEL_ORDER.map((channel) => (
                      <tr key={channel} className="border-t border-slate-200 dark:border-slate-800">
                        <td className="py-3 font-medium text-slate-900 dark:text-slate-50">{HOTEL_CHANNEL_LABELS[channel]}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">{formatPercent(hotelCase.channels[channel].share)}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">{formatPercent(hotelCase.channels[channel].commission)}</td>
                        <td className="py-3 text-slate-600 dark:text-slate-300">
                          {channel === "direct"
                            ? "Canal clave para defender margen y fidelización."
                            : channel === "tourOperators"
                              ? "Aporta volumen, pero puede presionar la tarifa promedio."
                              : channel === "onlineAgencies"
                                ? "Entrega visibilidad, con costo comercial relevante."
                                : "Ayuda a estabilizar demanda en fechas corporativas o grupos."}
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
                  setResult(null);
                  setError(null);
                }}
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reiniciar
              </Button>
            </div>

            {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          </div>

          <div className="space-y-6">
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
      ) : null}

      {activeTab === "research" && result ? (
        <div className="space-y-6">
          <Card>
            <SectionIntro
              title="El mercado explicado en simple"
              description="Aquí la app transforma la investigación del destino en una lectura fácil. La idea es que entiendas si el lugar realmente ayuda o complica al hotel."
            />
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Sparkles className="h-3.5 w-3.5" />
              {result.research.mode === "gemini" ? "Investigacion con Gemini" : "Fallback local"}
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
                title="SEPTE sin tecnicismos"
                description="SEPTE sirve para ordenar lo que pasa alrededor del hotel: personas, economía, regulación, tecnología y entorno. Ahora cada factor se justifica con señales concretas y fuente visible."
              />
              <div className="grid gap-3">
                {result.research.septeFactors.map((factor, index) => (
                  <HelperDetails key={factor.id} title={`${index + 1}. ${factor.label}`} defaultOpen={index === 0}>
                    <p>{factor.analysis}</p>
                    <p className="mt-3">
                      <span className="font-semibold text-slate-950 dark:text-slate-50">¿Qué significa para el hotel?</span>{" "}
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
                            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{evidence.note}</p>
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

      {activeTab === "forecast" && result ? (
        <div className="space-y-6">
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
              open={index === 0}
              className="rounded-3xl border border-slate-200 bg-white/80 p-0 dark:border-slate-800 dark:bg-slate-950/70"
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
                    title="Fase 2. Distribucion de habitaciones por canal"
                    description="Luego la app reparte la ocupación del mes entre los cuatro canales de venta. Esta lectura te ayuda a ver cuánta dependencia existe por intermediario."
                    helperTitle="Qué representa cada número"
                    helperContent={
                      <>
                        Cada celda muestra room nights estimadas. No es una reserva exacta por día, sino una
                        distribución presupuestaria del mes para entender el peso de cada canal.
                      </>
                    }
                  >
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="pb-3">Tipo</th>
                          {CHANNEL_ORDER.map((channel) => (
                            <th key={channel} className="pb-3">
                              {HOTEL_CHANNEL_LABELS[channel]}
                            </th>
                          ))}
                          <th className="pb-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ROOM_TYPE_ORDER.map((type) => {
                          const roomRow = month.roomTypeResults.find((item) => item.type === type);
                          const soldRoomNights = roomRow?.soldRoomNights ?? 0;

                          return (
                            <tr key={type} className="border-t border-slate-200 dark:border-slate-800">
                              <td className="py-3 font-medium text-slate-900 dark:text-slate-50">{ROOM_TYPE_LABELS[type]}</td>
                              {CHANNEL_ORDER.map((channel) => (
                                <td key={channel} className="py-3 text-slate-600 dark:text-slate-300">
                                  {(soldRoomNights * (result.input.channels[channel].share / 100)).toFixed(1)}
                                </td>
                              ))}
                              <td className="py-3 text-slate-600 dark:text-slate-300">{soldRoomNights.toFixed(1)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </TableCard>

                  <TableCard
                    title="Fase 3. Ingreso por habitaciones"
                    description="Aquí se transforma la ocupación en dinero. La tabla muestra cuánto aporta cada tipo de habitación, distribuido por canal, para que puedas reconocer dónde está el volumen y dónde está el valor."
                    helperTitle="Cómo usar esta fase"
                    helperContent={
                      <>
                        Si el ingreso se concentra demasiado en canales con comisión alta, el hotel puede vender
                        mucho pero retener poco margen. Esta tabla ayuda a detectar ese desbalance.
                      </>
                    }
                  >
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="pb-3">Tipo</th>
                          {CHANNEL_ORDER.map((channel) => (
                            <th key={channel} className="pb-3">
                              {HOTEL_CHANNEL_LABELS[channel]}
                            </th>
                          ))}
                          <th className="pb-3">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ROOM_TYPE_ORDER.map((type) => {
                          const roomRow = month.roomTypeResults.find((item) => item.type === type);
                          const revenue = roomRow?.revenue ?? 0;

                          return (
                            <tr key={type} className="border-t border-slate-200 dark:border-slate-800">
                              <td className="py-3 font-medium text-slate-900 dark:text-slate-50">{ROOM_TYPE_LABELS[type]}</td>
                              {CHANNEL_ORDER.map((channel) => (
                                <td key={channel} className="py-3 text-slate-600 dark:text-slate-300">
                                  {formatUsd(revenue * (result.input.channels[channel].share / 100))}
                                </td>
                              ))}
                              <td className="py-3 text-slate-600 dark:text-slate-300">{formatUsd(revenue)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </TableCard>

                  <TableCard
                    title="Fase 4. Comisiones y rentabilidad de canales"
                    description="Esta es la tabla más importante para gerencia comercial. Permite ver qué canal vende, cuánto cuesta vender por ese canal y cuál deja mejor retorno neto."
                    helperTitle="Regla simple"
                    helperContent={
                      <>
                        Un canal puede ser fuerte en ocupación y aun así ser poco atractivo si su comisión castiga
                        demasiado el ingreso neto. Mira siempre gross, comisión y net ADR juntos.
                      </>
                    }
                  >
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="pb-3">Canal</th>
                          <th className="pb-3">% mix</th>
                          <th className="pb-3">RN</th>
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
                            <td className="py-3 text-slate-600 dark:text-slate-300">{item.occupiedRoomNights.toFixed(1)}</td>
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

      {activeTab === "strategy" && result ? (
        <div className="space-y-6">
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
                {result.summary.warnings.map((warning) => (
                  <Highlight key={warning} title="Atencion" text={warning} tone="amber" />
                ))}
              </div>
            </Card>

            <Card>
              <SectionIntro
                title="Recomendaciones automaticas"
                description="La app las genera a partir de los números y del mercado investigado."
              />
              <div className="grid gap-3">
                {result.summary.recommendations.map((recommendation) => (
                  <Highlight key={recommendation} title="Recomendacion" text={recommendation} tone="emerald" />
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
