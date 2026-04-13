import type {
  HotelAttraction,
  HotelBenchmarkReport,
  HotelBenchmarkSearchInput,
  HotelCaseInput,
  HotelCompetitor,
  HotelDestinationId,
  HotelEvidencePoint,
  HotelReferenceHotel,
  HotelResearchReport,
  HotelRoomRates,
  HotelSalesChannelId,
  HotelSepteFactor,
  HotelSepteFactorId,
  HotelStrategicPlan,
  HotelTouristStat,
  ResearchSource
} from "@/types";

export type HotelDestinationProfile = {
  id: HotelDestinationId;
  label: string;
  region: string;
  country: string;
  destinationDiagnosis: string;
  attractions: string[];
  touristStats: HotelTouristStat[];
  marketRateReference: HotelRoomRates;
  septeFactors: Array<Omit<HotelSepteFactor, "evidence"> & { evidence?: HotelSepteFactor["evidence"] }>;
  competitionSummary: string;
  competitors: HotelCompetitor[];
  sources: ResearchSource[];
};

export const HOTEL_CHANNEL_LABELS: Record<HotelSalesChannelId, string> = {
  tourOperators: "Tour Operadores",
  onlineAgencies: "Agencias online",
  direct: "Cliente directo",
  corporate: "Empresas"
};

export const HOTEL_DESTINATION_OPTIONS = [
  { id: "patagonia-chilena", label: "Patagonia Chilena" },
  { id: "puerto-varas", label: "Puerto Varas" },
  { id: "villarrica", label: "Villarrica" },
  { id: "san-pedro-de-atacama", label: "San Pedro de Atacama" },
  { id: "papudo", label: "Papudo" }
] as const;

export const DEFAULT_HOTEL_CHANNELS = {
  tourOperators: { share: 38, commission: 22 },
  onlineAgencies: { share: 27, commission: 18 },
  direct: { share: 20, commission: 4 },
  corporate: { share: 15, commission: 10 }
} as const;

const CHILE_RECEPTIVE_TOURISM_SOURCE: ResearchSource = {
  title: "Subsecretaría de Turismo - Llegadas de turistas extranjeros al país",
  url: "https://www.subturismo.gob.cl/2026/02/26/chile-supera-los-6-millones-de-turistas-extranjeros-en-2025-la-mejor-cifra-desde-2017-y-el-mayor-registro-post-pandemia/",
  note: "Referencia oficial de llegadas internacionales de turistas a Chile durante 2025."
};

type DestinationNumericContext = {
  regionSource: ResearchSource;
  asOf: string;
  pernoctations: string;
  occupancy: string;
  adr: string;
  growth: string;
};

const DESTINATION_NUMERIC_CONTEXT: Record<HotelDestinationId, DestinationNumericContext> = {
  "patagonia-chilena": {
    regionSource: {
      title: "INE Magallanes - EMAT febrero 2025",
      url: "https://regiones.ine.gob.cl/magallanes/prensa/en-febrero-de-2025-las-pernoctaciones-en-establecimientos-de-alojamiento-tur%C3%ADstico-de-magallanes-aumentaron-1-6",
      note: "Fuente oficial de pernoctaciones, ocupación y ADR de la Región de Magallanes y de la Antártica Chilena."
    },
    asOf: "Febrero 2025",
    pernoctations: "105.247",
    occupancy: "59,8%",
    adr: "CLP 245.820",
    growth: "+1,6% interanual"
  },
  "puerto-varas": {
    regionSource: {
      title: "INE Los Lagos - EMAT febrero 2025",
      url: "https://regiones.ine.gob.cl/los-lagos/prensa/las-pernoctaciones-en-establecimientos-de-alojamiento-tur%C3%ADstico-registraron-un-aumento-de-0-4-en-doce-meses",
      note: "Fuente oficial de pernoctaciones, ocupación y ADR de la Región de Los Lagos."
    },
    asOf: "Febrero 2025",
    pernoctations: "226.770",
    occupancy: "55,4%",
    adr: "CLP 94.095",
    growth: "+0,4% interanual"
  },
  villarrica: {
    regionSource: {
      title: "INE La Araucanía - EMAT febrero 2025",
      url: "https://regiones.ine.gob.cl/araucania/estadisticas-regionales/sociales/condiciones-de-vida-y-cultura/cultura/las-pernoctaciones-en-establecimientos-de-alojamiento-tur%C3%ADstico-aumentaron-41-6-en-febrero-2025",
      note: "Fuente oficial de pernoctaciones, ocupación y ADR de la Región de La Araucanía."
    },
    asOf: "Febrero 2025",
    pernoctations: "200.516",
    occupancy: "53,0%",
    adr: "CLP 81.832",
    growth: "+41,6% interanual"
  },
  "san-pedro-de-atacama": {
    regionSource: {
      title: "INE Antofagasta - EMAT febrero 2026",
      url: "https://regiones.ine.gob.cl/antofagasta/prensa/las-pernoctaciones-en-establecimientos-de-alojamiento-tur%C3%ADstico-registraron-un-aumento-de-10-4-en-doce-meses",
      note: "Fuente oficial de pernoctaciones, ocupación y ADR de la Región de Antofagasta."
    },
    asOf: "Febrero 2026",
    pernoctations: "129.927",
    occupancy: "52,3%",
    adr: "CLP 87.974",
    growth: "+10,4% interanual"
  },
  papudo: {
    regionSource: {
      title: "INE Valparaíso - EMAT febrero 2025",
      url: "https://regiones.ine.gob.cl/valparaiso/prensa/encuesta-mensual-de-alojamiento-tur%C3%ADstico-%28emat%29-febrero-2025",
      note: "Fuente oficial de pernoctaciones, ocupación y ADR de la Región de Valparaíso."
    },
    asOf: "Febrero 2025",
    pernoctations: "357.004",
    occupancy: "47,2%",
    adr: "CLP 93.657",
    growth: "+11,9% interanual"
  }
};

function buildOfficialTouristStats(destinationId: HotelDestinationId): HotelTouristStat[] {
  const context = DESTINATION_NUMERIC_CONTEXT[destinationId];

  return [
    {
      label: "Turistas extranjeros que ingresaron a Chile",
      value: "6.004.567 durante 2025",
      note: "El turismo receptivo creció 14,6% versus 2024 y da una base dura del flujo internacional que puede alimentar destinos premium.",
      asOf: "Año 2025",
      sourceTitle: CHILE_RECEPTIVE_TOURISM_SOURCE.title,
      sourceUrl: CHILE_RECEPTIVE_TOURISM_SOURCE.url
    },
    {
      label: "Pernoctaciones regionales",
      value: `${context.pernoctations} en ${context.asOf}`,
      note: `La región registró una variación de ${context.growth} en pernoctaciones de alojamiento turístico.`,
      asOf: context.asOf,
      sourceTitle: context.regionSource.title,
      sourceUrl: context.regionSource.url
    },
    {
      label: "Ocupación regional",
      value: `${context.occupancy} en ${context.asOf}`,
      note: "Ese nivel de ocupación define cuánto margen tiene un nuevo hotel para capturar demanda sin entrar de inmediato en una guerra tarifaria.",
      asOf: context.asOf,
      sourceTitle: context.regionSource.title,
      sourceUrl: context.regionSource.url
    },
    {
      label: "ADR regional",
      value: `${context.adr} en ${context.asOf}`,
      note: "Ese ADR marca el piso de referencia del destino y ayuda a evaluar si la tarifa objetivo del caso está alineada, agresiva o insuficiente.",
      asOf: context.asOf,
      sourceTitle: context.regionSource.title,
      sourceUrl: context.regionSource.url
    }
  ];
}

