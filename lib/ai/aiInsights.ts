import type {
  BlockId,
  BlockScore,
  EvaluationSnapshot,
  InsightReport,
  LocationContext,
  ProjectInput,
  ReportBlockNarrative,
  ReportNarrative,
  ResearchDossier,
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

function firstSentences(text: string, maxSentences = 2) {
  return text
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, maxSentences)
    .join(" ")
    .trim();
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isGenericResearchSentence(value: string) {
  const normalized = normalizeText(value);

  return (
    normalized.startsWith("a continuacion se presenta una investigacion academica") ||
    normalized.startsWith("la investigacion sugiere que el desempeno del proyecto depende") ||
    normalized.startsWith("el caso muestra fortalezas de concepto") ||
    normalized.startsWith("la consistencia entre publico objetivo") ||
    normalized.startsWith("la competencia del caso") ||
    normalized.startsWith("en materia legal y de barreras de entrada") ||
    normalized.startsWith("la conclusion preliminar") ||
    normalized === "la investigacion sugiere que el desempeno del proyecto depende del contexto competitivo, del consumo local y del marco regulatorio del mercado destino."
  );
}

function cleanResearchSentence(value: string) {
  return compactText(
    value
      .replace(/^A continuación, se presenta una investigación académica[^:]*:\s*/i, "")
      .replace(/^La investigación sugiere que el desempeño del proyecto depende[^.]*\.\s*/i, "")
  );
}

type FactorResearchConfig = {
  sections: Array<keyof ResearchDossier["sections"]>;
  keywords: string[];
  variables: string[];
  action: string;
  goodImpact: string;
  mediumImpact: string;
  lowImpact: string;
};

function factorConfig(blockId: BlockId, factorLabel: string): FactorResearchConfig {
  const label = normalizeText(factorLabel);

  switch (blockId) {
    case "septe":
      if (label.includes("social")) {
        return {
          sections: ["macroMicro", "marketStudy"],
          keywords: ["social", "consumo", "demanda", "hogares", "habitos", "segmento", "cliente"],
          variables: ["customerFit", "consumerBehavior", "marketAttractiveness"],
          action: "ajustar propuesta, surtido y comunicación al patrón de consumo dominante",
          goodImpact: "refuerza el encaje cultural del proyecto y facilita una entrada comercial defendible.",
          mediumImpact: "todavía exige validar mejor hábitos de compra y sensibilidad del público objetivo.",
          lowImpact: "debilita el encaje con la demanda local y obliga a replantear público, formato o propuesta."
        };
      }
      if (label.includes("econom")) {
        return {
          sections: ["macroMicro", "marketStudy", "conclusion"],
          keywords: ["econom", "inflacion", "ingreso", "precio", "consumo", "poder adquisitivo", "mercado"],
          variables: ["marketAttractiveness", "expectedDemand", "averageTicket"],
          action: "recalibrar ticket, costos y escenario de ventas al contexto de consumo",
          goodImpact: "favorece la viabilidad comercial y mejora la defensa económica del caso.",
          mediumImpact: "permite avanzar, pero bajo supuestos financieros prudentes y seguimiento cercano.",
          lowImpact: "presiona la rentabilidad y exige un rediseño del posicionamiento económico."
        };
      }
      if (label.includes("politico") || label.includes("legal")) {
        return {
          sections: ["macroMicro", "legalBarriers"],
          keywords: ["regulator", "legal", "permiso", "patente", "habilitacion", "sanitario", "normativa"],
          variables: ["regulatoryEase", "legalDifficulty", "permitComplexity"],
          action: "cerrar la hoja de ruta regulatoria, sanitaria y comercial antes de abrir",
          goodImpact: "reduce fricción de entrada y acorta el camino de implementación.",
          mediumImpact: "no bloquea el proyecto, pero sí demanda planificación jurídica y operativa fina.",
          lowImpact: "compromete el calendario de apertura y aumenta el riesgo de sobrecostos regulatorios."
        };
      }
      if (label.includes("tecnolog")) {
        return {
          sections: ["macroMicro", "competitiveAdvantage", "marketStudy"],
          keywords: ["digital", "tecnolog", "delivery", "canal", "plataforma", "medios de pago"],
          variables: ["digitalizationLevel", "differentiationLevel"],
          action: "convertir la ventaja digital en adquisición, operación y repetición de clientes",
          goodImpact: "mejora la capacidad de captación y operación del proyecto en el mercado objetivo.",
          mediumImpact: "exige fortalecer canales digitales y control operacional para volverse ventaja real.",
          lowImpact: "deja al proyecto rezagado frente a competidores con mejor ejecución digital."
        };
      }
      if (label.includes("ecolog")) {
        return {
          sections: ["macroMicro", "competitiveAdvantage", "conclusion"],
          keywords: ["sosten", "ecolog", "ambient", "impacto", "residuo", "eficiencia"],
          variables: ["sustainabilityReadiness"],
          action: "traducir sostenibilidad a procesos, relato de marca y control de costos",
          goodImpact: "fortalece reputación y coherencia de marca sin tensionar la operación.",
          mediumImpact: "aporta valor reputacional, pero todavía no se traduce en ventaja suficientemente visible.",
          lowImpact: "deja un frente débil en consistencia operativa y diferenciación sostenible."
        };
      }
      return {
        sections: ["macroMicro", "marketStudy", "promotionPlan"],
        keywords: ["marketing", "consumo", "cliente", "marca", "comportamiento", "promocion"],
        variables: ["segmentationClarity", "customerFit", "consumerBehavior"],
        action: "afinar mensaje, segmentación y propuesta de valor frente al comportamiento del cliente",
        goodImpact: "favorece conversión y recordación de marca en el segmento objetivo.",
        mediumImpact: "necesita validar mejor propuesta, narrativa comercial y comportamiento de compra.",
        lowImpact: "dificulta la captación del cliente y debilita la tesis comercial del proyecto."
      };

    case "porter":
      if (label.includes("rivalidad")) {
        return {
          sections: ["competitionStudy", "marketStudy"],
          keywords: ["rivalidad", "compet", "oferta", "saturacion", "benchmark", "precio"],
          variables: ["competitivePressure", "competitorCount", "differentiationLevel"],
          action: "definir una diferenciación concreta frente a competidores existentes",
          goodImpact: "permite defender cuota inicial y reduce presión directa de competidores.",
          mediumImpact: "mantiene el caso abierto, pero obliga a competir con foco y disciplina comercial.",
          lowImpact: "erosiona la entrada porque el mercado ya está demasiado presionado por alternativas similares."
        };
      }
      if (label.includes("clientes")) {
        return {
          sections: ["competitionStudy", "marketStudy"],
          keywords: ["cliente", "precio", "sensibilidad", "promocion", "eleccion", "demanda"],
          variables: ["customerPower", "priceSensitivity", "customerFit"],
          action: "alinear precio, propuesta y experiencia al poder de elección del cliente",
          goodImpact: "permite capturar demanda sin deteriorar en exceso el margen.",
          mediumImpact: "exige cuidar precio, conveniencia y experiencia para sostener conversión.",
          lowImpact: "vuelve muy frágil la captura de demanda frente a clientes con alta capacidad de comparación."
        };
      }
      if (label.includes("proveedor")) {
        return {
          sections: ["competitionStudy", "operationAndHR"],
          keywords: ["proveedor", "abastecimiento", "insumo", "costos", "cadena de suministro"],
          variables: ["supplierDependency", "variableCostRate", "fixedCosts"],
          action: "diversificar compras y asegurar abastecimiento con control de margen",
          goodImpact: "da flexibilidad operativa y baja exposición a sobrecostos de suministro.",
          mediumImpact: "obliga a profesionalizar compras y negociación para proteger el margen.",
          lowImpact: "sube el riesgo operativo y financiero por dependencia o volatilidad de insumos."
        };
      }
      if (label.includes("sustituto")) {
        return {
          sections: ["competitionStudy", "marketStudy"],
          keywords: ["sustituto", "alternativa", "delivery", "kiosco", "casino", "food truck", "supermercado"],
          variables: ["substituteThreat", "customerPower", "averageTicket"],
          action: "hacer más conveniente o diferenciada la propuesta frente a alternativas de reemplazo",
          goodImpact: "reduce fuga de demanda hacia soluciones alternativas y mejora la captura de valor.",
          mediumImpact: "todavía obliga a reforzar conveniencia, propuesta o experiencia frente a opciones sustitutas.",
          lowImpact: "presiona fuerte la demanda porque el cliente puede reemplazar fácilmente la oferta."
        };
      }
      return {
        sections: ["competitionStudy", "legalBarriers"],
        keywords: ["entrante", "entrada", "barrera", "ubicacion", "capital", "permiso", "habilitacion"],
        variables: ["newEntrantsThreat", "entryBarriers", "permitComplexity"],
        action: "asegurar barreras blandas de entrada mediante ubicación, marca y ejecución temprana",
        goodImpact: "protege mejor la posición inicial y modera la entrada de nuevos competidores.",
        mediumImpact: "deja espacio para avanzar, pero sin una barrera suficientemente fuerte para escalar con comodidad.",
        lowImpact: "expone al proyecto a imitadores y a una presión de entrada que reduce defensa competitiva."
      };

    case "foda":
      if (label.includes("fortaleza")) {
        return {
          sections: ["foda", "competitiveAdvantage"],
          keywords: ["fortaleza", "capacidad", "ventaja", "propuesta", "marca", "operacion"],
          variables: ["differentiationLevel", "customerFit"],
          action: "convertir la fortaleza detectada en una ventaja operacional medible",
          goodImpact: "entrega una base interna clara para defender la tesis del negocio.",
          mediumImpact: "aporta valor, pero todavía necesita aterrizarse en ejecución y control.",
          lowImpact: "sigue siendo débil o poco demostrable para sostener la propuesta."
        };
      }
      if (label.includes("oportunidad")) {
        return {
          sections: ["foda", "marketStudy", "macroMicro"],
          keywords: ["oportunidad", "demanda", "nicho", "crecimiento", "espacio", "tendencia"],
          variables: ["marketAttractiveness", "expectedDemand", "marketSize"],
          action: "capturar la oportunidad con una entrada selectiva y una propuesta enfocada",
          goodImpact: "amplía el espacio de crecimiento y justifica avanzar con una prueba comercial.",
          mediumImpact: "es real, pero aún depende de ejecución y foco para convertirse en tracción.",
          lowImpact: "sigue siendo insuficiente o demasiado difusa para sostener la apertura."
        };
      }
      if (label.includes("debilidad")) {
        return {
          sections: ["foda", "operationAndHR", "conclusion"],
          keywords: ["debilidad", "brecha", "falta", "capacidad", "equipo", "estructura"],
          variables: ["operationalComplexity", "personnelRequired", "fixedCosts"],
          action: "cerrar la brecha interna con procesos, estructura y foco operativo",
          goodImpact: "ya no compromete seriamente la tesis del proyecto si se gestiona con disciplina.",
          mediumImpact: "sigue presente y debe mitigarse antes de escalar el caso.",
          lowImpact: "presiona directamente la factibilidad porque revela una fragilidad interna relevante."
        };
      }
      return {
        sections: ["foda", "macroMicro", "competitionStudy"],
        keywords: ["amenaza", "riesgo", "competencia", "regulatorio", "mercado", "entorno"],
        variables: ["competitivePressure", "regulatoryEase", "priceSensitivity"],
        action: "tratar la amenaza con mitigaciones explícitas antes de comprometer recursos mayores",
        goodImpact: "queda contenida y no domina la decisión final si se monitorea bien.",
        mediumImpact: "todavía condiciona el proyecto y obliga a una ruta de mitigación concreta.",
        lowImpact: "presiona la apertura porque la amenaza externa sigue siendo material."
      };

    case "mercado":
      if (label.includes("tamano")) {
        return {
          sections: ["marketStudy", "macroMicro"],
          keywords: ["tamano", "mercado", "escala", "demanda", "industria", "consumo"],
          variables: ["marketSize", "marketAttractiveness"],
          action: "dimensionar mejor el tamaño útil del mercado antes de escalar",
          goodImpact: "apoya la tesis de entrada porque existe profundidad suficiente para probar y crecer.",
          mediumImpact: "permite un piloto, pero exige acotar bien el nicho y el alcance inicial.",
          lowImpact: "reduce el atractivo comercial porque el mercado útil luce insuficiente o poco defendible."
        };
      }
      if (label.includes("demanda")) {
        return {
          sections: ["marketStudy", "conclusion"],
          keywords: ["demanda", "traccion", "consumo", "frecuencia", "captacion"],
          variables: ["expectedDemand", "customerFit", "footTraffic"],
          action: "validar la demanda con prueba comercial, entrevistas o benchmark local",
          goodImpact: "mejora la probabilidad de conversión y da sustento al piloto.",
          mediumImpact: "todavía depende de validación comercial real antes de escalar.",
          lowImpact: "deja al caso sin una base robusta de demanda para justificar apertura."
        };
      }
      if (label.includes("segmentacion")) {
        return {
          sections: ["marketStudy", "promotionPlan"],
          keywords: ["segmentacion", "nicho", "publico", "perfil", "target", "cliente"],
          variables: ["segmentationClarity", "customerFit"],
          action: "hacer más específica la segmentación y priorizar el buyer principal",
          goodImpact: "mejora enfoque comercial y reduce dispersión de recursos.",
          mediumImpact: "todavía pide mayor precisión en el segmento y en su propuesta de valor.",
          lowImpact: "debilita la ejecución comercial porque el target sigue siendo ambiguo."
        };
      }
      if (label.includes("cliente")) {
        return {
          sections: ["marketStudy", "promotionPlan"],
          keywords: ["cliente", "buyer", "universitario", "turista", "hogar", "publico"],
          variables: ["customerFit", "consumerBehavior"],
          action: "alinear propuesta, ticket y comunicación al cliente dominante",
          goodImpact: "refuerza el encaje del proyecto con el público objetivo.",
          mediumImpact: "exige afinar mejor propuesta y validación del cliente principal.",
          lowImpact: "cuestiona el encaje producto-mercado del proyecto."
        };
      }
      if (label.includes("flujo")) {
        return {
          sections: ["marketStudy", "macroMicro"],
          keywords: ["flujo", "trafico", "ubicacion", "paso", "zona", "afluencia"],
          variables: ["footTraffic", "commercialFlow"],
          action: "asegurar una ubicación o canal con flujo suficientemente defendible",
          goodImpact: "mejora exposición comercial y velocidad de validación del negocio.",
          mediumImpact: "permite operar, pero exige una estrategia de captación más activa.",
          lowImpact: "resta visibilidad y vuelve más costosa la captación de demanda."
        };
      }
      if (label.includes("turismo")) {
        return {
          sections: ["marketStudy", "macroMicro"],
          keywords: ["turismo", "visitante", "temporada", "viajero"],
          variables: ["tourismLevel", "marketAttractiveness"],
          action: "definir si el negocio depende o no de demanda turística y ajustar su estacionalidad",
          goodImpact: "abre una fuente adicional de demanda y fortalece el atractivo del caso.",
          mediumImpact: "aporta parcialmente, pero no debe sobreestimarse en la tesis comercial.",
          lowImpact: "no ofrece una base suficiente de demanda turística para sostener el proyecto."
        };
      }
      return {
        sections: ["marketStudy", "macroMicro", "promotionPlan"],
        keywords: ["tendencia", "consumo", "habito", "digital", "preferencia", "comportamiento"],
        variables: ["consumerBehavior", "digitalizationLevel"],
        action: "alinear la propuesta a la tendencia de consumo dominante del mercado destino",
        goodImpact: "mejora la afinidad del proyecto con la evolución del mercado.",
        mediumImpact: "todavía requiere traducir mejor la tendencia observada a una oferta concreta.",
        lowImpact: "deja al negocio desalineado con el patrón de consumo actual."
      };

    case "finanzas":
      if (label.includes("inversion")) {
        return {
          sections: ["conclusion", "marketStudy"],
          keywords: ["inversion", "capex", "capital", "entrada", "desembolso"],
          variables: ["initialInvestment"],
          action: "recalibrar la inversión inicial a una etapa piloto más manejable",
          goodImpact: "mejora flexibilidad financiera y facilita validar sin sobreexposición temprana.",
          mediumImpact: "es manejable, pero necesita disciplina en alcance y secuencia de inversión.",
          lowImpact: "compromete la entrada porque exige demasiado capital para el nivel de certeza actual."
        };
      }
      if (label.includes("costos fijos")) {
        return {
          sections: ["operationAndHR", "conclusion"],
          keywords: ["costos fijos", "estructura", "nomina", "arriendo", "gasto fijo"],
          variables: ["fixedCosts", "personnelRequired"],
          action: "achicar estructura fija para proteger caja y punto de equilibrio",
          goodImpact: "favorece resiliencia del proyecto y reduce presión temprana sobre ventas.",
          mediumImpact: "todavía exige control estricto de estructura antes de escalar.",
          lowImpact: "presiona la caja y eleva el umbral mínimo de ventas para operar."
        };
      }
      if (label.includes("costos variables")) {
        return {
          sections: ["operationAndHR", "competitionStudy"],
          keywords: ["costos variables", "insumos", "margen", "compra", "abastecimiento"],
          variables: ["variableCostRate", "supplierDependency"],
          action: "mejorar compras, productividad y mezcla para proteger margen variable",
          goodImpact: "da espacio para sostener margen aun bajo presión comercial.",
          mediumImpact: "es viable, pero debe monitorearse para no erosionar rentabilidad.",
          lowImpact: "deteriora el margen unitario y reduce la viabilidad del modelo."
        };
      }
      if (label.includes("ticket")) {
        return {
          sections: ["marketStudy", "promotionPlan", "competitionStudy"],
          keywords: ["ticket", "precio", "combo", "promocion", "valor percibido"],
          variables: ["averageTicket", "priceSensitivity"],
          action: "ajustar ticket al posicionamiento y a la sensibilidad real del cliente",
          goodImpact: "ayuda a capturar valor sin romper el encaje comercial.",
          mediumImpact: "aún necesita validarse contra elasticidad y benchmarking competitivo.",
          lowImpact: "queda desalineado con el mercado y tensiona conversión o margen."
        };
      }
      if (label.includes("ventas")) {
        return {
          sections: ["marketStudy", "conclusion"],
          keywords: ["ventas", "proyeccion", "facturacion", "ingresos", "traccion"],
          variables: ["monthlySalesProjection", "expectedDemand"],
          action: "volver más conservadora la proyección de ventas y validarla en terreno",
          goodImpact: "sostiene razonablemente la tesis económica del proyecto.",
          mediumImpact: "sirve como hipótesis, pero no como certeza sin validación comercial real.",
          lowImpact: "deja el caso sin una proyección creíble para justificar la apertura."
        };
      }
      if (label.includes("margen")) {
        return {
          sections: ["competitionStudy", "conclusion"],
          keywords: ["margen", "rentabilidad", "precio", "costo", "unit economics"],
          variables: ["expectedMarginPercent", "variableCostRate"],
          action: "revisar precios, costos y mix para asegurar margen defendible",
          goodImpact: "mejora la sostenibilidad financiera del piloto y de una posible expansión.",
          mediumImpact: "permite avanzar, pero con disciplina estricta sobre unit economics.",
          lowImpact: "pone en duda la rentabilidad del proyecto en su configuración actual."
        };
      }
      return {
        sections: ["conclusion", "marketStudy"],
        keywords: ["equilibrio", "break-even", "punto de equilibrio", "ventas", "costos"],
        variables: ["fixedCosts", "monthlySalesProjection", "expectedMarginPercent"],
        action: "llevar el punto de equilibrio a una zona alcanzable bajo escenario conservador",
        goodImpact: "deja una ruta financiera más controlable para validar el negocio.",
        mediumImpact: "todavía requiere disciplina para alcanzar el umbral de equilibrio.",
        lowImpact: "expone al proyecto a una operación prolongada sin equilibrio económico claro."
      };

    case "operacionLegalidad":
      if (label.includes("complejidad operativa")) {
        return {
          sections: ["operationAndHR", "conclusion"],
          keywords: ["operativa", "proceso", "estandarizacion", "ejecucion", "control"],
          variables: ["operationalComplexity"],
          action: "simplificar procesos y secuencias críticas antes de abrir",
          goodImpact: "facilita la ejecución inicial y mejora control del piloto.",
          mediumImpact: "todavía exige ordenar procesos y responsables para operar bien.",
          lowImpact: "dificulta una implementación estable y eleva riesgo de falla operativa."
        };
      }
      if (label.includes("personal")) {
        return {
          sections: ["operationAndHR", "conclusion"],
          keywords: ["personal", "equipo", "dotacion", "rrhh", "retencion", "talento"],
          variables: ["personnelRequired", "fixedCosts"],
          action: "dimensionar el equipo mínimo viable y reforzar retención/capacitación",
          goodImpact: "hace más manejable la operación y protege consistencia de servicio.",
          mediumImpact: "sigue pidiendo una estructura humana cuidadosa para no sobredimensionar el arranque.",
          lowImpact: "sube el riesgo operativo y de costos por requerimientos de personal difíciles de sostener."
        };
      }
      if (label.includes("logistica")) {
        return {
          sections: ["operationAndHR", "competitionStudy"],
          keywords: ["logistica", "despacho", "distribucion", "cadena", "coordinacion"],
          variables: ["logisticsComplexity", "commercialFlow"],
          action: "cerrar una logística simple y controlable antes de ampliar alcance",
          goodImpact: "mejora cumplimiento y reduce fricciones de servicio.",
          mediumImpact: "todavía exige coordinación y prueba operativa antes de escalar.",
          lowImpact: "puede romper promesa de servicio y deteriorar experiencia del cliente."
        };
      }
      if (label.includes("proveedor")) {
        return {
          sections: ["operationAndHR", "competitionStudy"],
          keywords: ["proveedor", "abastecimiento", "suministro", "insumo"],
          variables: ["supplierDependency", "variableCostRate"],
          action: "construir una base de proveedores menos dependiente y más predecible",
          goodImpact: "aumenta continuidad operativa y reduce exposición a quiebres de suministro.",
          mediumImpact: "permite operar, pero todavía exige respaldo y control de compras.",
          lowImpact: "amenaza continuidad, costos y calidad por alta dependencia de abastecimiento."
        };
      }
      if (label.includes("permiso")) {
        return {
          sections: ["legalBarriers", "operationAndHR"],
          keywords: ["permiso", "habilitacion", "patente", "sanitario", "licencia"],
          variables: ["permitComplexity", "regulatoryEase"],
          action: "cerrar el checklist de permisos y responsables antes de invertir más capital",
          goodImpact: "aclara el camino de apertura y reduce riesgo de atrasos evitables.",
          mediumImpact: "demanda gestión documental y tiempos realistas para no desordenar la entrada.",
          lowImpact: "puede frenar o encarecer la apertura por incertidumbre regulatoria."
        };
      }
      if (label.includes("barrera")) {
        return {
          sections: ["legalBarriers", "competitionStudy"],
          keywords: ["barrera", "entrada", "capital", "normativa", "ubicacion"],
          variables: ["entryBarriers", "newEntrantsThreat"],
          action: "entender bien barreras de entrada y usarlas a favor del diseño del proyecto",
          goodImpact: "protege mejor la posición una vez abierto el negocio.",
          mediumImpact: "exige estrategia clara para no quedar atrapado entre barreras y competencia.",
          lowImpact: "vuelve más difícil o costosa la entrada en el mercado objetivo."
        };
      }
      return {
        sections: ["legalBarriers", "operationAndHR"],
        keywords: ["apertura", "legal", "sanitaria", "comercial", "habilitacion"],
        variables: ["legalDifficulty", "permitComplexity", "regulatoryEase"],
        action: "diseñar una ruta de apertura legal, sanitaria y comercial con hitos verificables",
        goodImpact: "reduce incertidumbre de implementación y facilita pasar de idea a operación.",
        mediumImpact: "sigue requiriendo coordinación legal y operativa antes de abrir.",
        lowImpact: "compromete directamente la factibilidad por trabas de habilitación o cumplimiento."
      };
  }
}

function excerptByKeywords(text: string, keywords: string[]) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => cleanResearchSentence(sentence))
    .filter(Boolean);

  const normalizedKeywords = keywords.map(normalizeText);
  const scored = sentences
    .map((sentence) => ({
      sentence,
      score: normalizedKeywords.reduce(
        (total, keyword) => total + (normalizeText(sentence).includes(keyword) ? 1 : 0),
        0
      )
    }))
    .filter((item) => !isGenericResearchSentence(item.sentence))
    .sort((left, right) => right.score - left.score);

  const matched = scored.find((item) => item.score > 0)?.sentence;
  const fallback = scored.find((item) => item.score === 0)?.sentence;

  return matched ?? fallback ?? "";
}

