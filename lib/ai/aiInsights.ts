import type {
  BlockId,
  BlockScore,
  EvaluationSnapshot,
  InsightReport,
  LocationContext,
  ProjectInput,
  ReportBlockNarrative,
  ReportNarrative,
  ScoreBreakdown
} from "@/types";
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

function buildReportMethodology(scoreBreakdown: ScoreBreakdown) {
  const weightSummary = scoreBreakdown.blocks
    .map((block) => `${block.label} (${block.weight}%)`)
    .join(", ");

  return `La metodología combina un motor multicriterio con ponderaciones configurables para ${weightSummary}. El resultado integra datos declarados del proyecto, contexto territorial por ubicación y una interpretación ejecutiva que prioriza consistencia estratégica, capacidad de ejecución y sostenibilidad financiera.`;
}

function buildContextSummary(input: ProjectInput, context: LocationContext) {
  return `Para ${input.projectName}, la lectura territorial en ${context.city}, ${context.region}, ${context.country} combina turismo ${context.tourismLevel.toFixed(
    1
  )}/10, flujo comercial ${context.commercialFlow.toFixed(1)}/10, presión competitiva ${context.competitivePressure.toFixed(
    1
  )}/10, estabilidad económica ${context.economicStability.toFixed(1)}/10, sensibilidad al precio ${context.priceSensitivity.toFixed(
    1
  )}/10, digitalización ${context.digitalizationLevel.toFixed(1)}/10 y atractivo del mercado ${context.marketAttractiveness.toFixed(
    1
  )}/10. ${context.narrative}`;
}

function buildScoreSummary(scoreBreakdown: ScoreBreakdown) {
  const sorted = topBlocks(scoreBreakdown);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  return `El score final de ${scoreBreakdown.finalScore.toFixed(1)}/10 ubica el caso como "${
    scoreBreakdown.classification
  }". La lectura ejecutiva se sostiene en ${strongest.label}, mientras que el principal cuello de botella aparece en ${weakest.label}. La recomendación no depende de un solo indicador: se basa en la coherencia entre mercado, finanzas, competencia y viabilidad operacional.`;
}

function buildChartsSummary(input: ProjectInput, scoreBreakdown: ScoreBreakdown) {
  const strongest = [...scoreBreakdown.blocks].sort((left, right) => right.score - left.score)[0];
  const weakest = [...scoreBreakdown.blocks].sort((left, right) => left.score - right.score)[0];
  const lastProjection = scoreBreakdown.salesProjection[scoreBreakdown.salesProjection.length - 1];

  return `Los gráficos clave muestran una dispersión clara entre el bloque más sólido (${strongest.label}) y el más exigente (${weakest.label}). La proyección simple de ventas cierra en ${
    lastProjection?.sales?.toLocaleString("es-CL") ?? "0"
  } al final del horizonte simulado, por lo que la lectura visual respalda una decisión de avance gradual con foco en control de riesgo.`;
}

function buildBlockRecommendation(block: BlockScore) {
  if (block.score >= 7) {
    return `Mantener la ventaja actual en ${block.label} y convertirla en un argumento operativo medible para la etapa piloto.`;
  }

  if (block.score >= 5) {
    return `Cerrar brechas específicas en ${block.label} antes de escalar inversión o compromisos fijos de largo plazo.`;
  }

  return `Rediseñar la tesis de ${block.label} porque hoy es un factor que compromete la factibilidad global del proyecto.`;
}

function buildBlockNarrative(block: BlockScore): ReportBlockNarrative {
  return {
    summary: `${block.summary} El bloque cierra con ${block.score.toFixed(1)}/10 y un peso de ${block.weight}%, por lo que su incidencia en la recomendación final es material.`,
    detailedAnalysis: `${block.summary} En términos aplicados, este bloque condiciona la factibilidad porque reúne señales sobre ${block.factors
      .map((factor) => factor.label.toLowerCase())
      .join(", ")}. El desempeño de ${block.label} obliga a leer no solo la idea del negocio, sino también la capacidad de ejecutarla de forma consistente en mercado, operación y contexto competitivo.`,
    positives:
      block.positives.length > 0
        ? block.positives.slice(0, 3)
        : ["No se observaron ventajas dominantes en este bloque; la lectura es más bien de equilibrio o transición."],
    risks:
      block.risks.length > 0
        ? block.risks.slice(0, 3)
        : ["No aparece un riesgo crítico aislado, pero sí conviene monitorear la consistencia de este bloque durante la validación."],
    recommendation: buildBlockRecommendation(block),
    factorNarratives: block.factors.slice(0, 5).map((factor) => ({
      label: factor.label,
      headline: `${factor.label} registra ${factor.score.toFixed(1)}/10.`,
      assessment: factor.note,
      impact:
        factor.score >= 7
          ? "Su efecto sobre el proyecto es favorable y puede transformarse en una ventaja defendible."
          : factor.score >= 5
            ? "Su efecto es intermedio: no invalida el caso, pero sí exige ajustes de diseño o ejecución."
            : "Su efecto es restrictivo y hoy presiona negativamente la factibilidad del proyecto."
    }))
  };
}

function buildReportNarrative(input: ProjectInput, context: LocationContext, scoreBreakdown: ScoreBreakdown): ReportNarrative {
  const blockNarratives = scoreBreakdown.blocks.reduce<Record<BlockId, ReportBlockNarrative>>((accumulator, block) => {
    accumulator[block.id] = buildBlockNarrative(block);
    return accumulator;
  }, {} as Record<BlockId, ReportBlockNarrative>);

  return {
    scoreSummary: buildScoreSummary(scoreBreakdown),
    methodology: buildReportMethodology(scoreBreakdown),
    contextSummary: buildContextSummary(input, context),
    chartsSummary: buildChartsSummary(input, scoreBreakdown),
    blockNarratives
  };
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
      "Este resultado fue generado por la capa local de simulación. Si se configura Gemini, la app puede reemplazar esta salida por un análisis redactado por modelo real.",
    reportNarrative: buildReportNarrative(input, context, scoreBreakdown),
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
      },
      salidaEsperada: {
        executiveSummary: "Resumen ejecutivo compacto para cabecera del dashboard y del informe",
        scoreExplanation: "Lectura técnica del score final y su clasificación",
        methodologyNote: "Explicación general breve de la metodología",
        reportNarrative: {
          scoreSummary: "Texto de informe para la sección score final",
          methodology: "Texto de informe para la sección metodología usada",
          contextSummary: "Texto de informe que conecte país, región y ciudad con el proyecto",
          chartsSummary: "Lectura ejecutiva de los gráficos clave",
          blockNarratives: {
            septe: "Detalle narrativo del bloque SEPTE",
            porter: "Detalle narrativo del bloque Porter",
            foda: "Detalle narrativo del bloque FODA",
            mercado: "Detalle narrativo del bloque Mercado",
            finanzas: "Detalle narrativo del bloque Finanzas",
            operacionLegalidad: "Detalle narrativo del bloque Operación y legalidad"
          }
        }
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