function buildOfficialSepteEvidence(destinationId: HotelDestinationId): Partial<Record<HotelSepteFactorId, HotelEvidencePoint[]>> {
  const context = DESTINATION_NUMERIC_CONTEXT[destinationId];

  return {
    social: [
      {
        label: "Turismo receptivo nacional",
        value: "6.004.567 llegadas en 2025",
        note: "Ese volumen respalda una base de demanda internacional suficiente para sostener destinos premium, pero obliga a competir por visibilidad y conversión, no solo por ubicación.",
        asOf: "Año 2025",
        sourceTitle: CHILE_RECEPTIVE_TOURISM_SOURCE.title,
        sourceUrl: CHILE_RECEPTIVE_TOURISM_SOURCE.url
      },
      {
        label: "Pernoctaciones regionales",
        value: `${context.pernoctations} en ${context.asOf}`,
        note: "Ese volumen confirma escala real de demanda en la región y permite defender que el caso compite por capturar una fracción del flujo existente, no por crear demanda desde cero.",
        asOf: context.asOf,
        sourceTitle: context.regionSource.title,
        sourceUrl: context.regionSource.url
      }
    ],
    economic: [
      {
        label: "ADR regional",
        value: `${context.adr} en ${context.asOf}`,
        note: "Ese ADR muestra el rango de precio ya validado por el mercado y funciona como referencia para defender o cuestionar la meta tarifaria del proyecto.",
        asOf: context.asOf,
        sourceTitle: context.regionSource.title,
        sourceUrl: context.regionSource.url
      },
      {
        label: "Ocupación regional",
        value: `${context.occupancy} en ${context.asOf}`,
        note: "Esa ocupación indica si el destino ya opera tensionado o si todavía hay holgura; cambia por completo la estrategia de entrada, mezcla de canales y ritmo de captura.",
        asOf: context.asOf,
        sourceTitle: context.regionSource.title,
        sourceUrl: context.regionSource.url
      }
    ],
    political: [
      {
        label: "Crecimiento del turismo receptivo",
        value: "+14,6% en 2025 vs 2024",
        note: "Ese crecimiento mejora la tesis de demanda para destinos expuestos a flujo internacional y reduce el riesgo de depender solo del mercado doméstico.",
        asOf: "Año 2025",
        sourceTitle: CHILE_RECEPTIVE_TOURISM_SOURCE.title,
        sourceUrl: CHILE_RECEPTIVE_TOURISM_SOURCE.url
      }
    ],
    technological: [
      {
        label: "Escala de la demanda turística",
        value: "6.004.567 llegadas internacionales en 2025",
        note: "Con esa escala de demanda, la captura no depende de presencia física sino de distribución digital, reputación y capacidad de conversión directa.",
        asOf: "Año 2025",
        sourceTitle: CHILE_RECEPTIVE_TOURISM_SOURCE.title,
        sourceUrl: CHILE_RECEPTIVE_TOURISM_SOURCE.url
      }
    ],
    ecological: [
      {
        label: "Volumen turístico regional",
        value: `${context.pernoctations} pernoctaciones en ${context.asOf}`,
        note: "Ese flujo aumenta la presión sobre agua, energía y capacidad de carga, por lo que sostenibilidad deja de ser discurso y pasa a ser condición operativa y reputacional.",
        asOf: context.asOf,
        sourceTitle: context.regionSource.title,
        sourceUrl: context.regionSource.url
      }
    ],
    legal: [
      {
        label: "Actividad regional de alojamiento",
        value: `${context.pernoctations} pernoctaciones en ${context.asOf}`,
        note: "Ese nivel de actividad vuelve más exigente el estándar de cumplimiento, fiscalización y formalidad operativa para un hotel que quiera competir en segmento alto.",
        asOf: context.asOf,
        sourceTitle: context.regionSource.title,
        sourceUrl: context.regionSource.url
      }
    ]
  };
}

function buildDestinationSources(destinationId: HotelDestinationId, extraSources: ResearchSource[]): ResearchSource[] {
  return [CHILE_RECEPTIVE_TOURISM_SOURCE, DESTINATION_NUMERIC_CONTEXT[destinationId].regionSource, ...extraSources].reduce<
    ResearchSource[]
  >((collected, source) => {
    if (!source.url || collected.some((item) => item.url === source.url)) return collected;
    collected.push(source);
    return collected;
  }, []);
}

