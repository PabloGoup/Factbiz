import { HOTEL_DESTINATION_PROFILES } from "@/lib/hotel/data";
import type {
  HotelCaseInput,
  HotelCaseResult,
  HotelChannelResult,
  HotelMonthlyForecast,
  HotelRecommendation,
  HotelRoomMix,
  HotelSalesChannelId
} from "@/types";

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function roundMetric(value: number) {
  return Math.round(value * 10) / 10;
}

function sumRoomMix(roomMix: HotelRoomMix) {
  return roomMix.single + roomMix.double + roomMix.triple + roomMix.suite;
}

function roomShareMap(input: HotelCaseInput) {
  const total = Math.max(input.totalRooms, 1);

  return {
    single: input.roomMix.single / total,
    double: input.roomMix.double / total,
    triple: input.roomMix.triple / total,
    suite: input.roomMix.suite / total
  };
}

function buildMonthlyForecast(
  input: HotelCaseInput,
  month: "Enero 2027" | "Febrero 2027",
  occupancyRate: number,
  days: number
): HotelMonthlyForecast {
  const availableRoomNights = input.totalRooms * days;
  const occupiedRoomNights = availableRoomNights * (occupancyRate / 100);
  const shares = roomShareMap(input);
  const roomTypeResults = (["single", "double", "triple", "suite"] as const).map((type) => {
    const soldRoomNights = occupiedRoomNights * shares[type];
    const rate = input.roomRates[type];
    const revenue = soldRoomNights * rate;

    return {
      type,
      availableRooms: input.roomMix[type],
      soldRoomNights: roundMetric(soldRoomNights),
      rate: roundCurrency(rate),
      revenue: roundCurrency(revenue)
    };
  });

  const grossRoomRevenue = roomTypeResults.reduce((sum, item) => sum + item.revenue, 0);
  const totalGuests = occupiedRoomNights * input.guestFactor;
  const achievedAdr = occupiedRoomNights > 0 ? grossRoomRevenue / occupiedRoomNights : 0;
  const breakfastRevenueCurrent = totalGuests * input.breakfastPriceCurrent;
  const breakfastRevenueProposed = totalGuests * input.breakfastPriceProposed;
  const breakfastRevenueDelta = breakfastRevenueProposed - breakfastRevenueCurrent;

  const channelResults: HotelChannelResult[] = (Object.entries(input.channels) as Array<
    [HotelSalesChannelId, HotelCaseInput["channels"][HotelSalesChannelId]]
  >).map(([channel, config]) => {
    const occupiedChannelRoomNights = occupiedRoomNights * (config.share / 100);
    const grossRevenue = grossRoomRevenue * (config.share / 100);
    const commissionCost = grossRevenue * (config.commission / 100);
    const netRevenue = grossRevenue - commissionCost;
    const netAdr = occupiedChannelRoomNights > 0 ? netRevenue / occupiedChannelRoomNights : 0;

    return {
      channel,
      share: config.share,
      commission: config.commission,
      occupiedRoomNights: roundMetric(occupiedChannelRoomNights),
      grossRevenue: roundCurrency(grossRevenue),
      commissionCost: roundCurrency(commissionCost),
      netRevenue: roundCurrency(netRevenue),
      netAdr: roundCurrency(netAdr)
    };
  });

  const commissionsTotal = channelResults.reduce((sum, item) => sum + item.commissionCost, 0);

  return {
    month,
    days,
    availableRoomNights: roundMetric(availableRoomNights),
    occupiedRoomNights: roundMetric(occupiedRoomNights),
    occupancyRate: roundMetric(occupancyRate),
    totalGuests: roundMetric(totalGuests),
    achievedAdr: roundCurrency(achievedAdr),
    grossRoomRevenue: roundCurrency(grossRoomRevenue),
    breakfastRevenueCurrent: roundCurrency(breakfastRevenueCurrent),
    breakfastRevenueProposed: roundCurrency(breakfastRevenueProposed),
    breakfastRevenueDelta: roundCurrency(breakfastRevenueDelta),
    commissionsTotal: roundCurrency(commissionsTotal),
    netRoomRevenue: roundCurrency(grossRoomRevenue - commissionsTotal),
    roomTypeResults,
    channelResults
  };
}

