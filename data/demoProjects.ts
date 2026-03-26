import type { ProjectInput } from "@/types";

export const demoProjects: Record<string, ProjectInput> = {
  domino_buenos_aires: {
    projectName: "Dominó Urbano Buenos Aires",
    businessType: "Restaurante temático",
    sector: "Gastronomía",
    country: "Argentina",
    region: "Ciudad Autónoma de Buenos Aires",
    city: "Buenos Aires",
    description:
      "Cadena boutique de pizza estilo dominó con operación híbrida en salón, take away y delivery para zonas de alto tránsito corporativo y residencial.",
    targetAudience:
      "Profesionales jóvenes, estudiantes universitarios y familias urbanas que priorizan conveniencia, marca reconocible y ticket medio accesible.",
    priceRange: "medio",
    marketSize: 8,
    expectedDemand: 8,
    segmentationClarity: 8,
    customerFit: 8,
    footTraffic: 9,
    tourismLevel: 7,
    digitalizationLevel: 8,
    consumerBehavior: 7,
    competitorCount: 8,
    differentiationLevel: 6,
    customerPower: 6,
    supplierDependency: 5,
    substituteThreat: 8,
    newEntrantsThreat: 7,
    initialInvestment: 95000,
    fixedCosts: 16500,
    variableCostRate: 39,
    averageTicket: 24,
    monthlySalesProjection: 43000,
    expectedMarginPercent: 19,
    operationalComplexity: 6,
    personnelRequired: 9,
    logisticsComplexity: 5,
    legalDifficulty: 4,
    permitComplexity: 5,
    entryBarriers: 6,
    sustainabilityReadiness: 7,
    knownStrengths:
      "Marca simple de comunicar, formato replicable y combinación de canales físicos con delivery.",
    knownRisks:
      "Alta presión competitiva, sustitución intensa y sensibilidad del consumidor a promociones."
  },
  hotel_amazonia: {
    projectName: "Hotel de Experiencias Selva Viva",
    businessType: "Hotel ecoturístico",
    sector: "Turismo y hospitalidad",
    country: "Perú",
    region: "Loreto",
    city: "Iquitos",
    description:
      "Lodge boutique orientado a turismo experiencial en entorno amazónico con paquetes de hospedaje, excursiones y gastronomía local.",
    targetAudience:
      "Turistas internacionales de ingreso medio alto, agencias especializadas y viajeros interesados en naturaleza y sostenibilidad.",
    priceRange: "premium",
    marketSize: 6,
    expectedDemand: 7,
    segmentationClarity: 8,
    customerFit: 8,
    footTraffic: 4,
    tourismLevel: 9,
    digitalizationLevel: 5,
    consumerBehavior: 8,
    competitorCount: 4,
    differentiationLevel: 9,
    customerPower: 5,
    supplierDependency: 7,
    substituteThreat: 4,
    newEntrantsThreat: 3,
    initialInvestment: 320000,
    fixedCosts: 42000,
    variableCostRate: 33,
    averageTicket: 210,
    monthlySalesProjection: 76000,
    expectedMarginPercent: 24,
    operationalComplexity: 8,
    personnelRequired: 14,
    logisticsComplexity: 9,
    legalDifficulty: 6,
    permitComplexity: 7,
    entryBarriers: 8,
    sustainabilityReadiness: 9,
    knownStrengths:
      "Propuesta diferencial fuerte, posicionamiento aspiracional y potencial para alianzas con operadores turísticos.",
    knownRisks:
      "Capex elevado, complejidad logística y dependencia de conectividad, permisos y estacionalidad turística."
  }
};

export const demoProjectList = Object.entries(demoProjects).map(([id, project]) => ({
  id,
  project
}));