export const HOTEL_DESTINATION_PROFILES: Record<HotelDestinationId, HotelDestinationProfile> = {
  "patagonia-chilena": {
    id: "patagonia-chilena",
    label: "Patagonia Chilena",
    region: "Magallanes y Antartica Chilena",
    country: "Chile",
    destinationDiagnosis:
      "La Patagonia Chilena compite por naturaleza extrema, expediciones y exclusividad. La demanda premium es altamente estacional, sensible al acceso logistico y dependiente de una operacion impecable, pero soporta ADR altos cuando el producto integra experiencia, guiado y servicio.",
    attractions: [
      "Parque Nacional Torres del Paine",
      "Navegacion a glaciares y fiordos",
      "Senderismo premium y observacion de fauna",
      "Experiencias gastronomicas y de wellness de destino"
    ],
    touristStats: buildOfficialTouristStats("patagonia-chilena"),
    marketRateReference: {
      single: 430,
      double: 560,
      triple: 690,
      suite: 920
    },
    septeFactors: [
      {
        id: "social",
        label: "Social",
        analysis:
          "El destino atrae viajeros de alto gasto que priorizan experiencia, paisaje y servicio personalizado por sobre la compra transaccional.",
        implication: "El hotel debe operar con estandar alto de anfitrionia y relato de destino.",
        evidence: buildOfficialSepteEvidence("patagonia-chilena").social ?? []
      },
      {
        id: "economic",
        label: "Economico",
        analysis:
          "La demanda premium resiste tarifas elevadas, pero el costo logistico, de abastecimiento y personal presiona la rentabilidad.",
        implication: "Se requiere una estrategia de revenue management con control fino de costos.",
        evidence: buildOfficialSepteEvidence("patagonia-chilena").economic ?? []
      },
      {
        id: "political",
        label: "Politico",
        analysis:
          "La promocion publica del turismo de naturaleza favorece el destino, aunque la conectividad y la gestion territorial inciden en la experiencia.",
        implication: "El hotel debe coordinarse con actores locales y anticipar restricciones operativas.",
        evidence: buildOfficialSepteEvidence("patagonia-chilena").political ?? []
      },
      {
        id: "technological",
        label: "Tecnologico",
        analysis:
          "La reserva digital y el contenido visual son claves para captar demanda internacional antes de la llegada al destino.",
        implication: "La venta directa necesita motor de reservas, CRM y marketing de contenido.",
        evidence: buildOfficialSepteEvidence("patagonia-chilena").technological ?? []
      },
      {
        id: "ecological",
        label: "Ecologico",
        analysis:
          "La fragilidad ambiental y el valor paisajistico obligan a una operacion responsable en residuos, energia y excursionismo.",
        implication: "La sostenibilidad es parte del producto y del argumento comercial.",
        evidence: buildOfficialSepteEvidence("patagonia-chilena").ecological ?? []
      },
      {
        id: "legal",
        label: "Legal",
        analysis:
          "El marco de habilitacion, seguridad, transporte y excursionismo exige cumplimiento riguroso y gestion de proveedores.",
        implication: "La propuesta debe considerar permisos, seguros y protocolos desde el diseno.",
        evidence: buildOfficialSepteEvidence("patagonia-chilena").legal ?? []
      }
    ],
    competitionSummary:
      "El set competitivo patagonico se mueve en torno a hoteles de experiencia, con excursionismo, gastronomia, wellness y fuerte venta paquetizada. El desafio no es solo igualar instalaciones, sino competir en servicio, guiado y narrativa de destino.",
    competitors: [
      {
        name: "Tierra Patagonia",
        area: "Torres del Paine",
        positioning: "Luxury all-inclusive experiential lodge",
        services: ["Excursiones guiadas", "Spa", "Gastronomia de destino", "Traslados"],
        facilities: ["Habitaciones con vista", "Spa", "Lounge", "Operacion all-inclusive"],
        rates: { single: 650, double: 780, triple: 980, suite: 1350 },
        note: "Compite por experiencia integral y tarifa paquete."
      },
      {
        name: "Awasi Patagonia",
        area: "Torres del Paine",
        positioning: "Ultra luxury con servicio altamente personalizado",
        services: ["Guia privado", "Vehiculo privado", "All-inclusive", "Concierge"],
        facilities: ["Villas privadas", "Restaurante", "Lounge premium", "Operacion boutique"],
        rates: { single: 980, double: 1180, triple: 1460, suite: 1900 },
        note: "Referencia para posicionamiento muy alto y personalizacion."
      },
      {
        name: "The Singular Patagonia",
        area: "Puerto Bories / Puerto Natales",
        positioning: "Luxury heritage hotel",
        services: ["Excursiones", "Spa", "Restaurante", "Eventos"],
        facilities: ["Suites amplias", "Spa", "Bar", "Instalaciones historicas"],
        rates: { single: 520, double: 640, triple: 780, suite: 1080 },
        note: "Compite por arquitectura, gastronomia y experiencia patrimonial."
      }
    ],
    sources: buildDestinationSources("patagonia-chilena", [
      {
        title: "Torres del Paine y Patagonia en Chile Travel",
        url: "https://chile.travel/",
        note: "Referencia de atractivos y posicionamiento del destino patagonico."
      },
      {
        title: "Oferta hotelera de Tierra Patagonia",
        url: "https://tierrahotels.com/",
        note: "Base referencial para servicios premium y estructura de producto."
      },
      {
        title: "Oferta hotelera de Awasi Patagonia",
        url: "https://awasi.com/",
        note: "Base referencial para servicio ultra premium y venta experiencial."
      }
    ])
  },
  "puerto-varas": {
    id: "puerto-varas",
    label: "Puerto Varas",
    region: "Los Lagos",
    country: "Chile",
    destinationDiagnosis:
      "Puerto Varas combina turismo lacustre, naturaleza, gastronomia y eventos, con una demanda mas equilibrada entre ocio, escapadas premium y corporativo. El destino admite hoteles de alto estandar, pero compite por vista, experiencia, spa y facilidad de acceso.",
    attractions: [
      "Lago Llanquihue y costanera",
      "Saltos del Petrohue",
      "Volcan Osorno",
      "Tours a Frutillar, Cochamo y Ruta de los Parques"
    ],
    touristStats: buildOfficialTouristStats("puerto-varas"),
    marketRateReference: {
      single: 220,
      double: 290,
      triple: 360,
      suite: 470
    },
    septeFactors: [
      {
        id: "social",
        label: "Social",
        analysis:
          "El destino atrae parejas, familias y viajeros de escapada premium que combinan paisaje, gastronomia y descanso.",
        implication: "El producto debe equilibrar experiencia, comodidad y consumo complementario.",
        evidence: buildOfficialSepteEvidence("puerto-varas").social ?? []
      },
      {
        id: "economic",
        label: "Economico",
        analysis:
          "Puerto Varas tiene demanda estable, pero enfrenta sensibilidad tarifaria mayor que destinos ultra exclusivos.",
        implication: "El ADR debe defenderse con valor agregado y buen mix de canales.",
        evidence: buildOfficialSepteEvidence("puerto-varas").economic ?? []
      },
      {
        id: "political",
        label: "Politico",
        analysis:
          "La promocion regional y la infraestructura turistica consolidada apoyan el destino, aunque hay presion por conectividad y temporada.",
        implication: "El hotel puede apoyarse en alianzas locales y calendario de eventos.",
        evidence: buildOfficialSepteEvidence("puerto-varas").political ?? []
      },
      {
        id: "technological",
        label: "Tecnologico",
        analysis:
          "La comparacion digital de tarifas y reputacion online influye fuertemente en la compra.",
        implication: "La gestion de reputacion y venta directa es critica.",
        evidence: buildOfficialSepteEvidence("puerto-varas").technological ?? []
      },
      {
        id: "ecological",
        label: "Ecologico",
        analysis:
          "El entorno lacustre y volcanico hace que la sostenibilidad y el paisajismo tengan peso comercial real.",
        implication: "La propuesta debe mostrar responsabilidad ambiental y diseno coherente con el paisaje.",
        evidence: buildOfficialSepteEvidence("puerto-varas").ecological ?? []
      },
      {
        id: "legal",
        label: "Legal",
        analysis:
          "Las exigencias de seguridad, alimentacion, piscinas, spa y eventos requieren cumplimiento operativo sostenido.",
        implication: "La apertura necesita una hoja de ruta regulatoria clara.",
        evidence: buildOfficialSepteEvidence("puerto-varas").legal ?? []
      }
    ],
    competitionSummary:
      "El lujo en Puerto Varas se sostiene en vista, gastronomia, wellness, arquitectura y servicio. La competencia mezcla hoteles de ciudad y de experiencia, con espacio para captar escapadas premium y corporativo de alto valor.",
    competitors: [
      {
        name: "Hotel AWA",
        area: "Ruta Puerto Varas / Ensenada",
        positioning: "Luxury lakeside boutique hotel",
        services: ["Spa", "Experiencias outdoor", "Gastronomia", "Concierge"],
        facilities: ["Suites con vista", "Spa", "Restaurante", "Acceso lacustre"],
        rates: { single: 260, double: 340, triple: 430, suite: 590 },
        note: "Compite por exclusividad, paisaje y servicio boutique."
      },
      {
        name: "Hotel Cumbres Puerto Varas",
        area: "Puerto Varas",
        positioning: "Upper-upscale con foco urbano y vista al lago",
        services: ["Restaurante", "Spa", "Salones", "Piscina"],
        facilities: ["Habitaciones premium", "Spa", "Piscina", "Salas de eventos"],
        rates: { single: 210, double: 280, triple: 350, suite: 450 },
        note: "Referencia fuerte en ubicacion, eventos y leisure."
      },
      {
        name: "Wyndham Pettra Puerto Varas",
        area: "Puerto Varas",
        positioning: "Hotel premium de ciudad y eventos",
        services: ["Eventos", "Restaurante", "Piscina", "Wellness"],
        facilities: ["Habitaciones ejecutivas", "Salones", "Restaurante", "Areas comunes amplias"],
        rates: { single: 190, double: 255, triple: 320, suite: 420 },
        note: "Compite por segmento corporativo y reuniones."
      }
    ],
    sources: buildDestinationSources("puerto-varas", [
      {
        title: "Hotel AWA",
        url: "https://hotelawa.cl/",
        note: "Base referencial de servicios premium y producto de lujo en Puerto Varas."
      },
      {
        title: "Hotel Cumbres Puerto Varas",
        url: "https://www.cumbrespuertovaras.cl/",
        note: "Referencia de oferta premium urbana y de bienestar."
      }
    ])
  },
  villarrica: {
    id: "villarrica",
    label: "Villarrica",
    region: "La Araucania",
    country: "Chile",
    destinationDiagnosis:
      "La zona Villarrica-Pucon es un destino turistico consolidado con combinacion de ocio premium, bienestar, aventura y segunda vivienda. Su demanda es estacional, pero con posibilidades de escapadas de fin de semana, eventos y turismo internacional de naturaleza.",
    attractions: [
      "Lago Villarrica",
      "Volcan Villarrica",
      "Termas y wellness",
      "Aventura outdoor y parques nacionales"
    ],
    touristStats: buildOfficialTouristStats("villarrica"),
    marketRateReference: {
      single: 200,
      double: 265,
      triple: 335,
      suite: 455
    },
    septeFactors: [
      {
        id: "social",
        label: "Social",
        analysis:
          "El destino combina turismo familiar, parejas y viajeros de experiencia, con valoracion alta por entorno, bienestar y actividades.",
        implication: "El hotel debe vender paquetes y experiencia, no solo alojamiento.",
        evidence: buildOfficialSepteEvidence("villarrica").social ?? []
      },
      {
        id: "economic",
        label: "Economico",
        analysis:
          "El mercado admite tarifas premium moderadas, pero la estacionalidad obliga a trabajar ocupacion fuera de peak.",
        implication: "La estrategia comercial debe contemplar temporada alta y hombro.",
        evidence: buildOfficialSepteEvidence("villarrica").economic ?? []
      },
      {
        id: "political",
        label: "Politico",
        analysis:
          "La gestion del destino y la seguridad regional influyen en la percepcion de demanda.",
        implication: "La comunicacion del hotel debe reforzar confianza y experiencia segura.",
        evidence: buildOfficialSepteEvidence("villarrica").political ?? []
      },
      {
        id: "technological",
        label: "Tecnologico",
        analysis:
          "La conversion digital y la reputacion online pesan mucho en el proceso de reserva.",
        implication: "La venta directa y la gestion de reviews son fundamentales.",
        evidence: buildOfficialSepteEvidence("villarrica").technological ?? []
      },
      {
        id: "ecological",
        label: "Ecologico",
        analysis:
          "El activo principal es el paisaje natural y el acceso a aventura, por lo que la sostenibilidad suma valor.",
        implication: "La operacion debe ser consistente con el relato de naturaleza.",
        evidence: buildOfficialSepteEvidence("villarrica").ecological ?? []
      },
      {
        id: "legal",
        label: "Legal",
        analysis:
          "Spa, termas, actividades y transporte requieren protocolos y gestion normativa consistente.",
        implication: "La propuesta debe integrar operadores y cumplimiento desde el inicio.",
        evidence: buildOfficialSepteEvidence("villarrica").legal ?? []
      }
    ],
    competitionSummary:
      "La competencia premium en la zona se apoya en paisaje, termas, bienestar, experiencias outdoor y exclusividad. El diferencial debe combinar producto, programa y distribucion.",
    competitors: [
      {
        name: "Vira Vira",
        area: "Pucon / Villarrica",
        positioning: "Luxury hacienda hotel",
        services: ["Excursiones", "Gastronomia", "Spa", "Experiencias privadas"],
        facilities: ["Suites", "Villas", "Restaurante", "Entorno natural"],
        rates: { single: 430, double: 560, triple: 690, suite: 880 },
        note: "Referencia en experiencia de lujo y naturaleza."
      },
      {
        name: "andBeyond Vira Vira",
        area: "Pucon / Villarrica",
        positioning: "Ultra premium experiential stay",
        services: ["Outdoor de lujo", "Concierge", "Experiencias privadas", "Gastronomia"],
        facilities: ["Suites", "Villas", "Operacion boutique", "Paisajismo"],
        rates: { single: 460, double: 590, triple: 720, suite: 930 },
        note: "Compite por experiencia y personalizacion."
      },
      {
        name: "Park Lake Luxury Hotel",
        area: "Pucon / Villarrica",
        positioning: "Upper-upscale lakeside resort",
        services: ["Spa", "Restaurante", "Piscina", "Eventos"],
        facilities: ["Habitaciones premium", "Spa", "Piscina", "Vista lago"],
        rates: { single: 190, double: 255, triple: 320, suite: 420 },
        note: "Referencia de escala, leisure y eventos."
      }
    ],
    sources: buildDestinationSources("villarrica", [
      {
        title: "Chile Travel - Araucania Lacustre",
        url: "https://chile.travel/",
        note: "Referencia general de atractivos y posicionamiento de la zona."
      },
      {
        title: "Vira Vira",
        url: "https://www.viravira.com/",
        note: "Base referencial de hoteleria de experiencia premium."
      },
      {
        title: "Park Lake Luxury Hotel",
        url: "https://www.parklake.cl/",
        note: "Referencia de resort premium con foco leisure."
      }
    ])
  },
  "san-pedro-de-atacama": {
    id: "san-pedro-de-atacama",
    label: "San Pedro de Atacama",
    region: "Antofagasta",
    country: "Chile",
    destinationDiagnosis:
      "San Pedro de Atacama es uno de los destinos iconicos de Chile para turismo internacional premium. La demanda se sostiene por paisaje unico, astronomia, excursionismo y experiencias all-inclusive, lo que permite ADR altos y fuerte valorizacion del servicio.",
    attractions: [
      "Valle de la Luna",
      "Geysers del Tatio",
      "Laguna Cejar",
      "Termas de Puritama",
      "Astroturismo y salares"
    ],
    touristStats: buildOfficialTouristStats("san-pedro-de-atacama"),
    marketRateReference: {
      single: 310,
      double: 420,
      triple: 530,
      suite: 690
    },
    septeFactors: [
      {
        id: "social",
        label: "Social",
        analysis:
          "La demanda busca experiencias memorables, excursionismo, astronomia y descanso premium en un entorno remoto.",
        implication: "El hotel debe vender experiencia curada y no solo tarifa de habitacion.",
        evidence: buildOfficialSepteEvidence("san-pedro-de-atacama").social ?? []
      },
      {
        id: "economic",
        label: "Economico",
        analysis:
          "El destino soporta ADR alto, aunque la dependencia de intermediacion y el costo operativo pueden erosionar margen.",
        implication: "La mezcla de canales debe migrar hacia venta directa y paquetes rentables.",
        evidence: buildOfficialSepteEvidence("san-pedro-de-atacama").economic ?? []
      },
      {
        id: "political",
        label: "Politico",
        analysis:
          "La promocion internacional de Chile favorece el destino, pero su operacion depende de conectividad, acceso y coordinacion local.",
        implication: "La planificacion comercial debe alinearse con vuelos, operadores y temporada.",
        evidence: buildOfficialSepteEvidence("san-pedro-de-atacama").political ?? []
      },
      {
        id: "technological",
        label: "Tecnologico",
        analysis:
          "La decision de compra se concentra en plataformas digitales, reputacion online y contenido inspiracional.",
        implication: "El canal directo necesita una propuesta visual fuerte y conversion alta.",
        evidence: buildOfficialSepteEvidence("san-pedro-de-atacama").technological ?? []
      },
      {
        id: "ecological",
        label: "Ecologico",
        analysis:
          "El desierto y sus ecosistemas demandan uso responsable de agua, energia y excursionismo sostenible.",
        implication: "La sostenibilidad debe estar integrada al modelo de operacion y marca.",
        evidence: buildOfficialSepteEvidence("san-pedro-de-atacama").ecological ?? []
      },
      {
        id: "legal",
        label: "Legal",
        analysis:
          "La hoteleria premium con spa, gastronomia y tours asociados necesita protocolos claros, contratos y cumplimiento normativo.",
        implication: "La apertura requiere una matriz de permisos y partners formalizada.",
        evidence: buildOfficialSepteEvidence("san-pedro-de-atacama").legal ?? []
      }
    ],
    competitionSummary:
      "San Pedro compite con lodges y hoteles de experiencia que venden paquete, excursionismo, gastronomia y wellness. La referencia competitiva esta dada por la combinacion de tarifa, programa incluido y nivel de personalizacion.",
    competitors: [
      {
        name: "Tierra Atacama",
        area: "San Pedro de Atacama",
        positioning: "Luxury all-inclusive experience hotel",
        services: ["Excursiones", "Spa", "Gastronomia", "Traslados"],
        facilities: ["Suites premium", "Spa", "Piscina", "Lounge"],
        rates: { single: 420, double: 560, triple: 690, suite: 920 },
        note: "Compite por experiencia all-inclusive y nivel de servicio."
      },
      {
        name: "Awasi Atacama",
        area: "San Pedro de Atacama",
        positioning: "Ultra luxury con excursion privada",
        services: ["Guia privado", "Vehiculo 4x4", "All-inclusive", "Restaurante"],
        facilities: ["Suites redondas", "Operacion boutique", "Restaurante", "Lounge"],
        rates: { single: 1030, double: 700, triple: 900, suite: 1400 },
        note: "Benchmark de lujo muy alto y personalizacion extrema."
      },
      {
        name: "Hotel Cumbres San Pedro",
        area: "San Pedro de Atacama",
        positioning: "Upper-upscale con wellness y excursionismo",
        services: ["Spa", "Piscinas", "Restaurante", "Excursiones"],
        facilities: ["Habitaciones premium", "Spa", "Piscinas", "Areas comunes amplias"],
        rates: { single: 280, double: 340, triple: 420, suite: 560 },
        note: "Referencia importante para precio y amenities premium."
      }
    ],
    sources: buildDestinationSources("san-pedro-de-atacama", [
      {
        title: "Chile Travel - San Pedro de Atacama",
        url: "https://chile.travel/destinos/san-pedro-de-atacama/",
        note: "Referencia de atractivos y drivers de demanda del destino."
      },
      {
        title: "Hotel Cumbres San Pedro",
        url: "https://www.cumbressanpedro.com/en",
        note: "Base referencial de tarifas y propuesta de valor premium."
      }
    ])
  },
  papudo: {
    id: "papudo",
    label: "Papudo",
    region: "Valparaiso",
    country: "Chile",
    destinationDiagnosis:
      "Papudo y su entorno costero operan mejor como destino de escapada premium de cercania, con demanda de fines de semana, verano y segunda vivienda. El gran reto es construir una propuesta de lujo consistente en un mercado con oferta premium menos profunda que otros destinos iconicos.",
    attractions: [
      "Playas y borde costero",
      "Marinas y actividades nauticas",
      "Escapadas gastronomicas y wellness",
      "Conectividad con Zapallar, Maitencillo y la costa norte de Valparaiso"
    ],
    touristStats: buildOfficialTouristStats("papudo"),
    marketRateReference: {
      single: 180,
      double: 240,
      triple: 310,
      suite: 410
    },
    septeFactors: [
      {
        id: "social",
        label: "Social",
        analysis:
          "La demanda se compone de escapadas, familias y parejas que buscan relajacion, vista y servicio por estadias cortas.",
        implication: "La experiencia debe optimizar estadias breves y consumo complementario.",
        evidence: buildOfficialSepteEvidence("papudo").social ?? []
      },
      {
        id: "economic",
        label: "Economico",
        analysis:
          "El mercado premium costero soporta ADR medio-alto, pero con comparacion intensa entre propiedades y arriendos de segunda vivienda.",
        implication: "La propuesta debe diferenciarse del alojamiento residencial.",
        evidence: buildOfficialSepteEvidence("papudo").economic ?? []
      },
      {
        id: "political",
        label: "Politico",
        analysis:
          "La gestion costera, normas urbanas y desarrollo inmobiliario inciden en el ritmo de crecimiento de la oferta.",
        implication: "El hotel necesita una lectura territorial y regulatoria detallada.",
        evidence: buildOfficialSepteEvidence("papudo").political ?? []
      },
      {
        id: "technological",
        label: "Tecnologico",
        analysis:
          "La compra se apoya en reputacion, comparadores y contenido visual de alta calidad.",
        implication: "La distribucion online y la marca son decisivas.",
        evidence: buildOfficialSepteEvidence("papudo").technological ?? []
      },
      {
        id: "ecological",
        label: "Ecologico",
        analysis:
          "El valor del destino depende del borde costero, paisaje y uso responsable de recursos.",
        implication: "La sostenibilidad y el diseno son atributos comerciales visibles.",
        evidence: buildOfficialSepteEvidence("papudo").ecological ?? []
      },
      {
        id: "legal",
        label: "Legal",
        analysis:
          "La operacion hotelera costera puede enfrentar exigencias asociadas a urbanismo, seguridad, alimentos y actividades complementarias.",
        implication: "La hoja de ruta legal debe trabajarse desde la fase de proyecto.",
        evidence: buildOfficialSepteEvidence("papudo").legal ?? []
      }
    ],
    competitionSummary:
      "En Papudo el benchmark de lujo debe ampliarse al corredor costero premium. La oportunidad esta en diferenciarse por servicio, wellness, gastronomia y experiencia de escapada, mas que por volumen.",
    competitors: [
      {
        name: "Hotel Casa Zapallar",
        area: "Corredor costero norte",
        positioning: "Boutique premium coastal stay",
        services: ["Desayuno premium", "Concierge", "Experiencias locales", "Wellness ligero"],
        facilities: ["Suites", "Terrazas", "Areas comunes boutique", "Vista"],
        rates: { single: 190, double: 250, triple: 320, suite: 430 },
        note: "Referencia boutique del corredor costero premium."
      },
      {
        name: "Hotel Mae",
        area: "Zapallar / Cachagua",
        positioning: "Lifestyle coastal premium",
        services: ["Wellness", "Piscina", "Gastronomia", "Escapadas"],
        facilities: ["Habitaciones premium", "Piscina", "Terrazas", "Diseno contemporaneo"],
        rates: { single: 210, double: 275, triple: 340, suite: 450 },
        note: "Referencia de escapada premium de diseno."
      },
      {
        name: "Benchmark premium costa norte",
        area: "Zapallar / Maitencillo / Papudo",
        positioning: "Conjunto competitivo ampliado",
        services: ["Spa", "Vista mar", "Gastronomia", "Paquetes fin de semana"],
        facilities: ["Suites", "Piscina", "Restaurant", "Wellness"],
        rates: { single: 175, double: 235, triple: 300, suite: 405 },
        note: "Usar como referencia cuando la oferta 5 estrellas estricta sea limitada."
      }
    ],
    sources: buildDestinationSources("papudo", [
      {
        title: "Chile Travel - Costa de Chile",
        url: "https://chile.travel/",
        note: "Referencia general de atractivos y turismo costero."
      },
      {
        title: "SERNATUR Region de Valparaiso",
        url: "https://www.sernatur.cl/",
        note: "Referencia institucional del destino y su oferta turistica."
      }
    ])
  }
};