function aggregatedChannelMetrics(monthlyForecasts: HotelMonthlyForecast[]) {
  const aggregate = new Map<
    HotelSalesChannelId,
    { occupiedRoomNights: number; grossRevenue: number; commissionCost: number; netRevenue: number }
  >();

  for (const month of monthlyForecasts) {
    for (const channel of month.channelResults) {
      const current = aggregate.get(channel.channel) ?? {
        occupiedRoomNights: 0,
        grossRevenue: 0,
        commissionCost: 0,
        netRevenue: 0
      };

      current.occupiedRoomNights += channel.occupiedRoomNights;
      current.grossRevenue += channel.grossRevenue;
      current.commissionCost += channel.commissionCost;
      current.netRevenue += channel.netRevenue;
      aggregate.set(channel.channel, current);
    }
  }

  return aggregate;
}

const CHANNEL_LABELS: Record<HotelSalesChannelId, string> = {
  tourOperators: "tour operadores",
  onlineAgencies: "agencias online",
  direct: "venta directa",
  corporate: "empresas"
};

const ROOM_TYPE_LABELS = {
  single: "Single",
  double: "Doble",
  triple: "Triple",
  suite: "Suite"
} as const;

function uniqueRecommendations(recommendations: HotelRecommendation[]) {
  return recommendations.reduce<HotelRecommendation[]>((collected, item) => {
    if (collected.some((current) => current.title === item.title || current.text === item.text)) return collected;
    collected.push(item);
  return collected;
  }, []);
}

function buildRecommendation(input: HotelRecommendation) {
  return input;
}

function buildWarnings(input: HotelCaseInput, weightedAverageAdr: number, monthlyForecasts: HotelMonthlyForecast[]) {
  const warnings: string[] = [];
  const roomMixTotal = sumRoomMix(input.roomMix);
  const channelMixTotal =
    input.channels.tourOperators.share +
    input.channels.onlineAgencies.share +
    input.channels.direct.share +
    input.channels.corporate.share;
  const totalGrossRoomRevenue = monthlyForecasts.reduce((sum, month) => sum + month.grossRoomRevenue, 0);
  const totalCommissions = monthlyForecasts.reduce((sum, month) => sum + month.commissionsTotal, 0);
  const commissionRatio = totalGrossRoomRevenue > 0 ? (totalCommissions / totalGrossRoomRevenue) * 100 : 0;
  const averageOccupancy = monthlyForecasts.reduce((sum, month) => sum + month.occupancyRate, 0) / monthlyForecasts.length;
  const breakfastIncrease =
    input.breakfastPriceCurrent > 0
      ? ((input.breakfastPriceProposed - input.breakfastPriceCurrent) / input.breakfastPriceCurrent) * 100
      : 0;
  const directCommission = input.channels.direct.commission;
  const mostExpensiveChannel = (Object.entries(input.channels) as Array<
    [HotelSalesChannelId, HotelCaseInput["channels"][HotelSalesChannelId]]
  >).sort((a, b) => b[1].commission - a[1].commission)[0];

  if (roomMixTotal !== input.totalRooms) {
    warnings.push(`El mix de habitaciones suma ${roomMixTotal}, pero el hotel declara ${input.totalRooms}. Antes de decidir, corrige el inventario para no distorsionar room nights e ingresos.`);
  }

  if (channelMixTotal !== 100) {
    warnings.push(`La suma de participación de canales es ${roundMetric(channelMixTotal)}%, no 100%. Esto puede inflar o subestimar ingresos por canal y comisiones.`);
  }

  if (weightedAverageAdr < input.targetAverageRate) {
    warnings.push(
      `El ADR proyectado queda por debajo de la meta de gerencia por US$${roundCurrency(input.targetAverageRate - weightedAverageAdr)}.`
    );
  }

  if (averageOccupancy >= 90 && weightedAverageAdr < input.targetAverageRate) {
    warnings.push(`La ocupación media es alta (${roundMetric(averageOccupancy)}%), pero el ADR sigue bajo meta. Eso indica un problema de precio/mix, no de demanda.`);
  }

  if (input.channels.tourOperators.share >= 40) {
    warnings.push(`La dependencia de tour operadores sigue alta (${input.channels.tourOperators.share}%) y puede presionar tarifa promedio y margen neto.`);
  }

  if (input.channels.direct.share < 18) {
    warnings.push(`La venta directa tiene participación baja (${input.channels.direct.share}%) para un hotel que quiere defender ADR y margen.`);
  }

  if (commissionRatio >= 15) {
    warnings.push(`Las comisiones equivalen a ${roundMetric(commissionRatio)}% del revenue bruto de habitaciones. Si no se gestiona el mix, una buena ocupación puede dejar margen neto débil.`);
  }

  if (mostExpensiveChannel && mostExpensiveChannel[1].commission - directCommission >= 12 && mostExpensiveChannel[1].share >= 20) {
    warnings.push(`${CHANNEL_LABELS[mostExpensiveChannel[0]]} combina comisión alta (${mostExpensiveChannel[1].commission}%) y peso relevante (${mostExpensiveChannel[1].share}%). Conviene controlar cupos o exigir tarifa mínima.`);
  }

  if (breakfastIncrease >= 20) {
    warnings.push(`El alza de desayuno es de ${roundMetric(breakfastIncrease)}%. Puede mejorar ingreso, pero requiere justificar valor percibido para no afectar satisfacción.`);
  }

  return warnings;
}

