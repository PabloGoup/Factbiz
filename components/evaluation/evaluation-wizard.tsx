"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Download, FileCheck2, RefreshCcw, Save, Sparkles } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ScoreBadge } from "@/components/ui/score-badge";
import { ScoreSlider } from "@/components/ui/score-slider";
import { Select } from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import { Textarea } from "@/components/ui/textarea";
import { demoProjectList, demoProjects } from "@/data/demoProjects";
import { buildEvaluationSnapshot } from "@/lib/evaluation";
import { DEFAULT_WEIGHTS, EMPTY_PROJECT, STEP_TITLES } from "@/lib/constants";
import { getStoredProject, getStoredWeights, setStoredEvaluation, setStoredProject, setStoredWeights } from "@/lib/storage";
import { formatMoney } from "@/lib/utils";
import type { BlockId, ProjectInput, ProjectWeights } from "@/types";

const projectSchema = z.object({
  projectName: z.string().min(3, "Ingresa un nombre más específico."),
  businessType: z.string().min(3, "Define el tipo de negocio."),
  sector: z.string().min(3, "Define el rubro o sector."),
  country: z.string().min(2, "Ingresa el país."),
  region: z.string().min(2, "Ingresa región, provincia o estado."),
  city: z.string().min(2, "Ingresa la ciudad o comuna."),
  description: z.string().min(20, "Resume el proyecto en al menos 20 caracteres."),
  targetAudience: z.string().min(10, "Describe el público objetivo."),
  priceRange: z.enum(["económico", "medio", "premium"]),
  marketSize: z.number().min(1).max(10),
  expectedDemand: z.number().min(1).max(10),
  segmentationClarity: z.number().min(1).max(10),
  customerFit: z.number().min(1).max(10),
  footTraffic: z.number().min(1).max(10),
  tourismLevel: z.number().min(1).max(10),
  digitalizationLevel: z.number().min(1).max(10),
  consumerBehavior: z.number().min(1).max(10),
  competitorCount: z.number().min(0).max(25),
  differentiationLevel: z.number().min(1).max(10),
  customerPower: z.number().min(1).max(10),
  supplierDependency: z.number().min(1).max(10),
  substituteThreat: z.number().min(1).max(10),
  newEntrantsThreat: z.number().min(1).max(10),
  initialInvestment: z.number().min(1000, "Usa un valor realista."),
  fixedCosts: z.number().min(100),
  variableCostRate: z.number().min(1).max(90),
  averageTicket: z.number().min(1),
  monthlySalesProjection: z.number().min(100),
  expectedMarginPercent: z.number().min(1).max(80),
  operationalComplexity: z.number().min(1).max(10),
  personnelRequired: z.number().min(1).max(40),
  logisticsComplexity: z.number().min(1).max(10),
  legalDifficulty: z.number().min(1).max(10),
  permitComplexity: z.number().min(1).max(10),
  entryBarriers: z.number().min(1).max(10),
  sustainabilityReadiness: z.number().min(1).max(10),
  knownStrengths: z.string(),
  knownRisks: z.string()
});

const stepFields: Record<number, Array<keyof ProjectInput>> = {
  1: ["projectName", "businessType", "sector", "description", "targetAudience"],
  2: ["country", "region", "city", "footTraffic", "tourismLevel", "digitalizationLevel", "consumerBehavior"],
  3: ["priceRange", "marketSize", "expectedDemand", "segmentationClarity", "customerFit"],
  4: ["competitorCount", "differentiationLevel", "customerPower", "supplierDependency", "substituteThreat", "newEntrantsThreat"],
  5: ["initialInvestment", "fixedCosts", "variableCostRate", "averageTicket", "monthlySalesProjection", "expectedMarginPercent"],
  6: ["operationalComplexity", "personnelRequired", "logisticsComplexity", "legalDifficulty", "permitComplexity", "entryBarriers", "sustainabilityReadiness"],
  7: ["knownStrengths", "knownRisks"]
};

const weightLabels: Record<BlockId, string> = {
  septe: "SEPTE",
  porter: "Porter",
  foda: "FODA",
  mercado: "Mercado",
  finanzas: "Finanzas",
  operacionLegalidad: "Operación y legalidad"
};