const HOTEL_REFERENCE_METADATA: Record<
  string,
  {
    hotelType: string;
    stars: number;
    differentiationIdeas: string[];
  }
> = {
  "patagonia-chilena:Tierra Patagonia": {
    hotelType: "Luxury Lodge",
    stars: 5,
    differentiationIdeas: [
      "Diseñar un programa signature de bienestar y recuperación post excursión.",
      "Usar una narrativa de expedición premium sin depender de una tarifa puramente paquetizada.",
      "Crear una experiencia gastronómica de terroir patagónico con venta directa de estadías temáticas."
    ]
  },
  "patagonia-chilena:Awasi Patagonia": {
    hotelType: "Ultra Luxury Lodge",
    stars: 5,
    differentiationIdeas: [
      "Competir con un lujo más accesible pero igual de curado en servicio.",
      "Ofrecer experiencias privadas escalables sin replicar el costo extremo del benchmark.",
      "Potenciar suites y concierge como capa premium para defender ADR."
    ]
  },
  "patagonia-chilena:The Singular Patagonia": {
    hotelType: "Heritage Luxury Hotel",
    stars: 5,
    differentiationIdeas: [
      "Reforzar arquitectura o storytelling del hotel como parte del producto.",
      "Combinar patrimonio, wellness y excursiones para no quedar solo en hotelería clásica.",
      "Abrir una línea de eventos boutique y escapadas gastronómicas de alto valor."
    ]
  },
  "puerto-varas:Hotel AWA": {
    hotelType: "Luxury Boutique Hotel",
    stars: 5,
    differentiationIdeas: [
      "Tomar la vista y el diseño como base, pero sumar un programa de experiencias lacustres propio.",
      "Crear una propuesta fuerte de escapadas románticas y wellness corto.",
      "Subir venta directa con paquetes de gastronomía, spa y excursión."
    ]
  },
  "puerto-varas:Hotel Cumbres Puerto Varas": {
    hotelType: "Hotel & Spa de ciudad-destino",
    stars: 5,
    differentiationIdeas: [
      "Diferenciarse con un servicio más curado y menos masivo.",
      "Usar gastronomía local y experiencias al aire libre como ventaja frente al competidor urbano.",
      "Construir un producto premium para small groups y corporate selectivo."
    ]
  },
  "puerto-varas:Wyndham Pettra Puerto Varas": {
    hotelType: "Hotel de cadena premium",
    stars: 5,
    differentiationIdeas: [
      "Competir con una identidad local más marcada que la de una cadena.",
      "Potenciar suites, eventos boutique y programas de descanso de fin de semana.",
      "Hacer revenue diferenciado entre ocio premium y corporativo."
    ]
  },
  "villarrica:Vira Vira": {
    hotelType: "Luxury Hacienda Hotel",
    stars: 5,
    differentiationIdeas: [
      "Desarrollar una propuesta fuerte de naturaleza activa y descanso de lujo.",
      "Construir un servicio premium con menos rigidez y más flexibilidad comercial.",
      "Usar experiencias inmersivas de destino como motor de tarifa alta."
    ]
  },
  "villarrica:andBeyond Vira Vira": {
    hotelType: "Luxury Experience Lodge",
    stars: 5,
    differentiationIdeas: [
      "Posicionar una experiencia premium más accesible sin perder sofisticación.",
      "Introducir paquetes temáticos ligados a wellness, gastronomía y lago/volcán.",
      "Diferenciar la venta directa con beneficios y actividades exclusivas."
    ]
  },
  "villarrica:Park Lake Luxury Hotel": {
    hotelType: "Resort & Spa",
    stars: 5,
    differentiationIdeas: [
      "Sumar una propuesta de diseño y experiencia más aspiracional.",
      "Separar claramente la oferta familiar de la premium para sostener mejor ADR.",
      "Crear programas de escapada de lujo alrededor del lago y el volcán."
    ]
  },
  "san-pedro-de-atacama:Tierra Atacama": {
    hotelType: "Luxury All-Inclusive Lodge",
    stars: 5,
    differentiationIdeas: [
      "Diseñar un concepto premium que combine astronomía, wellness y excursiones curadas.",
      "Competir en narrativa y personalización, no solo en cantidad de inclusiones.",
      "Defender tarifa con paquetes propios y mayor peso de canal directo."
    ]
  },
  "san-pedro-de-atacama:Awasi Atacama": {
    hotelType: "Ultra Luxury Boutique Lodge",
    stars: 5,
    differentiationIdeas: [
      "Crear una capa premium opcional con excursión privada sin replicar el modelo completo de ultra lujo.",
      "Diferenciarse con suites signature y experiencias nocturnas de alto valor.",
      "Usar gastronomía y diseño local como argumento para sostener un ADR alto."
    ]
  },
  "san-pedro-de-atacama:Hotel Cumbres San Pedro": {
    hotelType: "Resort de lujo de experiencias",
    stars: 5,
    differentiationIdeas: [
      "Construir una experiencia más boutique y menos estándar de resort.",
      "Potenciar observación astronómica y servicio de concierge como sello.",
      "Aumentar captación directa con paquetes y upgrades por estadía."
    ]
  },
  "papudo:Hotel Casa Zapallar": {
    hotelType: "Hotel Boutique Costero",
    stars: 4,
    differentiationIdeas: [
      "Escalar el producto hacia lujo costero con diseño, privacidad y gastronomía.",
      "Convertir el descanso de playa en escapada premium con wellness y experiencias.",
      "Construir una propuesta más fuerte para fines de semana de alto ticket."
    ]
  },
  "papudo:Hotel Mae": {
    hotelType: "Hotel Boutique Lifestyle",
    stars: 4,
    differentiationIdeas: [
      "Diferenciar con una narrativa más exclusiva y mayor personalización.",
      "Agregar experiencias de costa, sunset y gastronomía como upsell.",
      "Desarrollar una identidad visual y comercial más premium que lifestyle genérico."
    ]
  },
  "papudo:Benchmark premium costa norte": {
    hotelType: "Resort costero premium",
    stars: 5,
    differentiationIdeas: [
      "Usar la costa como escenario de experiencias premium y no solo alojamiento.",
      "Definir un servicio insignia que justifique una tarifa por encima del benchmark base.",
      "Separar propuesta de descanso, eventos boutique y gastronomía para ganar margen."
    ]
  }
};