function buildRecommendations(
  input: HotelCaseInput,
  monthlyForecasts: HotelMonthlyForecast[],
  weightedAverageAdr: number,
  mostProfitableChannel: HotelSalesChannelId,
  largestNetContributor: HotelSalesChannelId
) {
  const destination = HOTEL_DESTINATION_PROFILES[input.destination];
  const recommendations: HotelRecommendation[] = [];
  const totalGrossRoomRevenue = monthlyForecasts.reduce((sum, month) => sum + month.grossRoomRevenue, 0);
  const totalNetRoomRevenue = monthlyForecasts.reduce((sum, month) => sum + month.netRoomRevenue, 0);
  const totalBreakfastDelta = monthlyForecasts.reduce((sum, month) => sum + month.breakfastRevenueDelta, 0);
  const averageOccupancy = monthlyForecasts.reduce((sum, month) => sum + month.occupancyRate, 0) / monthlyForecasts.length;
  const firstMonth = monthlyForecasts[0];
  const channelAggregates = aggregatedChannelMetrics(monthlyForecasts);
  const channelNetAdr = Array.from(channelAggregates.entries()).map(([channel, metrics]) => ({
    channel,
    netAdr: metrics.occupiedRoomNights > 0 ? metrics.netRevenue / metrics.occupiedRoomNights : 0,
    netRevenue: metrics.netRevenue,
    commissionCost: metrics.commissionCost
  }));
  const lowestNetAdrChannel = channelNetAdr.sort((a, b) => a.netAdr - b.netAdr)[0]?.channel ?? "tourOperators";
  const lowestNetAdr = channelNetAdr.find((item) => item.channel === lowestNetAdrChannel)?.netAdr ?? 0;
  const bestNetAdr = channelNetAdr.find((item) => item.channel === mostProfitableChannel)?.netAdr ?? 0;
  const topRoomType = firstMonth ? [...firstMonth.roomTypeResults].sort((a, b) => b.revenue - a.revenue)[0] : null;
  const totalTopRoomTypeRevenue = monthlyForecasts.reduce(
    (sum, month) => sum + (month.roomTypeResults.find((item) => item.type === topRoomType?.type)?.revenue ?? 0),
    0
  );
  const destinationExperiences = destination.attractions.slice(0, 2).join(" y ");
  const tourShare = input.channels.tourOperators.share;
  const directShare = input.channels.direct.share;
  const rebalancedShare = Math.min(5, Math.max(tourShare - directShare, 0));
  const commissionSavingsFromDirect =
    rebalancedShare > 0
      ? totalGrossRoomRevenue * (rebalancedShare / 100) * Math.max(input.channels.tourOperators.commission - input.channels.direct.commission, 0) / 100
      : 0;
  const adrGap = roundCurrency(input.targetAverageRate - weightedAverageAdr);
  const adrSurplus = roundCurrency(weightedAverageAdr - input.targetAverageRate);

  if (weightedAverageAdr < input.targetAverageRate) {
    recommendations.push(
      buildRecommendation({
        title: "Defensa tarifaria",
        text: `El ADR proyectado queda US$${roundCurrency(input.targetAverageRate - weightedAverageAdr)} bajo la meta. Conviene mover inventario premium desde ${CHANNEL_LABELS[lowestNetAdrChannel]} hacia ${CHANNEL_LABELS[mostProfitableChannel]} con pisos tarifarios, restricciones de descuento y upgrades controlados.`,
        rationale: `La gerencia pide un ADR mayor a US$${roundCurrency(input.targetAverageRate)} y el caso llega a US$${roundCurrency(weightedAverageAdr)}. Si no se corrige, el hotel puede llenar habitaciones pero sostener una tarifa inferior a la meta.`,
        evidence: `${CHANNEL_LABELS[lowestNetAdrChannel]} deja un net ADR aproximado de US$${roundCurrency(lowestNetAdr)}, mientras ${CHANNEL_LABELS[mostProfitableChannel]} llega a US$${roundCurrency(bestNetAdr)} después de comisiones.`,
        expectedImpact: `Prioridad de corto plazo: cerrar una brecha tarifaria de US$${adrGap} por room night. A futuro, una mejora gradual de ADR protege el margen sin depender solo de subir ocupación.`,
        nextAction: `Definir pisos tarifarios por canal y bloquear descuentos en dobles premium y suites para las fechas con ocupación esperada sobre 88%.`,
        tone: "amber"
      })
    );
  } else {
    recommendations.push(buildRecommendation({
      title: "Captura de valor",
      text: `El ADR proyectado supera la meta en US$${roundCurrency(weightedAverageAdr - input.targetAverageRate)}. La recomendación es sostener precio público y vender más valor agregado, evitando descuentos innecesarios en fechas de alta ocupación.`,
      rationale: `El caso ya supera la meta de gerencia: ADR proyectado US$${roundCurrency(weightedAverageAdr)} versus meta US$${roundCurrency(input.targetAverageRate)}. Por eso el foco no debe ser bajar precio, sino vender valor adicional.`,
      evidence: `La ocupación media enero-febrero es ${roundMetric(averageOccupancy)}%, con ingreso bruto de habitaciones de US$${roundCurrency(totalGrossRoomRevenue)}.`,
      expectedImpact: `Si se captura solo 3% adicional sobre revenue de habitaciones mediante upgrades y paquetes, el upside referencial sería cercano a US$${roundCurrency(totalGrossRoomRevenue * 0.03)} en enero-febrero.`,
      nextAction: `Crear paquetes con experiencia, late check-out y amenities premium sin tocar la tarifa pública base.`,
      tone: "emerald"
    }));
  }

  if (input.channels.tourOperators.share > input.channels.direct.share) {
    recommendations.push(
      buildRecommendation({
        title: "Rebalanceo de canales",
        text: `Hoy ${CHANNEL_LABELS.direct} tiene menor peso que ${CHANNEL_LABELS.tourOperators}. Vale la pena rediseñar la mezcla con beneficios exclusivos, early booking, upgrades y paquetes propios para bajar comisión sin perder volumen.`,
        rationale: `La venta directa tiene ${directShare}% del mix y tour operadores tienen ${tourShare}%. Esa dependencia puede traer volumen, pero presiona margen por comisión y limita control comercial.`,
        evidence: `La comisión configurada para tour operadores es ${input.channels.tourOperators.commission}% versus ${input.channels.direct.commission}% en venta directa.`,
        expectedImpact:
          commissionSavingsFromDirect > 0
            ? `Mover ${rebalancedShare} puntos de mix desde tour operadores a venta directa podría ahorrar cerca de US$${roundCurrency(commissionSavingsFromDirect)} en comisiones durante enero-febrero, manteniendo el mismo volumen total.`
            : `El impacto esperado es mejorar control de cliente y margen neto, aunque el ahorro exacto depende de cuánto volumen pueda migrarse sin perder ocupación.`,
        nextAction: `Lanzar tarifa web con beneficio exclusivo y meta mínima: subir venta directa de ${directShare}% a ${Math.min(directShare + 5, 100)}% antes de temporada alta.`,
        tone: "amber"
      })
    );
  }

  recommendations.push(buildRecommendation({
    title: "Producto estrella",
    text: `La habitación con mayor tracción hoy es ${topRoomType ? ROOM_TYPE_LABELS[topRoomType.type] : "la tipología principal"}. Conviene construir una escalera de valor desde esa categoría hacia opciones superiores con amenities visibles, check-in preferente y beneficios que justifiquen mejor tarifa.`,
    rationale: `La tipología con más revenue es una palanca natural para upselling porque ya concentra demanda y permite empujar categorías superiores sin rediseñar todo el hotel.`,
    evidence: `${topRoomType ? ROOM_TYPE_LABELS[topRoomType.type] : "La tipología principal"} genera cerca de US$${roundCurrency(totalTopRoomTypeRevenue)} entre enero y febrero dentro del forecast.`,
    expectedImpact: `Una mejora de 4% en ingreso de esa tipología, vía upgrades o bundles, equivaldría a unos US$${roundCurrency(totalTopRoomTypeRevenue * 0.04)} adicionales en la ventana analizada.`,
    nextAction: `Diseñar tres niveles de upgrade: vista/ubicación, experiencia gastronómica y beneficio wellness o concierge.`,
    tone: "slate"
  }));

  if (totalBreakfastDelta > 0) {
    recommendations.push(buildRecommendation({
      title: "Ingreso complementario",
      text: `Subir desayuno desde US$${input.breakfastPriceCurrent} a US$${input.breakfastPriceProposed} abre un potencial adicional de US$${roundCurrency(totalBreakfastDelta)} entre enero y febrero. Lo más atractivo es venderlo como experiencia de marca con gastronomía local y no solo como recargo.`,
      rationale: `El cambio de precio no depende de vender más habitaciones; aprovecha huéspedes ya alojados. Por eso es una mejora de monetización directa sobre la demanda capturada.`,
      evidence: `Factor de ocupación: ${input.guestFactor} huéspedes por habitación. Precio actual: US$${input.breakfastPriceCurrent}; precio propuesto: US$${input.breakfastPriceProposed}.`,
      expectedImpact: `El upside calculado es US$${roundCurrency(totalBreakfastDelta)} para enero-febrero si la toma de desayuno se mantiene en el supuesto del caso.`,
      nextAction: `Convertir desayuno en paquete premium con producto local, horario extendido y preventa al reservar para reducir resistencia al precio.`,
      tone: "emerald"
    }));
  }

  if (averageOccupancy >= 90) {
    recommendations.push(buildRecommendation({
      title: "Experiencia premium",
      text: `Con ocupación media de ${roundMetric(averageOccupancy)}%, el hotel tiene espacio para priorizar rentabilidad sobre volumen. Es un buen momento para lanzar paquetes firmados alrededor de ${destinationExperiences}, wellness y concierge premium.`,
      rationale: `Cuando la ocupación proyectada está tan alta, la restricción principal no es generar demanda sino capturar más valor por huésped y proteger capacidad.`,
      evidence: `Ocupación media enero-febrero: ${roundMetric(averageOccupancy)}%. Ingreso neto de habitaciones proyectado: US$${roundCurrency(totalNetRoomRevenue)}.`,
      expectedImpact: `Un paquete premium con mejora conservadora de 2% sobre ingreso neto equivale a unos US$${roundCurrency(totalNetRoomRevenue * 0.02)} adicionales en enero-febrero.`,
      nextAction: `Crear paquetes no descontados con cupos limitados y medir conversión semanal por canal.`,
      tone: "emerald"
    }));
  } else {
    recommendations.push(buildRecommendation({
      title: "Fechas de hombro",
      text: `Como la ocupación media proyectada es ${roundMetric(averageOccupancy)}%, conviene usar empresas, small groups y escapadas temáticas para reforzar noches de menor tensión sin deteriorar la tarifa pública.`,
      rationale: `Con ocupación bajo 90%, todavía hay espacio de demanda que puede llenarse sin necesariamente bajar la tarifa pública principal.`,
      evidence: `Ocupación media enero-febrero: ${roundMetric(averageOccupancy)}%. Canal empresas configurado con ${input.channels.corporate.share}% del mix.`,
      expectedImpact: `Mejorar 2 puntos de ocupación en la ventana analizada agregaría aproximadamente ${roundMetric(input.totalRooms * 59 * 0.02)} room nights antes de comisiones.`,
      nextAction: `Diseñar calendario de hombro con empresas, grupos pequeños y ofertas con valor agregado, no con descuento abierto.`,
      tone: "slate"
    }));
  }

  recommendations.push(buildRecommendation({
    title: "Canal más rentable",
    text: `${CHANNEL_LABELS[mostProfitableChannel]} deja hoy el mejor retorno por habitación, mientras ${CHANNEL_LABELS[largestNetContributor]} aporta el mayor volumen neto. La estrategia comercial debería combinar ambos roles en vez de empujar todos los esfuerzos a un solo canal.`,
    rationale: `Un canal puede ser el más rentable por ADR neto, pero otro puede aportar más caja total por volumen. La decisión comercial correcta debe separar margen y volumen.`,
    evidence: `Canal con mejor ADR neto: ${CHANNEL_LABELS[mostProfitableChannel]}. Canal con mayor aporte neto total: ${CHANNEL_LABELS[largestNetContributor]}.`,
    expectedImpact: `A futuro, separar roles permite usar el canal rentable para proteger tarifa y el canal de volumen para estabilizar ocupación, evitando depender de una sola fuente de demanda.`,
    nextAction: `Asignar metas distintas por canal: margen para ${CHANNEL_LABELS[mostProfitableChannel]} y volumen controlado para ${CHANNEL_LABELS[largestNetContributor]}.`,
    tone: "emerald"
  }));

  return uniqueRecommendations(recommendations).slice(0, 6);
}