export function EvaluationWizard({ demoId }: { demoId?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [weights, setWeights] = useState<ProjectWeights>(DEFAULT_WEIGHTS);
  const [hydrated, setHydrated] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);
  const lastPersistedRef = useRef<string>("");
  const appliedDemoIdRef = useRef<string | null>(null);

  const {
    register,
    control,
    watch,
    trigger,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: EMPTY_PROJECT
  });

  const values = useWatch({
    control,
    defaultValue: EMPTY_PROJECT
  }) as ProjectInput;
  const serializedValues = useMemo(() => JSON.stringify(values), [values]);
  const previewSnapshot = useMemo(() => buildEvaluationSnapshot(values, weights), [values, weights]);

  useEffect(() => {
    const storedProject = getStoredProject(EMPTY_PROJECT);
    const storedWeights = getStoredWeights(DEFAULT_WEIGHTS);

    reset(storedProject);
    setWeights(storedWeights);
    setHydrated(true);
  }, [reset]);

  useEffect(() => {
    if (!hydrated) return;

    if (!demoId || !demoProjects[demoId]) return;
    if (appliedDemoIdRef.current === demoId) return;

    reset(demoProjects[demoId]);
    setStep(1);
    appliedDemoIdRef.current = demoId;
  }, [demoId, hydrated, reset]);

  useEffect(() => {
    if (!hydrated) return;
    const payload = JSON.stringify({
      values,
      weights
    });
    if (payload === lastPersistedRef.current) return;

    setStoredProject(values);
    setStoredWeights(weights);
    lastPersistedRef.current = payload;
    setLastAutoSave(new Date().toISOString());
  }, [hydrated, serializedValues, values, weights]);

  const nextStep = async () => {
    const valid = await trigger(stepFields[step]);
    if (!valid) return;
    setStep((current) => Math.min(current + 1, STEP_TITLES.length));
  };

  const previousStep = () => setStep((current) => Math.max(current - 1, 1));

  const loadDemo = (demoId: string) => {
    const demo = demoProjects[demoId];
    reset(demo);
    setStep(1);
  };

  const onSubmit = async (input: ProjectInput) => {
    const snapshot = buildEvaluationSnapshot(input, weights);

    setStoredProject(input);
    setStoredWeights(weights);
    setStoredEvaluation(snapshot);
    startTransition(() => router.push("/resultado"));
  };

  const updateWeight = (key: BlockId, value: number) => {
    setWeights((current) => ({
      ...current,
      [key]: value
    }));
  };

  const totalWeight = Object.values(weights).reduce((sum, current) => sum + current, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Wizard de evaluación
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
            Construye el caso y valida la factibilidad del proyecto
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            El formulario guarda automáticamente el avance en el navegador. Puedes cargar un demo, editar pesos
            y revisar el score preliminar antes de generar el dashboard final.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/">
            <Button variant="secondary">Volver al inicio</Button>
          </Link>
          <Button variant="secondary" onClick={() => reset(EMPTY_PROJECT)}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Limpiar
          </Button>
        </div>
      </div>

      <Stepper currentStep={step} />

      <div className="section-grid mt-8">
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Paso {step} de {STEP_TITLES.length}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{STEP_TITLES[step - 1]}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Save className="h-4 w-4" />
                {lastAutoSave ? `Guardado automático: ${new Date(lastAutoSave).toLocaleTimeString("es-419")}` : "Sin guardar"}
              </div>
            </div>

            {step === 1 ? (
              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Nombre del proyecto" error={errors.projectName?.message}>
                  <Input placeholder="Ej. Factibiz Café Centro" {...register("projectName")} />
                </FormField>
                <FormField label="Tipo de negocio" error={errors.businessType?.message}>
                  <Input placeholder="Ej. Cafetería, hotel boutique, retail especializado" {...register("businessType")} />
                </FormField>
                <FormField label="Rubro" error={errors.sector?.message}>
                  <Input placeholder="Ej. Gastronomía, turismo, servicios" {...register("sector")} />
                </FormField>
                <FormField label="Público objetivo" error={errors.targetAudience?.message} hint="Describe a quién quieres venderle.">
                  <Input placeholder="Ej. Oficinistas, turistas premium, familias de ingresos medios" {...register("targetAudience")} />
                </FormField>
                <FormField label="Descripción del proyecto" className="md:col-span-2" error={errors.description?.message}>
                  <Textarea placeholder="Resume el modelo de negocio, propuesta de valor y canal principal de ventas." {...register("description")} />
                </FormField>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="País" error={errors.country?.message}>
                  <Input placeholder="Chile, Argentina, Colombia..." {...register("country")} />
                </FormField>
                <FormField label="Región / provincia / estado" error={errors.region?.message}>
                  <Input placeholder="Región Metropolitana, Buenos Aires..." {...register("region")} />
                </FormField>
                <FormField label="Ciudad / comuna" error={errors.city?.message}>
                  <Input placeholder="Santiago, Bogotá, Lima..." {...register("city")} />
                </FormField>
                <FormField label="Nivel de digitalización del entorno" hint="1 bajo · 10 alto">
                  <Controller
                    control={control}
                    name="digitalizationLevel"
                    render={({ field }) => <ScoreSlider value={field.value} onChange={field.onChange} />}
                  />
                </FormField>
                <FormField label="Flujo estimado de público" hint="1 bajo · 10 alto">
                  <Controller
                    control={control}
                    name="footTraffic"
                    render={({ field }) => <ScoreSlider value={field.value} onChange={field.onChange} />}
                  />
                </FormField>
                <FormField label="Nivel de turismo" hint="1 bajo · 10 alto">
                  <Controller
                    control={control}
                    name="tourismLevel"
                    render={({ field }) => <ScoreSlider value={field.value} onChange={field.onChange} />}
                  />
                </FormField>
                <FormField label="Comportamiento del consumidor" hint="1 poco favorable · 10 muy favorable" className="md:col-span-2">
                  <Controller
                    control={control}
                    name="consumerBehavior"
                    render={({ field }) => <ScoreSlider value={field.value} onChange={field.onChange} />}
                  />
                </FormField>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Rango de precios">
                  <Select {...register("priceRange")}>
                    <option value="económico">Económico</option>
                    <option value="medio">Medio</option>
                    <option value="premium">Premium</option>
                  </Select>
                </FormField>
                <FormField label="Tamaño del mercado" hint="1 pequeño · 10 amplio">
                  <Controller control={control} name="marketSize" render={({ field }) => <ScoreSlider value={field.value} onChange={field.onChange} />} />
                </FormField>
                <FormField label="Demanda esperada" hint="1 baja · 10 alta">
                  <Controller control={control} name="expectedDemand" render={({ field }) => <ScoreSlider value={field.value} onChange={field.onChange} />} />
                </FormField>
                <FormField label="Claridad de segmentación" hint="1 difusa · 10 precisa">
                  <Controller
                    control={control}
                    name="segmentationClarity"
                    render={({ field }) => <ScoreSlider value={field.value} onChange={field.onChange} />}
                  />
                </FormField>
                <FormField label="Encaje con cliente objetivo" hint="1 débil · 10 sólido" className="md:col-span-2">
                  <Controller control={control} name="customerFit" render={({ field }) => <ScoreSlider value={field.value} onChange={field.onChange} />} />
                </FormField>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Cantidad de competidores" error={errors.competitorCount?.message}>
                  <Input type="number" min={0} max={25} {...register("competitorCount", { valueAsNumber: true })} />
                </FormField>
                <FormField label="Nivel de diferenciación" hint="1 bajo · 10 alto">
                  <Controller
                    control={control}
                    name="differentiationLevel"
                    render={({ field }) => <ScoreSlider value={field.value} onChange={field.onChange} />}
                  />
                </FormField>
                <FormField label="Poder de clientes" hint="1 bajo · 10 alto">
                  <Controller control={control} name="customerPower" render={({ field }) => <ScoreSlider value={field.value} onChange={field.onChange} />} />
                </FormField>
                <FormField label="Dependencia de proveedores" hint="1 baja · 10 alta">
                  <Controller
                    control={control}
                    name="supplierDependency"
                    render={({ field }) => <ScoreSlider value={field.value} onChange={field.onChange} />}
                  />
                </FormField>
                <FormField label="Amenaza de sustitutos" hint="1 baja · 10 alta">
                  <Controller
                    control={control}
                    name="substituteThreat"
                    render={({ field }) => <ScoreSlider value={field.value} onChange={field.onChange} />}
                  />
                </FormField>
                <FormField label="Amenaza de nuevos entrantes" hint="1 baja · 10 alta">
                  <Controller
                    control={control}
                    name="newEntrantsThreat"
                    render={({ field }) => <ScoreSlider value={field.value} onChange={field.onChange} />}
                  />
                </FormField>
              </div>
            ) : null}

            {step === 5 ? (
              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Inversión inicial estimada" error={errors.initialInvestment?.message}>
                  <Input type="number" min={1000} step={1000} {...register("initialInvestment", { valueAsNumber: true })} />
                </FormField>
                <FormField label="Costos fijos mensuales" error={errors.fixedCosts?.message}>
                  <Input type="number" min={100} step={100} {...register("fixedCosts", { valueAsNumber: true })} />
                </FormField>
                <FormField label="Costos variables (%)" error={errors.variableCostRate?.message}>
                  <Input type="number" min={1} max={90} {...register("variableCostRate", { valueAsNumber: true })} />
                </FormField>
                <FormField label="Ticket promedio" error={errors.averageTicket?.message}>
                  <Input type="number" min={1} step={1} {...register("averageTicket", { valueAsNumber: true })} />
                </FormField>
                <FormField label="Proyección de ventas mensuales" error={errors.monthlySalesProjection?.message}>
                  <Input type="number" min={100} step={100} {...register("monthlySalesProjection", { valueAsNumber: true })} />
                </FormField>
                <FormField label="Margen esperado (%)" error={errors.expectedMarginPercent?.message}>
                  <Input type="number" min={1} max={80} {...register("expectedMarginPercent", { valueAsNumber: true })} />
                </FormField>
              </div>
            ) : null}

            {step === 6 ? (
              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Complejidad operativa" hint="1 baja · 10 alta">
                  <Controller
                    control={control}
                    name="operationalComplexity"
                    render={({ field }) => <ScoreSlider value={field.value} onChange={field.onChange} />}
                  />
                </FormField>
                <FormField label="Personal requerido" error={errors.personnelRequired?.message}>
                  <Input type="number" min={1} max={40} {...register("personnelRequired", { valueAsNumber: true })} />
                </FormField>
                <FormField label="Complejidad logística" hint="1 baja · 10 alta">
                  <Controller
                    control={control}
                    name="logisticsComplexity"
                    render={({ field }) => <ScoreSlider value={field.value} onChange={field.onChange} />}
                  />
                </FormField>
                <FormField label="Dificultad legal" hint="1 baja · 10 alta">
                  <Controller
                    control={control}
                    name="legalDifficulty"
                    render={({ field }) => <ScoreSlider value={field.value} onChange={field.onChange} />}
                  />
                </FormField>
                <FormField label="Complejidad de permisos" hint="1 baja · 10 alta">
                  <Controller
                    control={control}
                    name="permitComplexity"
                    render={({ field }) => <ScoreSlider value={field.value} onChange={field.onChange} />}
                  />
                </FormField>
                <FormField label="Barreras de entrada" hint="1 bajas · 10 altas">
                  <Controller control={control} name="entryBarriers" render={({ field }) => <ScoreSlider value={field.value} onChange={field.onChange} />} />
                </FormField>
                <FormField label="Preparación en sostenibilidad" hint="1 baja · 10 alta" className="md:col-span-2">
                  <Controller
                    control={control}
                    name="sustainabilityReadiness"
                    render={({ field }) => <ScoreSlider value={field.value} onChange={field.onChange} />}
                  />
                </FormField>
              </div>
            ) : null}

            {step === 7 ? (
              <div className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="Fortalezas conocidas" hint="Opcional">
                    <Textarea placeholder="Ej. buena ubicación, ticket controlado, propuesta diferenciada..." {...register("knownStrengths")} />
                  </FormField>
                  <FormField label="Riesgos conocidos" hint="Opcional">
                    <Textarea placeholder="Ej. permisos lentos, dependencia de turismo, proveedores críticos..." {...register("knownRisks")} />
                  </FormField>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Pesos editables
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">
                        Ajusta la sensibilidad del modelo
                      </h3>
                    </div>
                    <div className={`rounded-full px-3 py-2 text-sm font-semibold ${totalWeight === 100 ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-100" : "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-100"}`}>
                      Total pesos: {totalWeight}
                    </div>
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {(Object.keys(weights) as BlockId[]).map((key) => (
                      <FormField key={key} label={weightLabels[key]} hint="0 a 40">
                        <Input
                          type="number"
                          min={0}
                          max={40}
                          value={weights[key]}
                          onChange={(event) => updateWeight(key, Number(event.target.value))}
                        />
                      </FormField>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    El motor usa funciones puras. Si el total no suma 100, el score seguirá calculándose según esos pesos.
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Vista previa
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">Resultado preliminar</h3>
                    </div>
                    <ScoreBadge
                      score={previewSnapshot.scoreBreakdown.finalScore}
                      classification={previewSnapshot.scoreBreakdown.classification}
                    />
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {previewSnapshot.insights.executiveSummary}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 dark:border-slate-800">
              <div className="flex flex-wrap gap-3">
                {step > 1 ? (
                  <Button variant="secondary" onClick={previousStep}>
                    Anterior
                  </Button>
                ) : null}
                {step < STEP_TITLES.length ? (
                  <Button onClick={nextStep}>Continuar</Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    <FileCheck2 className="mr-2 h-4 w-4" />
                    Generar dashboard
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {demoProjectList.map(({ id, project }) => (
                  <Button key={id} variant="ghost" onClick={() => loadDemo(id)} className="text-xs">
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Demo: {project.projectName}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </form>

        <div className="space-y-6">
          <Card>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Score preliminar
            </p>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-serif text-5xl font-semibold text-slate-950 dark:text-slate-50">
                  {previewSnapshot.scoreBreakdown.finalScore.toFixed(1)}
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Actualizado con los datos ingresados.</p>
              </div>
              <ScoreBadge
                score={previewSnapshot.scoreBreakdown.finalScore}
                classification={previewSnapshot.scoreBreakdown.classification}
              />
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {previewSnapshot.scoreBreakdown.interpretation}
            </p>
          </Card>

          <Card>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Contexto automático por ubicación
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">
              {values.city || "Ciudad"} · {values.country || "País"}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{previewSnapshot.context.narrative}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { label: "Turismo", value: previewSnapshot.context.tourismLevel },
                { label: "Flujo comercial", value: previewSnapshot.context.commercialFlow },
                { label: "Presión competitiva", value: previewSnapshot.context.competitivePressure },
                { label: "Estabilidad relativa", value: previewSnapshot.context.economicStability },
                { label: "Sensibilidad al precio", value: previewSnapshot.context.priceSensitivity },
                { label: "Facilidad regulatoria", value: previewSnapshot.context.regulatoryEase }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{item.label}</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-slate-50">{item.value.toFixed(1)}/10</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-50">
              <Sparkles className="h-4 w-4" />
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Resumen ejecutivo
              </p>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {previewSnapshot.insights.executiveSummary}
            </p>
            <div className="mt-5 grid gap-3">
              {previewSnapshot.scoreBreakdown.blocks.slice(0, 3).map((block) => (
                <div key={block.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-slate-900 dark:text-slate-50">{block.label}</p>
                    <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{block.score.toFixed(1)}/10</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{block.summary}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Referencias rápidas
            </p>
            <div className="mt-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="font-medium text-slate-900 dark:text-slate-50">Ventas proyectadas</p>
                <p className="mt-2">{formatMoney(values.monthlySalesProjection || 0, values.country || "Chile")} por mes</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="font-medium text-slate-900 dark:text-slate-50">Inversión inicial</p>
                <p className="mt-2">{formatMoney(values.initialInvestment || 0, values.country || "Chile")}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