export const HOTEL_REFERENCE_CATALOG: HotelReferenceHotel[] = Object.values(HOTEL_DESTINATION_PROFILES).flatMap((profile) =>
  profile.competitors.map((competitor, index) => {
    const metadata =
      HOTEL_REFERENCE_METADATA[`${profile.id}:${competitor.name}`] ??
      HOTEL_REFERENCE_METADATA[`${profile.id}:${profile.competitors[0]?.name ?? ""}`] ?? {
        hotelType: "Hotel premium",
        stars: 5,
        differentiationIdeas: [
          "Construir un relato de marca más claro que el benchmark.",
          "Usar venta directa y paquetes propios para proteger margen.",
          "Definir un atributo signature que el mercado recuerde con facilidad."
        ]
      };

    return {
      id: `${profile.id}-${index + 1}`,
      destination: profile.id,
      name: competitor.name,
      country: profile.country,
      region: profile.region,
      municipality: profile.label,
      area: competitor.area,
      hotelType: metadata.hotelType,
      stars: metadata.stars,
      positioning: competitor.positioning,
      services: competitor.services,
      facilities: competitor.facilities,
      rates: competitor.rates,
      rateCurrency: "USD",
      rateBasis: "Referencia interna por habitacion/noche usada como fallback académico; validar contra motor de reservas antes de decidir.",
      rateAsOf: "Referencia base del modulo",
      rateConfidence: "estimated",
      rateSourceTitle: profile.sources[1]?.title ?? profile.sources[0]?.title,
      rateSourceUrl: profile.sources[1]?.url ?? profile.sources[0]?.url,
      rateNote:
        "Tarifa estimada del catálogo base. No debe tratarse como tarifa publicada exacta del hotel; úsala solo si la búsqueda no consigue una fuente verificable.",
      note: competitor.note,
      differentiationIdeas: metadata.differentiationIdeas,
      sourceTitle: profile.sources[1]?.title ?? profile.sources[0]?.title,
      sourceUrl: profile.sources[1]?.url ?? profile.sources[0]?.url
    };
  })
);

