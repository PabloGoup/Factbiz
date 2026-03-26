import { BLOCK_LABELS, DEFAULT_WEIGHTS } from "@/lib/constants";
import type {
  BlockId,
  BlockScore,
  FactorScore,
  LocationContext,
  ProjectInput,
  ProjectWeights,
  RiskItem,
  ScoreBreakdown
} from "@/types";
import { average, clamp, roundScore, scoreFromInverse, scoreFromRange } from "@/lib/utils";

function sectorProfile(input: ProjectInput) {
  const profile = `${input.businessType} ${input.sector}`.toLowerCase();

  return {
    tourismAffinity: /(hotel|turismo|hostal|lodge|hospitalidad|viaje)/.test(profile) ? 1.2 : 0.8,
    footTrafficAffinity: /(restaurante|cafeteria|cafetería|retail|tienda|comercio|gastronom)/.test(profile)
      ? 1.2
      : 0.9,
    digitalAffinity: /(software|educacion|educación|ecommerce|consultor|servicio)/.test(profile) ? 1.15 : 0.95
  };
}

function buildFactor(id: string, label: string, score: number, note: string): FactorScore {
  return {
    id,
    label,
    score: roundScore(clamp(score)),
    note
  };
}

function classify(finalScore: number) {
  if (finalScore <= 3.9) return "No factible" as const;
  if (finalScore <= 6.9) return "Factible con riesgos" as const;
  return "Factible" as const;
}

function interpretationForScore(finalScore: number, classification: ScoreBreakdown["classification"]) {
  if (classification === "Factible") {
    return `El proyecto presenta bases suficientes para avanzar. La prioridad no es validar si existe oportunidad, sino proteger su ejecución con foco en disciplina comercial y control operacional.`;
  }

  if (classification === "Factible con riesgos") {
    return `La oportunidad existe, pero depende de corregir variables críticas antes de comprometer capital o escalar. El caso requiere una entrada gradual y decisiones de mitigación explícitas.`;
  }

  return `En su estado actual, el proyecto expone demasiadas fricciones estratégicas, financieras u operativas. Antes de avanzar, conviene replantear la propuesta o reducir su alcance inicial.`;
}

function scoreSepte(input: ProjectInput, context: LocationContext): BlockScore {
  const profile = sectorProfile(input);
  const factors = [
    buildFactor(
      "social",
      "Social",
      average([input.customerFit, input.segmentationClarity, input.consumerBehavior]),
      "Evalúa encaje del proyecto con hábitos de consumo y claridad de público objetivo."
    ),
    buildFactor(
      "economico",
      "Económico",
      average([context.economicStability, 10 - context.priceSensitivity, input.expectedDemand]),
      "Combina estabilidad relativa, sensibilidad al precio y tracción esperada."
    ),
    buildFactor(
      "politico_legal",
      "Político / legal",
      average([context.regulatoryEase, 10 - input.legalDifficulty, 10 - input.permitComplexity]),
      "Mide fricción regulatoria y probabilidad de abrir sin sobrecostos por permisos."
    ),
    buildFactor(
      "tecnologico",
      "Tecnológico",
      average([input.digitalizationLevel * profile.digitalAffinity, context.digitalizationLevel]),
      "Refleja la preparación digital del proyecto y del mercado."
    ),
    buildFactor(
      "ecologico",
      "Ecológico",
      average([input.sustainabilityReadiness, 10 - input.logisticsComplexity * 0.4]),
      "Premia sostenibilidad y penaliza operaciones con trazabilidad compleja."
    ),
    buildFactor(
      "marketing",
      "Marketing / consumidor",
      average([input.differentiationLevel, input.consumerBehavior, input.customerFit]),
      "Aproxima la capacidad de posicionar la oferta frente a expectativas del consumidor."
    )
  ];

  const score = roundScore(average(factors.map((factor) => factor.score)));
  const positives = [
    "El encaje entre segmento, demanda y comportamiento del consumidor es consistente.",
    "La lectura del entorno tecnológico es suficiente para escalar canales digitales."
  ].filter((item, index) => (index === 0 ? score >= 6 : factors[3].score >= 6.5));
  const risks = [
    "La sensibilidad económica del mercado puede tensionar precios o márgenes.",
    "La carga regulatoria podría ralentizar la puesta en marcha."
  ].filter((item, index) => (index === 0 ? factors[1].score <= 6 : factors[2].score <= 6));

  return {
    id: "septe",
    label: BLOCK_LABELS.septe,
    weight: DEFAULT_WEIGHTS.septe,
    score,
    contribution: 0,
    summary:
      score >= 7
        ? "El entorno macro y del consumidor acompaña razonablemente la propuesta."
        : "El entorno macro ofrece señales mixtas y exige una estrategia más disciplinada.",
    factors,
    positives,
    risks
  };
}

