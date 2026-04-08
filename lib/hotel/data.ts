import type {
  HotelAttraction,
  HotelCaseInput,
  HotelCompetitor,
  HotelDestinationId,
  HotelResearchReport,
  HotelRoomRates,
  HotelSalesChannelId,
  HotelSepteFactor,
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
    touristStats: [
      {
        label: "Patron de demanda",
        value: "Alta estacionalidad entre diciembre y marzo",
        note: "La temporada alta concentra la mayor parte del flujo internacional de ocio."
      },
      {
        label: "Mercado clave",
        value: "Turismo internacional de naturaleza y aventura",
        note: "El mercado premium valora experiencias guiadas, privacidad y todo incluido."
      },
      {
        label: "Comportamiento tarifario",
        value: "ADR alto con fuerte dependencia estacional",
        note: "La disposicion a pagar crece cuando el hotel vende experiencia y no solo habitacion."
      }
    ],
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
        implication: "El hotel debe operar con estandar alto de anfitrionia y relato de destino."
      },
      {
        id: "economic",
        label: "Economico",
        analysis:
          "La demanda premium resiste tarifas elevadas, pero el costo logistico, de abastecimiento y personal presiona la rentabilidad.",
        implication: "Se requiere una estrategia de revenue management con control fino de costos."
      },
      {
        id: "political",
        label: "Politico",
        analysis:
          "La promocion publica del turismo de naturaleza favorece el destino, aunque la conectividad y la gestion territorial inciden en la experiencia.",
        implication: "El hotel debe coordinarse con actores locales y anticipar restricciones operativas."
      },
      {
        id: "technological",
        label: "Tecnologico",
        analysis:
          "La reserva digital y el contenido visual son claves para captar demanda internacional antes de la llegada al destino.",
        implication: "La venta directa necesita motor de reservas, CRM y marketing de contenido."
      },
      {
        id: "ecological",
        label: "Ecologico",
        analysis:
          "La fragilidad ambiental y el valor paisajistico obligan a una operacion responsable en residuos, energia y excursionismo.",
        implication: "La sostenibilidad es parte del producto y del argumento comercial."
      },
      {
        id: "legal",
        label: "Legal",
        analysis:
          "El marco de habilitacion, seguridad, transporte y excursionismo exige cumplimiento riguroso y gestion de proveedores.",
        implication: "La propuesta debe considerar permisos, seguros y protocolos desde el diseno."
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
    sources: [
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
    ]
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
    touristStats: [
      {
        label: "Llegadas a alojamiento",
        value: "437.327 en primer semestre 2024",
        note: "Dato referencial regional de Los Lagos reportado por INE."
      },
      {
        label: "Ocupacion regional",
        value: "35,3% acumulada primer semestre 2024",
        note: "Senal de estacionalidad y margen de captura fuera de peak."
      },
      {
        label: "ADR regional",
        value: "CLP 74.867 primer semestre 2024",
        note: "Base referencial regional, no exclusiva de lujo."
      }
    ],
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
        implication: "El producto debe equilibrar experiencia, comodidad y consumo complementario."
      },
      {
        id: "economic",
        label: "Economico",
        analysis:
          "Puerto Varas tiene demanda estable, pero enfrenta sensibilidad tarifaria mayor que destinos ultra exclusivos.",
        implication: "El ADR debe defenderse con valor agregado y buen mix de canales."
      },
      {
        id: "political",
        label: "Politico",
        analysis:
          "La promocion regional y la infraestructura turistica consolidada apoyan el destino, aunque hay presion por conectividad y temporada.",
        implication: "El hotel puede apoyarse en alianzas locales y calendario de eventos."
      },
      {
        id: "technological",
        label: "Tecnologico",
        analysis:
          "La comparacion digital de tarifas y reputacion online influye fuertemente en la compra.",
        implication: "La gestion de reputacion y venta directa es critica."
      },
      {
        id: "ecological",
        label: "Ecologico",
        analysis:
          "El entorno lacustre y volcanico hace que la sostenibilidad y el paisajismo tengan peso comercial real.",
        implication: "La propuesta debe mostrar responsabilidad ambiental y diseno coherente con el paisaje."
      },
      {
        id: "legal",
        label: "Legal",
        analysis:
          "Las exigencias de seguridad, alimentacion, piscinas, spa y eventos requieren cumplimiento operativo sostenido.",
        implication: "La apertura necesita una hoja de ruta regulatoria clara."
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
    sources: [
      {
        title: "INE Los Lagos Infografia Turismo 2024",
        url: "https://regiones.ine.gob.cl/los-lagos/prensa/ine-los-lagos-publica-infograf%C3%ADa-de-turismo-segundo-semestre-2024",
        note: "Referencia regional de llegadas, ocupacion y ADR."
      },
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
    ]
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
    touristStats: [
      {
        label: "Patron de demanda",
        value: "Alta temporada verano e invierno",
        note: "El destino trabaja muy bien vacaciones, escapadas y aventura."
      },
      {
        label: "Mercado clave",
        value: "Ocio nacional premium y viajeros internacionales de naturaleza",
        note: "La propuesta debe combinar paisaje, descanso y actividades."
      },
      {
        label: "Sensibilidad comercial",
        value: "Media",
        note: "El cliente paga por experiencia, pero compara intensamente en temporada alta."
      }
    ],
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
        implication: "El hotel debe vender paquetes y experiencia, no solo alojamiento."
      },
      {
        id: "economic",
        label: "Economico",
        analysis:
          "El mercado admite tarifas premium moderadas, pero la estacionalidad obliga a trabajar ocupacion fuera de peak.",
        implication: "La estrategia comercial debe contemplar temporada alta y hombro."
      },
      {
        id: "political",
        label: "Politico",
        analysis:
          "La gestion del destino y la seguridad regional influyen en la percepcion de demanda.",
        implication: "La comunicacion del hotel debe reforzar confianza y experiencia segura."
      },
      {
        id: "technological",
        label: "Tecnologico",
        analysis:
          "La conversion digital y la reputacion online pesan mucho en el proceso de reserva.",
        implication: "La venta directa y la gestion de reviews son fundamentales."
      },
      {
        id: "ecological",
        label: "Ecologico",
        analysis:
          "El activo principal es el paisaje natural y el acceso a aventura, por lo que la sostenibilidad suma valor.",
        implication: "La operacion debe ser consistente con el relato de naturaleza."
      },
      {
        id: "legal",
        label: "Legal",
        analysis:
          "Spa, termas, actividades y transporte requieren protocolos y gestion normativa consistente.",
        implication: "La propuesta debe integrar operadores y cumplimiento desde el inicio."
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
    sources: [
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
    ]
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
    touristStats: [
      {
        label: "Ocupacion regional",
        value: "52,3% febrero 2026",
        note: "Senal regional de Antofagasta en temporada alta."
      },
      {
        label: "ADR regional",
        value: "CLP 87.974 febrero 2026",
        note: "Dato regional de referencia para alojamiento, no exclusivo de lujo."
      },
      {
        label: "Posicionamiento",
        value: "Destino internacional premium de naturaleza",
        note: "Soporta pricing alto cuando el producto integra experiencia y servicio."
      }
    ],
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
        implication: "El hotel debe vender experiencia curada y no solo tarifa de habitacion."
      },
      {
        id: "economic",
        label: "Economico",
        analysis:
          "El destino soporta ADR alto, aunque la dependencia de intermediacion y el costo operativo pueden erosionar margen.",
        implication: "La mezcla de canales debe migrar hacia venta directa y paquetes rentables."
      },
      {
        id: "political",
        label: "Politico",
        analysis:
          "La promocion internacional de Chile favorece el destino, pero su operacion depende de conectividad, acceso y coordinacion local.",
        implication: "La planificacion comercial debe alinearse con vuelos, operadores y temporada."
      },
      {
        id: "technological",
        label: "Tecnologico",
        analysis:
          "La decision de compra se concentra en plataformas digitales, reputacion online y contenido inspiracional.",
        implication: "El canal directo necesita una propuesta visual fuerte y conversion alta."
      },
      {
        id: "ecological",
        label: "Ecologico",
        analysis:
          "El desierto y sus ecosistemas demandan uso responsable de agua, energia y excursionismo sostenible.",
        implication: "La sostenibilidad debe estar integrada al modelo de operacion y marca."
      },
      {
        id: "legal",
        label: "Legal",
        analysis:
          "La hoteleria premium con spa, gastronomia y tours asociados necesita protocolos claros, contratos y cumplimiento normativo.",
        implication: "La apertura requiere una matriz de permisos y partners formalizada."
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
    sources: [
      {
        title: "INE Antofagasta - Alojamiento Turistico",
        url: "https://regiones.ine.gob.cl/antofagasta/prensa/las-pernoctaciones-en-establecimientos-de-alojamiento-tur%C3%ADstico-registraron-un-aumento-de-10-4-en-doce-meses",
        note: "Referencia regional de ocupacion y ADR."
      },
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
    ]
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
    touristStats: [
      {
        label: "Patron de demanda",
        value: "Fuerte fin de semana y verano",
        note: "La estacionalidad y la cercania a Santiago marcan el comportamiento comercial."
      },
      {
        label: "Mercado clave",
        value: "Escapada premium nacional",
        note: "El cliente valora accesibilidad, vista mar, gastronomia y bienestar."
      },
      {
        label: "Profundidad competitiva",
        value: "Media-baja en lujo estricto",
        note: "Puede exigir ampliar el benchmark al corredor costero premium."
      }
    ],
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
        implication: "La experiencia debe optimizar estadias breves y consumo complementario."
      },
      {
        id: "economic",
        label: "Economico",
        analysis:
          "El mercado premium costero soporta ADR medio-alto, pero con comparacion intensa entre propiedades y arriendos de segunda vivienda.",
        implication: "La propuesta debe diferenciarse del alojamiento residencial."
      },
      {
        id: "political",
        label: "Politico",
        analysis:
          "La gestion costera, normas urbanas y desarrollo inmobiliario inciden en el ritmo de crecimiento de la oferta.",
        implication: "El hotel necesita una lectura territorial y regulatoria detallada."
      },
      {
        id: "technological",
        label: "Tecnologico",
        analysis:
          "La compra se apoya en reputacion, comparadores y contenido visual de alta calidad.",
        implication: "La distribucion online y la marca son decisivas."
      },
      {
        id: "ecological",
        label: "Ecologico",
        analysis:
          "El valor del destino depende del borde costero, paisaje y uso responsable de recursos.",
        implication: "La sostenibilidad y el diseno son atributos comerciales visibles."
      },
      {
        id: "legal",
        label: "Legal",
        analysis:
          "La operacion hotelera costera puede enfrentar exigencias asociadas a urbanismo, seguridad, alimentos y actividades complementarias.",
        implication: "La hoja de ruta legal debe trabajarse desde la fase de proyecto."
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
    sources: [
      {
        title: "Chile Travel - Costa de Chile",
        url: "https://chile.travel/",
        note: "Referencia general de atractivos y turismo costero."
      },
      {
        title: "Referencias hoteleras corredor premium costa norte",
        url: "https://www.booking.com/",
        note: "Base comparativa de mercado para tarifas y amenities costeros."
      },
      {
        title: "SERNATUR Region de Valparaiso",
        url: "https://www.sernatur.cl/",
        note: "Referencia institucional del destino y su oferta turistica."
      }
    ]
  }
};

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
      sourceTitle: primarySource?.title,
      sourceUrl: primarySource?.url
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