export function inferHotelDestinationFromSearch(input: Pick<HotelBenchmarkSearchInput, "region" | "municipality">) {
  const normalizedRegion = input.region.trim().toLowerCase();
  const normalizedMunicipality = input.municipality.trim().toLowerCase();

  const direct = Object.values(HOTEL_DESTINATION_PROFILES).find((profile) => {
    const profileLabel = profile.label.toLowerCase();
    const profileRegion = profile.region.toLowerCase();

    return (
      (!!normalizedMunicipality && (normalizedMunicipality.includes(profileLabel) || profileLabel.includes(normalizedMunicipality))) ||
      (!!normalizedRegion && (normalizedRegion.includes(profileRegion) || profileRegion.includes(normalizedRegion)))
    );
  });

  return direct?.id ?? "san-pedro-de-atacama";
}

export function buildFallbackBenchmarkReport(input: HotelBenchmarkSearchInput): HotelBenchmarkReport {
  const destinationId = inferHotelDestinationFromSearch(input);
  const profile = HOTEL_DESTINATION_PROFILES[destinationId];
  const region = input.region.trim().toLowerCase();
  const municipality = input.municipality.trim().toLowerCase();
  const hotelType = input.hotelType.trim().toLowerCase();
  const stars = input.stars ?? null;

  const hotels = HOTEL_REFERENCE_CATALOG.filter((hotel) => {
    if (input.country && hotel.country.toLowerCase() !== input.country.trim().toLowerCase()) return false;
    if (region && !hotel.region.toLowerCase().includes(region) && !region.includes(hotel.region.toLowerCase())) return false;
    if (
      municipality &&
      !hotel.municipality.toLowerCase().includes(municipality) &&
      !municipality.includes(hotel.municipality.toLowerCase())
    ) {
      return false;
    }
    if (hotelType && !hotel.hotelType.toLowerCase().includes(hotelType)) return false;
    if (stars && hotel.stars !== stars) return false;

    return true;
  });

  const effectiveHotels = hotels.length ? hotels : HOTEL_REFERENCE_CATALOG.filter((hotel) => hotel.destination === destinationId);
  const primarySource = effectiveHotels[0]?.sourceTitle && effectiveHotels[0]?.sourceUrl
    ? {
        title: effectiveHotels[0].sourceTitle,
        url: effectiveHotels[0].sourceUrl,
        note: "Fuente base del benchmark local usado cuando la búsqueda asistida no completa la información."
      }
    : profile.sources[0];

  return {
    query: input,
    overview: `Se construyó un set comparativo base para ${input.municipality || profile.label} usando referencias locales del módulo. Sirve para revisar tarifas, formato hotelero y líneas de diferenciación antes de armar el caso.`,
    hotels: effectiveHotels.slice(0, 6),
    marketSignals: profile.touristStats.slice(0, 3).map((signal, index) => ({
      ...signal,
      sourceTitle: signal.sourceTitle ?? profile.sources[index]?.title ?? primarySource?.title,
      sourceUrl: signal.sourceUrl ?? profile.sources[index]?.url ?? primarySource?.url
    })),
    commonPatterns: [
      "El benchmark compite más por experiencia y posicionamiento que por precio aislado.",
      "Los atributos más repetidos suelen ser spa, excursiones, gastronomía y vistas.",
      "La venta directa y los paquetes propios aparecen como palancas claras para defender ADR."
    ],
    differentiationIdeas: effectiveHotels[0]?.differentiationIdeas ?? [
      "Definir un atributo signature que no se repita en todos los hoteles del set.",
      "Diseñar paquetes propios para reducir dependencia de intermediarios.",
      "Usar gastronomía, wellness o experiencias como defensa tarifaria real."
    ],
    sources: profile.sources,
    mode: "mock",
    warning: "La búsqueda comparativa no se completó. Se muestra un benchmark base del módulo."
  };
}