function scorePorter(input: ProjectInput, context: LocationContext): BlockScore {
  const competitorScore = scoreFromInverse(input.competitorCount + context.competitivePressure * 0.7, 18);
  const factors = [
    buildFactor(
      "rivalidad",
      "Rivalidad competitiva",
      competitorScore,
      "Considera cantidad de competidores y presión competitiva del entorno."
    ),
    buildFactor(
      "clientes",
      "Poder de clientes",
      average([10 - input.customerPower, 10 - context.priceSensitivity * 0.6]),
      "Mayor sensibilidad y poder de negociación reducen la robustez comercial."
    ),
    buildFactor(
      "proveedores",
      "Poder de proveedores",
      average([10 - input.supplierDependency, 10 - input.logisticsComplexity * 0.5]),
      "La dependencia de proveedores o cadenas de abastecimiento rígidas resta margen."
    ),
    buildFactor(
      "sustitutos",
      "Amenaza de sustitutos",
      10 - input.substituteThreat,
      "Una amenaza alta de sustitutos erosiona captura de valor."
    ),
    buildFactor(
      "entrantes",
      "Amenaza de nuevos entrantes",
      average([10 - input.newEntrantsThreat, input.entryBarriers]),
      "Evalúa la facilidad con que otros actores pueden replicar la propuesta."
    )
  ];

  const score = roundScore(average(factors.map((factor) => factor.score)));

  return {
    id: "porter",
    label: BLOCK_LABELS.porter,
    weight: DEFAULT_WEIGHTS.porter,
    score,
    contribution: 0,
    summary:
      score >= 7
        ? "La estructura competitiva es manejable y deja espacio para capturar valor."
        : "La estructura competitiva comprime márgenes y obliga a diferenciar con claridad.",
    factors,
    positives: factors
      .filter((factor) => factor.score >= 7)
      .map((factor) => `${factor.label} se mantiene en una zona favorable.`),
    risks: factors
      .filter((factor) => factor.score <= 5.5)
      .map((factor) => `${factor.label} requiere medidas de defensa comercial u operativa.`)
  };
}

function scoreFoda(input: ProjectInput, context: LocationContext): BlockScore {
  const strengths = average([
    input.differentiationLevel,
    input.customerFit,
    input.digitalizationLevel,
    input.sustainabilityReadiness
  ]);
  const opportunities = average([
    input.expectedDemand,
    context.marketAttractiveness,
    context.tourismLevel,
    input.marketSize
  ]);
  const weaknesses = average([
    input.operationalComplexity,
    input.supplierDependency,
    input.legalDifficulty,
    input.logisticsComplexity
  ]);
  const threats = average([
    context.competitivePressure,
    input.substituteThreat,
    input.newEntrantsThreat,
    context.priceSensitivity
  ]);

  const factors = [
    buildFactor("fortalezas", "Fortalezas", strengths, "Capacidades internas que soportan la propuesta."),
    buildFactor("oportunidades", "Oportunidades", opportunities, "Señales externas que amplían la viabilidad."),
    buildFactor("debilidades", "Debilidades", 10 - weaknesses, "Fricciones internas de ejecución y control."),
    buildFactor("amenazas", "Amenazas", 10 - threats, "Riesgos externos que pueden deteriorar el plan.")
  ];

  const score = roundScore(average(factors.map((factor) => factor.score)));

  return {
    id: "foda",
    label: BLOCK_LABELS.foda,
    weight: DEFAULT_WEIGHTS.foda,
    score,
    contribution: 0,
    summary:
      score >= 7
        ? "El balance FODA es favorable y la propuesta muestra una ventaja interpretable."
        : "El balance FODA evidencia tensiones que deben mitigarse antes de escalar.",
    factors,
    positives: [
      strengths >= 7 ? "La propuesta exhibe atributos diferenciadores claros." : "",
      opportunities >= 7 ? "El entorno ofrece oportunidades tangibles de tracción." : ""
    ].filter(Boolean),
    risks: [
      weaknesses >= 6 ? "La ejecución interna puede tensionarse por complejidad o dependencia." : "",
      threats >= 6 ? "Las amenazas competitivas y de sustitución son materialmente relevantes." : ""
    ].filter(Boolean)
  };
}