export function validateHotelCaseInput(input: HotelCaseInput) {
  const issues: string[] = [];

  if (!input.hotelName.trim()) issues.push("Ingresa el nombre del hotel.");
  if (!input.concept.trim()) issues.push("Describe el concepto del hotel.");
  if (!input.services.trim()) issues.push("Detalla los servicios del hotel.");
  if (!input.differentiation.trim()) issues.push("Explica la diferenciacion del hotel.");
  if (sumRoomMix(input.roomMix) !== input.totalRooms) issues.push("El mix de habitaciones debe coincidir con el total.");

  const channelShare =
    input.channels.tourOperators.share +
    input.channels.onlineAgencies.share +
    input.channels.direct.share +
    input.channels.corporate.share;

  if (channelShare !== 100) issues.push("La distribucion de canales debe sumar 100%.");

  if (input.occupancyJanuary < 1 || input.occupancyJanuary > 100) issues.push("La ocupacion de enero debe estar entre 1% y 100%.");
  if (input.occupancyFebruary < 1 || input.occupancyFebruary > 100) issues.push("La ocupacion de febrero debe estar entre 1% y 100%.");
  if (input.targetAverageRate <= 0) issues.push("La meta de ADR debe ser positiva.");

  return issues;
}

export function buildHotelForecastSummary(
  input: HotelCaseInput,
  monthlyForecasts: HotelMonthlyForecast[]
): HotelCaseResult["summary"] {
  const totalGrossRoomRevenue = monthlyForecasts.reduce((sum, month) => sum + month.grossRoomRevenue, 0);
  const totalNetRoomRevenue = monthlyForecasts.reduce((sum, month) => sum + month.netRoomRevenue, 0);
  const totalBreakfastRevenueCurrent = monthlyForecasts.reduce((sum, month) => sum + month.breakfastRevenueCurrent, 0);
  const totalBreakfastRevenueProposed = monthlyForecasts.reduce((sum, month) => sum + month.breakfastRevenueProposed, 0);
  const totalBreakfastDelta = monthlyForecasts.reduce((sum, month) => sum + month.breakfastRevenueDelta, 0);
  const totalCommissions = monthlyForecasts.reduce((sum, month) => sum + month.commissionsTotal, 0);
  const occupiedRoomNights = monthlyForecasts.reduce((sum, month) => sum + month.occupiedRoomNights, 0);
  const weightedAverageAdr = occupiedRoomNights > 0 ? totalGrossRoomRevenue / occupiedRoomNights : 0;
  const channelAggregate = aggregatedChannelMetrics(monthlyForecasts);

  const rankedByNetAdr = [...channelAggregate.entries()].sort((a, b) => {
    const adrA = a[1].occupiedRoomNights > 0 ? a[1].netRevenue / a[1].occupiedRoomNights : 0;
    const adrB = b[1].occupiedRoomNights > 0 ? b[1].netRevenue / b[1].occupiedRoomNights : 0;
    return adrB - adrA;
  });
  const rankedByNetRevenue = [...channelAggregate.entries()].sort((a, b) => b[1].netRevenue - a[1].netRevenue);

  return {
    totalGrossRoomRevenue: roundCurrency(totalGrossRoomRevenue),
    totalNetRoomRevenue: roundCurrency(totalNetRoomRevenue),
    totalBreakfastRevenueCurrent: roundCurrency(totalBreakfastRevenueCurrent),
    totalBreakfastRevenueProposed: roundCurrency(totalBreakfastRevenueProposed),
    totalBreakfastDelta: roundCurrency(totalBreakfastDelta),
    totalCommissions: roundCurrency(totalCommissions),
    weightedAverageAdr: roundCurrency(weightedAverageAdr),
    adrTargetMet: weightedAverageAdr >= input.targetAverageRate,
    adrGap: roundCurrency(input.targetAverageRate - weightedAverageAdr),
    mostProfitableChannel: rankedByNetAdr[0]?.[0] ?? "direct",
    largestNetContributor: rankedByNetRevenue[0]?.[0] ?? "direct",
    warnings: buildWarnings(input, weightedAverageAdr, monthlyForecasts),
    recommendations: buildRecommendations(
      input,
      monthlyForecasts,
      weightedAverageAdr,
      rankedByNetAdr[0]?.[0] ?? "direct",
      rankedByNetRevenue[0]?.[0] ?? "direct"
    )
  };
}

export function buildHotelCaseBaseResult(input: HotelCaseInput): Omit<HotelCaseResult, "research"> {
  const monthlyForecasts = [
    buildMonthlyForecast(input, "Enero 2027", input.occupancyJanuary, 31),
    buildMonthlyForecast(input, "Febrero 2027", input.occupancyFebruary, 28)
  ];

  return {
    input,
    monthlyForecasts,
    summary: buildHotelForecastSummary(input, monthlyForecasts),
    generatedAt: new Date().toISOString()
  };
}
