import type { EvaluationSnapshot, InsightReport, LocationContext, ProjectInput, ScoreBreakdown } from "@/types";
import { BLOCK_LABELS } from "@/lib/constants";

function topBlocks(scoreBreakdown: ScoreBreakdown) {
  return [...scoreBreakdown.blocks].sort((left, right) => right.score - left.score);
}

function buildExecutiveSummary(
  input: ProjectInput,
  context: LocationContext,
  scoreBreakdown: ScoreBreakdown
) {
  const [bestBlock] = topBlocks(scoreBreakdown);
  return `${input.projectName} obtiene un ${scoreBreakdown.finalScore.toFixed(
    1
  )}/10 y se clasifica como "${scoreBreakdown.classification}". El caso muestra mejor desempeño en ${
    bestBlock.label
  }, lo que sugiere que la propuesta tiene una narrativa estratégica defendible. En ${input.city}, ${context.narrative.toLowerCase()} La recomendación académica es avanzar con un piloto controlado, validando supuestos comerciales y operativos antes de escalar capital o capacidad.`;
}

function buildScoreExplanation(scoreBreakdown: ScoreBreakdown) {
  const sorted = topBlocks(scoreBreakdown);
  const strong = sorted.slice(0, 2).map((block) => block.label.toLowerCase());
  const weak = sorted.slice(-2).map((block) => block.label.toLowerCase());

  return `El puntaje se explica por fortalezas relativas en ${strong.join(
    " y "
  )}, mientras que las principales restricciones aparecen en ${weak.join(
    " y "
  )}. La lectura integrada indica que el proyecto no depende solo de una buena idea, sino de cómo resuelve estructura competitiva, control operativo y coherencia financiera.`;
}

function severityPrefix(severity: "alta" | "media" | "baja") {
  if (severity === "alta") return "Crítico";
  if (severity === "media") return "Prioritario";
  return "Secundario";
}

export function generateMockAiInsights(
  input: ProjectInput,
  context: LocationContext,
  scoreBreakdown: ScoreBreakdown
): InsightReport {
  const orderedBlocks = topBlocks(scoreBreakdown);
  const mainFindings = orderedBlocks.slice(0, 3).map((block) => {
    if (block.score >= 7) {
      return `${block.label} aporta una base favorable: ${block.summary}`;
    }

    return `${block.label} todavía no consolida la tesis del proyecto: ${block.summary}`;
  });

  const opportunities = [
    ...scoreBreakdown.opportunities,
    context.marketAttractiveness >= 7
      ? "El mercado local muestra señales suficientes para justificar una prueba con alcance bien definido."
      : "El mercado exige una entrada más selectiva, pero aún deja espacio para un nicho bien enfocado.",
    input.differentiationLevel >= 7
      ? "Existe espacio para capturar valor si la diferenciación se traduce en experiencia, marca y ejecución consistente."
      : "La oportunidad puede fortalecerse si la propuesta traduce mejor su diferenciación en beneficios tangibles para el cliente."
  ].slice(0, 5);

  const recommendations = [
    scoreBreakdown.finalScore >= 7
      ? "Diseñar un piloto de apertura con indicadores semanales de ventas, ticket, margen y repetición, evitando escalar antes de confirmar la unidad económica."
      : "Reducir el alcance inicial del proyecto y validar la propuesta con una versión piloto antes de comprometer una expansión completa.",
    orderedBlocks.find((block) => block.id === "finanzas")?.score ?? 0 < 6.5
      ? "Recalibrar inversión, costos fijos y metas de ventas para que el punto de equilibrio sea alcanzable bajo un escenario conservador."
      : "Mantener una disciplina financiera explícita, separando inversión estructural de gastos de lanzamiento y adquisición de clientes.",
    orderedBlocks.find((block) => block.id === "porter")?.score ?? 0 < 6.5
      ? "Fortalecer la propuesta competitiva con atributos difíciles de copiar, acuerdos con proveedores o una narrativa de marca más nítida."
      : "Aprovechar la posición competitiva actual para cerrar alianzas, asegurar proveedores y consolidar barreras tempranas.",
    "Preparar un mapa de riesgos con responsables, mitigaciones y umbrales de decisión para permisos, abastecimiento, demanda y ejecución operativa."
  ];

  const principalRisks = scoreBreakdown.risks.map((risk) => ({
    ...risk,
    detail: `${severityPrefix(risk.severity)}. ${risk.detail}`
  }));

  return {
    executiveSummary: buildExecutiveSummary(input, context, scoreBreakdown),
    scoreExplanation: buildScoreExplanation(scoreBreakdown),
    mainFindings,
    opportunities,
    recommendations,
    principalRisks,
    conclusion:
      scoreBreakdown.classification === "Factible"
        ? "La tesis del proyecto es positiva, siempre que la puesta en marcha mantenga control de ejecución y validación continua."
        : scoreBreakdown.classification === "Factible con riesgos"
          ? "El proyecto puede avanzar en formato piloto, condicionado a resolver fricciones clave antes de una expansión mayor."
          : "La recomendación es no avanzar con la configuración actual sin rediseñar la propuesta, el alcance o la estructura económica.",
    methodologyNote:
      "Este resultado fue generado por la capa local de simulación. Si se configura OpenAI, la app puede reemplazar esta salida por un análisis redactado por modelo real.",
    source: "mock",
    provider: "local-rules",
    generatedAt: new Date().toISOString()
  };
}

export function buildAiInsightPrompt(
  input: ProjectInput,
  context: LocationContext,
  scoreBreakdown: ScoreBreakdown
) {
  return JSON.stringify(
    {
      proyecto: {
        nombre: input.projectName,
        tipo: input.businessType,
        rubro: input.sector,
        ubicacion: `${input.city}, ${input.region}, ${input.country}`,
        descripcion: input.description,
        publicoObjetivo: input.targetAudience,
        rangoPrecio: input.priceRange
      },
      contexto: context,
      resultado: {
        finalScore: scoreBreakdown.finalScore,
        classification: scoreBreakdown.classification,
        interpretation: scoreBreakdown.interpretation,
        strengths: scoreBreakdown.strengths,
        opportunities: scoreBreakdown.opportunities,
        risks: scoreBreakdown.risks,
        blocks: scoreBreakdown.blocks.map((block) => ({
          id: block.id,
          label: block.label,
          score: block.score,
          summary: block.summary,
          positives: block.positives,
          risks: block.risks,
          factors: block.factors
        }))
      }
    },
    null,
    2
  );
}

export function serializeEvaluationForClipboard(snapshot: EvaluationSnapshot) {
  const best = [...snapshot.scoreBreakdown.blocks].sort((left, right) => right.score - left.score)[0];

  return [
    `Proyecto: ${snapshot.input.projectName}`,
    `Score final: ${snapshot.scoreBreakdown.finalScore.toFixed(1)} / 10`,
    `Clasificación: ${snapshot.scoreBreakdown.classification}`,
    `Bloque más sólido: ${best.label} (${best.score.toFixed(1)})`,
    `Resumen: ${snapshot.insights.executiveSummary}`,
    `Conclusión: ${snapshot.insights.conclusion}`,
    `Riesgos clave: ${snapshot.insights.principalRisks.map((risk) => `${risk.title} (${BLOCK_LABELS[risk.relatedBlock]})`).join(", ")}`
  ].join("\n");
}