function scoreMercado(input: ProjectInput, context: LocationContext): BlockScore {
  const profile = sectorProfile(input);
  const factors = [
    buildFactor("tamano", "Tamaño de mercado", average([input.marketSize, context.marketAttractiveness]), "Evalúa profundidad del mercado y atractivo contextual."),
    buildFactor("demanda", "Demanda esperada", average([input.expectedDemand, input.customerFit]), "Mide probabilidad de conversión sostenida."),
    buildFactor("segmentacion", "Segmentación", input.segmentationClarity, "Una segmentación clara reduce dispersión comercial."),
    buildFactor("cliente_objetivo", "Cliente objetivo", average([input.customerFit, input.consumerBehavior]), "Refleja claridad de propuesta de valor para el buyer objetivo."),
    buildFactor(
      "flujo_publico",
      "Flujo de público",
      average([input.footTraffic * profile.footTrafficAffinity, context.commercialFlow]),
      "Especialmente relevante en negocios dependientes de tránsito y visibilidad."
    ),
    buildFactor(
      "turismo",
      "Turismo",
      average([input.tourismLevel * profile.tourismAffinity, context.tourismLevel]),
      "Aporta valor adicional cuando la categoría depende de visitantes o estacionalidad."
    ),
    buildFactor(
      "tendencia",
      "Tendencia de consumo",
      average([input.consumerBehavior, context.digitalizationLevel]),
      "Aproxima la dirección de hábitos de compra, conveniencia y omnicanalidad."
    )
  ];

  const score = roundScore(average(factors.map((factor) => factor.score)));

  return {
    id: "mercado",
    label: BLOCK_LABELS.mercado,
    weight: DEFAULT_WEIGHTS.mercado,
    score,
    contribution: 0,
    summary:
      score >= 7
        ? "La oportunidad de mercado es defendible y la demanda proyectada se ve plausible."
        : "La oportunidad de mercado no es débil, pero aún depende de mejor foco comercial.",
    factors,
    positives: factors
      .filter((factor) => factor.score >= 7.2)
      .map((factor) => `${factor.label} aporta una señal favorable al caso.`),
    risks: factors
      .filter((factor) => factor.score <= 5.5)
      .map((factor) => `${factor.label} no alcanza un umbral suficiente para sostener una expansión rápida.`)
  };
}

function scoreFinanzas(input: ProjectInput): BlockScore {
  const contributionMargin = clamp(input.expectedMarginPercent / 3.5);
  const grossProfit = input.monthlySalesProjection * (1 - input.variableCostRate / 100) - input.fixedCosts;
  const paybackMonths = grossProfit > 0 ? input.initialInvestment / grossProfit : 60;
  const paybackScore = scoreFromRange(paybackMonths, 6, 18, 48);
  const breakEvenSales = input.fixedCosts / Math.max(1 - input.variableCostRate / 100, 0.05);
  const breakEvenScore = scoreFromRange(breakEvenSales / Math.max(input.monthlySalesProjection, 1), 0.2, 0.8, 2);
  const averageTicketScore =
    input.priceRange === "económico"
      ? scoreFromRange(input.averageTicket, 8, 28, 80)
      : input.priceRange === "medio"
        ? scoreFromRange(input.averageTicket, 18, 80, 180)
        : scoreFromRange(input.averageTicket, 60, 260, 480);

  const factors = [
    buildFactor(
      "inversion",
      "Inversión inicial",
      scoreFromInverse(input.initialInvestment / 50000, 10),
      "Un capex más liviano mejora la flexibilidad de entrada y prueba."
    ),
    buildFactor("costos_fijos", "Costos fijos", scoreFromInverse(input.fixedCosts / 7000, 10), "Estructuras pesadas reducen resiliencia en etapa temprana."),
    buildFactor("costos_variables", "Costos variables", scoreFromInverse(input.variableCostRate, 70), "La estructura variable impacta margen y punto de equilibrio."),
    buildFactor("ticket", "Ticket promedio", averageTicketScore, "Se contrasta ticket esperado con el posicionamiento de precio declarado."),
    buildFactor("ventas", "Proyección de ventas", scoreFromRange(input.monthlySalesProjection / Math.max(input.initialInvestment, 1), 0.15, 0.65, 1.5), "Evalúa relación entre ventas mensuales y capital comprometido."),
    buildFactor("margen", "Margen esperado", contributionMargin, "Convierte el margen declarado en un score comparable."),
    buildFactor("equilibrio", "Punto de equilibrio", average([paybackScore, breakEvenScore]), "Cruza velocidad de repago y exigencia de break-even.")
  ];

  const score = roundScore(average(factors.map((factor) => factor.score)));

  return {
    id: "finanzas",
    label: BLOCK_LABELS.finanzas,
    weight: DEFAULT_WEIGHTS.finanzas,
    score,
    contribution: 0,
    summary:
      score >= 7
        ? "La estructura financiera parece viable para una etapa piloto o de crecimiento controlado."
        : "La estructura financiera necesita ajustes para soportar volatilidad o demoras comerciales.",
    factors,
    positives: [
      paybackScore >= 7 ? "La recuperación de la inversión proyectada es razonable." : "",
      contributionMargin >= 6.5 ? "El margen declarado entrega espacio para absorber contingencias." : ""
    ].filter(Boolean),
    risks: [
      grossProfit <= 0 ? "La operación no cubre costos con la proyección actual." : "",
      paybackMonths > 24 ? "El plazo de repago proyectado es extenso para un despliegue temprano." : ""
    ].filter(Boolean)
  };
}