export function createDefaultHotelCase(): HotelCaseInput {
  const destination = HOTEL_DESTINATION_PROFILES["san-pedro-de-atacama"];

  return {
    hotelName: "Altos del Desierto Grand Hotel",
    destination: destination.id,
    region: destination.region,
    country: destination.country,
    category: "5 estrellas",
    concept:
      "Hotel de lujo de 190 habitaciones orientado a viajeros premium de ocio y experiencias, con posicionamiento alto, spa, gastronomia local y programa de excursiones curadas.",
    services:
      "Restaurante de autor, spa, piscina climatizada, rooftop de observacion astronomica, concierge de experiencias, shuttle, salas de reuniones, lounge premium y desayuno buffet reforzado.",
    differentiation:
      "Se diferencia por combinar lujo, astronomia, excursionismo curado y una estrategia comercial menos dependiente de tour operadores, con mayor enfasis en canal directo y corporate selectivo.",
    totalRooms: 190,
    roomMix: {
      single: 40,
      double: 96,
      triple: 34,
      suite: 20
    },
    roomRates: {
      ...destination.marketRateReference
    },
    previousAverageRate: 195,
    targetAverageRate: 210,
    guestFactor: 2,
    breakfastPriceCurrent: 13.5,
    breakfastPriceProposed: 17,
    occupancyJanuary: 94,
    occupancyFebruary: 88,
    channels: {
      tourOperators: { ...DEFAULT_HOTEL_CHANNELS.tourOperators },
      onlineAgencies: { ...DEFAULT_HOTEL_CHANNELS.onlineAgencies },
      direct: { ...DEFAULT_HOTEL_CHANNELS.direct },
      corporate: { ...DEFAULT_HOTEL_CHANNELS.corporate }
    }
  };
}

