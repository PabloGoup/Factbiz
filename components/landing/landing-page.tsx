"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Building2,
  FileOutput,
  Gauge,
  MapPinned,
  Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { demoProjectList, demoProjects } from "@/data/demoProjects";
import { buildEvaluationSnapshot } from "@/lib/evaluation";
import { DEFAULT_WEIGHTS, EMPTY_PROJECT } from "@/lib/constants";
import { setStoredEvaluation, setStoredProject, setStoredWeights } from "@/lib/storage";
import { formatMoney } from "@/lib/utils";

const benefits = [
  {
    title: "Scoring ejecutivo real",
    description: "Integra SEPTE, Porter, FODA, mercado, finanzas y operación con pesos configurables.",
    icon: Gauge
  },
  {
    title: "Contexto por ubicación",
    description: "Enriquece el análisis con variables mock inteligentes según ciudad, región y país.",
    icon: MapPinned
  },
  {
    title: "Dashboard para presentar",
    description: "Entrega gráficos, hallazgos, recomendaciones y un informe listo para imprimir o exportar.",
    icon: BarChart3
  }
];

export function LandingPage() {
  const router = useRouter();

  const loadDefaultDemo = () => {
    const demo = demoProjects.domino_buenos_aires;
    const snapshot = buildEvaluationSnapshot(demo, DEFAULT_WEIGHTS);

    setStoredProject(demo);
    setStoredWeights(DEFAULT_WEIGHTS);
    setStoredEvaluation(snapshot);
    router.push("/resultado");
  };

  const startBlank = () => {
    setStoredProject(EMPTY_PROJECT);
    setStoredWeights(DEFAULT_WEIGHTS);
    router.push("/evaluacion");
  };

  return (
    <div className="pb-20">
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="glass-panel overflow-hidden bg-hero p-8 md:p-12">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-300">
                <Sparkles className="h-4 w-4" />
                Prototipo académico listo para demo
              </div>
              <h1 className="mt-6 max-w-3xl font-serif text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
                Evalúa la factibilidad de un proyecto de negocio con una lógica formal, visual y defendible.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Factibiz transforma datos del proyecto, contexto de ubicación y variables estratégicas en un
                score final de 0.0 a 10.0, con dashboard ejecutivo, recomendaciones y reporte descargable.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button onClick={startBlank} className="gap-2">
                  Comenzar evaluación
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="secondary" onClick={loadDefaultDemo}>
                  Cargar demo
                </Button>
                <Link href="/informe" className="inline-flex">
                  <Button variant="ghost" className="gap-2">
                    <FileOutput className="h-4 w-4" />
                    Ver formato de informe
                  </Button>
                </Link>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Bloques evaluados", value: "6" },
                  { label: "Subdimensiones", value: "36+" },
                  { label: "Salida ejecutiva", value: "PDF / JSON" }
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                    <p className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{item.value}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <Card className="space-y-5 bg-white/88 dark:bg-slate-950/80">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Vista conceptual
                  </p>
                  <h2 className="mt-2 font-serif text-3xl font-semibold text-slate-950 dark:text-slate-50">
                    Matriz de factibilidad
                  </h2>
                </div>
                <div className="rounded-2xl bg-slate-900 p-3 text-white dark:bg-slate-100 dark:text-slate-950">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { name: "SEPTE", value: "25%" },
                  { name: "Porter", value: "20%" },
                  { name: "Mercado", value: "20%" },
                  { name: "Finanzas", value: "15%" },
                  { name: "FODA", value: "10%" },
                  { name: "Operación", value: "10%" }
                ].map((item) => (
                  <div key={item.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{item.name}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Clasificación final</p>
                <div className="mt-3 grid gap-3 text-sm font-medium md:grid-cols-3">
                  <div className="rounded-xl bg-red-50 p-3 text-red-900 dark:bg-red-950/50 dark:text-red-100">0.0 - 3.9 No factible</div>
                  <div className="rounded-xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
                    4.0 - 6.9 Factible con riesgos
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
                    7.0 - 10.0 Factible
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <Card key={benefit.title}>
                <div className="inline-flex rounded-2xl bg-slate-100 p-3 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-950 dark:text-slate-50">{benefit.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{benefit.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Demos incluidas
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-slate-950 dark:text-slate-50">
              Casos listos para mostrar en presentación
            </h2>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {demoProjectList.map(({ id, project }) => (
            <Card key={id} className="flex h-full flex-col justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {project.sector}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-50">{project.projectName}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{project.description}</p>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Ubicación</p>
                  <p className="mt-2 font-medium text-slate-950 dark:text-slate-50">{project.city}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Inversión</p>
                  <p className="mt-2 font-medium text-slate-950 dark:text-slate-50">
                    {formatMoney(project.initialInvestment, project.country)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Posicionamiento</p>
                  <p className="mt-2 font-medium capitalize text-slate-950 dark:text-slate-50">{project.priceRange}</p>
                </div>
              </div>
              <div className="mt-6">
                <Link href={`/evaluacion?demo=${id}`}>
                  <Button variant="secondary" className="w-full">
                    Cargar este caso en el formulario
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