function scoreOperacion(input: ProjectInput, context: LocationContext): BlockScore {
  const factors = [
    buildFactor("complejidad", "Complejidad operativa", 10 - input.operationalComplexity, "Menor complejidad facilita estandarización y control."),
    buildFactor("personal", "Personal requerido", scoreFromInverse(input.personnelRequired, 18), "Equipos livianos suelen escalar mejor al inicio."),
    buildFactor("logistica", "Logística", 10 - input.logisticsComplexity, "Logísticas tensas exigen más capital de coordinación."),
    buildFactor("proveedores", "Proveedores", 10 - input.supplierDependency, "Dependencia alta reduce flexibilidad y poder de negociación."),
    buildFactor("permisos", "Permisos", average([10 - input.permitComplexity, context.regulatoryEase]), "Integra permisos, tiempos de apertura y claridad regulatoria."),
    buildFactor("barreras", "Barreras de entrada", input.entryBarriers, "Barreras saludables protegen la posición una vez abierto el negocio."),
    buildFactor("apertura_legal", "Apertura legal / sanitaria / comercial", average([10 - input.legalDifficulty, context.regulatoryEase]), "Evalúa la factibilidad de iniciar operación formal sin fricciones excesivas.")
  ];

  const score = roundScore(average(factors.map((factor) => factor.score)));

  return {
    id: "operacionLegalidad",
    label: BLOCK_LABELS.operacionLegalidad,
    weight: DEFAULT_WEIGHTS.operacionLegalidad,
    score,
    contribution: 0,
    summary:
      score >= 7
        ? "El proyecto es operable con disciplina razonable y sin fricciones legales dominantes."
        : "La ejecución puede resentirse por complejidad, permisos o dependencia de terceros.",
    factors,
    positives: factors
      .filter((factor) => factor.score >= 7)
      .map((factor) => `${factor.label} está en un rango operativo manejable.`),
    risks: factors
      .filter((factor) => factor.score <= 5.5)
      .map((factor) => `${factor.label} puede ralentizar la apertura o erosionar control.`)
  };
}

function buildRisks(blocks: BlockScore[]): RiskItem[] {
  const severityWeight = {
    alta: 0,
    media: 1,
    baja: 2
  } as const;

  return blocks
    .flatMap((block) =>
      block.factors
        .filter((factor) => factor.score <= 5.5)
        .map<RiskItem>((factor) => ({
          title: factor.label,
          severity: factor.score <= 4 ? "alta" : "media",
          detail: factor.note,
          relatedBlock: block.id
        }))
    )
    .sort((left, right) => severityWeight[left.severity] - severityWeight[right.severity])
    .slice(0, 6);
}

function buildSalesProjection(input: ProjectInput, finalScore: number) {
  const momentum = finalScore >= 7 ? 1.06 : finalScore >= 5 ? 1.035 : 1.015;
  const volatility = finalScore >= 7 ? 0.98 : 0.94;
  const base = input.monthlySalesProjection;

  return Array.from({ length: 6 }, (_, index) => {
    const monthNumber = index + 1;
    const seasonality = monthNumber % 3 === 0 ? 1.05 : volatility;

    return {
      month: `M${monthNumber}`,
      sales: Math.round(base * Math.pow(momentum, index) * seasonality)
    };
  });
}

export function evaluateProject(
  input: ProjectInput,
  context: LocationContext,
  weights: ProjectWeights = DEFAULT_WEIGHTS
): ScoreBreakdown {
  const blocks = [
    scoreSepte(input, context),
    scorePorter(input, context),
    scoreFoda(input, context),
    scoreMercado(input, context),
    scoreFinanzas(input),
    scoreOperacion(input, context)
  ].map((block) => {
    const weight = weights[block.id];
    const contribution = (block.score * weight) / 100;

    return {
      ...block,
      weight,
      contribution: roundScore(contribution)
    };
  });

  const finalScore = roundScore(blocks.reduce((sum, block) => sum + block.contribution, 0));
  const classification = classify(finalScore);
  const strengths = blocks
    .filter((block) => block.score >= 7)
    .map((block) => `${block.label} se mantiene sobre el umbral de solidez esperado.`);
  const opportunities = blocks
    .filter((block) => block.score >= 6.5)
    .flatMap((block) => block.positives)
    .slice(0, 6);

  return {
    finalScore,
    classification,
    interpretation: interpretationForScore(finalScore, classification),
    weights,
    blocks,
    strengths,
    opportunities,
    risks: buildRisks(blocks),
    salesProjection: buildSalesProjection(input, finalScore)
  };
}