export function buildFallbackStrategicPlan(input: HotelCaseInput): HotelStrategicPlan {
  return {
    objective: `Posicionar ${input.hotelName} como hotel ${input.category} de referencia en ${HOTEL_DESTINATION_PROFILES[input.destination].label} con ADR superior a US$${input.targetAverageRate}.`,
    positioning:
      "Producto premium centrado en experiencia de destino, servicio consistente, wellness y venta directa rentable.",
    goals: [
      "Superar la meta de ADR mensual definida por gerencia.",
      "Reducir la dependencia de tour operadores en favor de venta directa y corporate selectivo.",
      "Incrementar el ingreso complementario por desayuno, bienestar y experiencias.",
      "Defender reputacion premium mediante servicio, contenido y distribucion eficiente."
    ],
    actions: [
      "Diseñar paquetes por temporada alta con valor agregado y no solo descuento tarifario.",
      "Trabajar revenue management por tipo de habitacion para sostener el ADR objetivo.",
      "Impulsar venta directa con beneficios exclusivos, prepagos y upselling de desayuno y experiencias.",
      "Captar corporate premium y small groups en periodos de hombro para suavizar estacionalidad."
    ],
    commercialRationale:
      "La estrategia comercial debe mover la mezcla de canales hacia negocios de mayor margen, defendiendo tarifa con narrativa de valor, experiencia y servicio.",
    pricingRationale:
      "La meta de ADR solo es sostenible si las habitaciones de mayor valor y el canal directo absorben una mayor participacion en la mezcla."
  };
}

export function buildFallbackResearchReport(input: HotelCaseInput): HotelResearchReport {
  const profile = HOTEL_DESTINATION_PROFILES[input.destination];
  const primarySource = profile.sources[0];
  const secondarySource = profile.sources[1] ?? profile.sources[0];
  const destinationSource =
    profile.sources.find((source) => {
      const title = source.title.toLowerCase();
      return !title.includes("subsecretar") && !title.includes("ine");
    }) ?? profile.sources[0];

  return {
    destinationLabel: profile.label,
    destinationDiagnosis: profile.destinationDiagnosis,
    septeFactors: profile.septeFactors.map((factor) => ({
      ...factor,
      evidence: factor.evidence ?? []
    })),
    competitionSummary: profile.competitionSummary,
    competitors: profile.competitors,
    attractions: profile.attractions.map<HotelAttraction>((attraction) => ({
      name: attraction,
      relevance: "Atractivo base del destino usado como referencia cuando no hay extracción grounded disponible.",
      sourceTitle: destinationSource?.title,
      sourceUrl: destinationSource?.url
    })),
    touristStats: profile.touristStats.map((stat, index) => ({
      ...stat,
      sourceTitle: stat.sourceTitle ?? (index === 0 ? primarySource?.title : secondarySource?.title),
      sourceUrl: stat.sourceUrl ?? (index === 0 ? primarySource?.url : secondarySource?.url)
    })),
    marketRateReference: profile.marketRateReference,
    strategicPlan: buildFallbackStrategicPlan(input),
    sources: profile.sources,
    mode: "mock"
  };
}