function relevantFinding(blockId: BlockId, factorLabel: string, research: ResearchDossier) {
  const config = factorConfig(blockId, factorLabel);
  const keywords = config.keywords.map(normalizeText);

  return research.findings
    .filter((finding) => config.sections.includes(finding.section))
    .map((finding) => {
      const haystack = normalizeText(`${finding.title} ${finding.summary} ${finding.evidence}`);
      const score = keywords.reduce((total, keyword) => total + (haystack.includes(keyword) ? 1 : 0), 0);

      return { finding, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)[0]?.finding;
}

function relevantInference(blockId: BlockId, factorLabel: string, research: ResearchDossier) {
  const config = factorConfig(blockId, factorLabel);
  const keywords = config.keywords.map(normalizeText);

  return research.scoringInferences.find((inference) => {
    const variable = normalizeText(inference.variable);
    const rationale = normalizeText(inference.rationale);
    return (
      config.variables.some((item) => variable.includes(normalizeText(item))) ||
      keywords.some((keyword) => rationale.includes(keyword))
    );
  });
}

function assessmentFromResearch(
  blockId: BlockId,
  factor: BlockScore["factors"][number],
  research: ResearchDossier
) {
  const config = factorConfig(blockId, factor.label);
  const sectionText = config.sections
    .map((section) => research.sections[section])
    .filter(Boolean)
    .join(" ");
  const finding = relevantFinding(blockId, factor.label, research);
  const inference = relevantInference(blockId, factor.label, research);

  const summary = finding?.summary ? cleanResearchSentence(firstSentences(finding.summary, 1)) : "";
  const evidence = finding?.evidence ? cleanResearchSentence(firstSentences(finding.evidence, 1)) : "";
  const rationale = inference?.rationale ? cleanResearchSentence(firstSentences(inference.rationale, 1)) : "";
  const excerpt = sectionText ? firstSentences(excerptByKeywords(sectionText, config.keywords), 1) : "";

  const pieces = [summary, evidence, rationale, excerpt]
    .map((piece) => cleanResearchSentence(piece))
    .filter(Boolean)
    .filter((piece) => !isGenericResearchSentence(piece))
    .filter((piece, index, all) => all.findIndex((candidate) => candidate === piece) === index)
    .slice(0, 2);

  return pieces.join(" ") || factor.note;
}

function impactFromResearch(
  input: ProjectInput,
  blockId: BlockId,
  factor: BlockScore["factors"][number]
) {
  const config = factorConfig(blockId, factor.label);
  const factorName = factor.label.toLowerCase();
  const base =
    factor.score >= 7 ? config.goodImpact : factor.score >= 5 ? config.mediumImpact : config.lowImpact;

  switch (blockId) {
    case "septe":
      if (factor.score >= 7) {
        return `${factor.label} hoy acompaña la apertura de ${input.projectName} en ${input.city}: ${base} Conviene ${config.action}.`;
      }
      if (factor.score >= 5) {
        return `${factor.label} no invalida la entrada, pero sí pide una adaptación del proyecto al entorno local; ${base} Por eso conviene ${config.action}.`;
      }
      return `${factor.label} se transforma en una fricción de entorno para ${input.projectName}; ${base} Antes de abrir, hace falta ${config.action}.`;

    case "porter":
      if (factor.score >= 7) {
        return `En ${factorName}, el proyecto muestra una posición competitiva relativamente defendible: ${base} La prioridad es ${config.action}.`;
      }
      if (factor.score >= 5) {
        return `En ${factorName}, ${input.projectName} puede competir, pero sin demasiado margen para errores: ${base} Se vuelve necesario ${config.action}.`;
      }
      return `En ${factorName}, la presión del mercado objetivo es alta para ${input.projectName}; ${base} El proyecto debería ${config.action}.`;

    case "foda":
      if (factor.score >= 7) {
        return `${factor.label} aporta una palanca clara para sostener la tesis del negocio: ${base} El reto es ${config.action}.`;
      }
      if (factor.score >= 5) {
        return `${factor.label} aparece como un frente mixto dentro del diagnóstico estratégico: ${base} Para fortalecerlo, conviene ${config.action}.`;
      }
      return `${factor.label} deja una brecha estratégica visible en el caso analizado: ${base} El siguiente paso debe ser ${config.action}.`;

    case "mercado":
      if (factor.score >= 7) {
        return `${factor.label} respalda la defensa comercial del proyecto en ${input.city}: ${base} Aun así, conviene ${config.action}.`;
      }
      if (factor.score >= 5) {
        return `${factor.label} deja una oportunidad utilizable, pero todavía condicionada por validación comercial: ${base} Por eso hace falta ${config.action}.`;
      }
      return `${factor.label} sigue siendo un punto débil para justificar la entrada al mercado: ${base} Antes de avanzar, toca ${config.action}.`;

    case "finanzas":
      if (factor.score >= 7) {
        return `${factor.label} mejora la defensa económica del proyecto: ${base} La lectura recomienda ${config.action}.`;
      }
      if (factor.score >= 5) {
        return `${factor.label} permite sostener el caso, aunque bajo supuestos prudentes: ${base} Lo razonable es ${config.action}.`;
      }
      return `${factor.label} compromete la robustez financiera del proyecto: ${base} El caso exige ${config.action}.`;

    case "operacionLegalidad":
      if (factor.score >= 7) {
        return `${factor.label} facilita una implementación más controlable del negocio: ${base} Lo conveniente es ${config.action}.`;
      }
      if (factor.score >= 5) {
        return `${factor.label} deja una operación posible, pero todavía frágil en ejecución o cumplimiento: ${base} Será clave ${config.action}.`;
      }
      return `${factor.label} hoy pone presión directa sobre la apertura y operación del proyecto: ${base} Antes de seguir, corresponde ${config.action}.`;
  }
}

function factorNarrativesFromResearch(
  input: ProjectInput,
  block: BlockScore,
  research: ResearchDossier
) {
  return block.factors.slice(0, 7).map((factor) => ({
    label: factor.label,
    headline: `${factor.label} registra ${factor.score.toFixed(1)}/10.`,
    assessment: assessmentFromResearch(block.id, factor, research),
    impact: impactFromResearch(input, block.id, factor)
  }));
}

function recommendationFromWeakBlock(
  input: ProjectInput,
  block: BlockScore,
  research: ResearchDossier
) {
  const weakestFactor = [...block.factors].sort((left, right) => left.score - right.score)[0];
  const config = factorConfig(block.id, weakestFactor?.label ?? block.label);
  const finding = weakestFactor ? relevantFinding(block.id, weakestFactor.label, research) : undefined;
  const rationale = weakestFactor ? relevantInference(block.id, weakestFactor.label, research)?.rationale : "";
  const evidence = firstSentences(finding?.evidence ?? rationale ?? "", 1);

  switch (block.id) {
    case "septe":
      return `Aterrizar ${weakestFactor?.label.toLowerCase() ?? "el frente SEPTE"} con un supuesto verificable para ${input.city}: ${evidence || "validar entorno social, económico y regulatorio antes de escalar."}`;
    case "porter":
      return `Diseñar una respuesta competitiva específica frente a ${weakestFactor?.label.toLowerCase() ?? "la presión competitiva"}: ${evidence || "ajustar diferenciación, precio y captura de cliente antes de abrir."}`;
    case "foda":
      return `Convertir ${weakestFactor?.label.toLowerCase() ?? "la principal brecha FODA"} en un plan de mitigación con responsables y plazos: ${evidence || "cerrar vulnerabilidades internas antes de comprometer más inversión."}`;
    case "mercado":
      return `Validar ${weakestFactor?.label.toLowerCase() ?? "el supuesto comercial clave"} con evidencia de mercado real: ${evidence || "entrevistas, benchmark local y prueba comercial de bajo costo."}`;
    case "finanzas":
      return `Recalibrar ${weakestFactor?.label.toLowerCase() ?? "la hipótesis financiera"} bajo un escenario conservador: ${evidence || "alinear inversión, margen, ticket y ventas esperadas."}`;
    case "operacionLegalidad":
      return `Resolver ${weakestFactor?.label.toLowerCase() ?? "la brecha operativa y regulatoria"} antes de abrir: ${evidence || "ordenar permisos, proceso operativo y abastecimiento."}`;
  }
}

function sectionForBlock(blockId: BlockId, research: ResearchDossier) {
  switch (blockId) {
    case "septe":
      return research.sections.macroMicro;
    case "porter":
      return research.sections.competitionStudy;
    case "foda":
      return research.sections.foda;
    case "mercado":
      return research.sections.marketStudy;
    case "finanzas":
      return `${research.sections.marketStudy}\n\n${research.sections.conclusion}`;
    case "operacionLegalidad":
      return `${research.sections.operationAndHR}\n\n${research.sections.legalBarriers}`;
    default:
      return research.projectSummary;
  }
}

function buildResearchBackedNarrative(
  input: ProjectInput,
  context: LocationContext,
  scoreBreakdown: ScoreBreakdown,
  research: ResearchDossier
): ReportNarrative {
  const blockNarratives = scoreBreakdown.blocks.reduce<Record<BlockId, ReportBlockNarrative>>((accumulator, block) => {
    const sectionText = sectionForBlock(block.id, research);
    const relatedFindings = research.findings
      .filter((finding) => {
        if (block.id === "septe") return finding.section === "macroMicro";
        if (block.id === "porter") return finding.section === "competitionStudy";
        if (block.id === "foda") return finding.section === "foda";
        if (block.id === "mercado") return finding.section === "marketStudy";
        if (block.id === "finanzas") return finding.section === "marketStudy" || finding.section === "conclusion";
        return finding.section === "operationAndHR" || finding.section === "legalBarriers";
      })
      .slice(0, 3);

    accumulator[block.id] = {
      summary: firstSentences(sectionText, 1) || block.summary,
      detailedAnalysis: sectionText,
      positives:
        relatedFindings.map((finding) => finding.summary).slice(0, 3).filter(Boolean).length > 0
          ? relatedFindings.map((finding) => finding.summary).slice(0, 3)
          : block.positives.slice(0, 3),
      risks:
        relatedFindings.map((finding) => finding.evidence).slice(0, 3).filter(Boolean).length > 0
          ? relatedFindings.map((finding) => finding.evidence).slice(0, 3)
          : block.risks.slice(0, 3),
      recommendation: recommendationFromWeakBlock(input, block, research),
      factorNarratives: factorNarrativesFromResearch(input, block, research)
    };

    return accumulator;
  }, {} as Record<BlockId, ReportBlockNarrative>);

  return {
    scoreSummary: `${research.projectSummary} El score sintetiza esta investigación y ubica el caso en ${scoreBreakdown.finalScore.toFixed(
      1
    )}/10 con clasificación "${scoreBreakdown.classification}".`,
    methodology: `La metodología combinó investigación académica asistida por IA con inferencias estructuradas y scoring multicriterio. A partir del dossier investigado se tradujeron señales de industria, competencia, mercado, operación y barreras regulatorias a variables cuantificables para la evaluación final.`,
    contextSummary: `${buildContextSummary(input, context)} La investigación complementaria agregó fuentes y hallazgos aplicados al país, ciudad y sector objetivo.`,
    chartsSummary: `Los gráficos condensan un expediente investigado por IA: permiten ver dónde la evidencia territorial y competitiva sostiene la tesis y dónde todavía aparecen restricciones materiales para el proyecto.`,
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
      "Este resultado fue generado por la capa local de simulación. Si se configura IA, la app puede reemplazar esta salida por un análisis redactado por modelo real.",
    reportNarrative: buildReportNarrative(input, context, scoreBreakdown),
    source: "mock",
    provider: "local-rules",
    generatedAt: new Date().toISOString()
  };
}

export function generateResearchBackedInsights(
  input: ProjectInput,
  context: LocationContext,
  scoreBreakdown: ScoreBreakdown,
  research: ResearchDossier
): InsightReport {
  const reportNarrative = buildResearchBackedNarrative(input, context, scoreBreakdown, research);
  const mainFindings = research.findings.slice(0, 5).map((finding) => finding.summary);
  const opportunities = research.findings
    .filter((finding) => ["competitiveAdvantage", "marketStudy", "promotionPlan"].includes(finding.section))
    .slice(0, 5)
    .map((finding) => finding.evidence);
  const recommendations = [
    ...research.assumptions
      .slice(0, 2)
      .map((assumption) => `Validar supuesto de investigación: ${assumption}`),
    ...scoreBreakdown.blocks
      .sort((left, right) => left.score - right.score)
      .slice(0, 4)
      .map((block) => recommendationFromWeakBlock(input, block, research))
  ]
    .map((item) => compactText(item))
    .filter((item, index, all) => all.findIndex((candidate) => candidate === item) === index)
    .slice(0, 6);

  return {
    executiveSummary: research.projectSummary,
    scoreExplanation: buildScoreExplanation(scoreBreakdown),
    mainFindings,
    opportunities: opportunities.length > 0 ? opportunities : scoreBreakdown.opportunities.slice(0, 5),
    recommendations,
    principalRisks: scoreBreakdown.risks.slice(0, 6),
    conclusion: research.sections.conclusion,
    methodologyNote:
      "El informe final se construyó a partir del dossier de investigación asistida y luego se sintetizó con el motor de scoring de factibilidad.",
    reportNarrative,
    source: "gemini",
    provider: "gemini-research-fallback",
    generatedAt: new Date().toISOString(),
    fallbackReason: "Se reutilizó el dossier de investigación para completar la salida ejecutiva porque la última capa estructurada de insights no respondió de forma válida."
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
