import { HOTEL_DESTINATION_PROFILES, buildChannelRoomAllocation, normalizeHotelCaseInput } from "@/lib/hotel/data";
import type {
  HotelCaseInput,
  HotelCaseResult,
  HotelChannelResult,
  HotelChannelRoomTypeResult,
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

const ROOM_TYPE_ORDER = ["single", "double", "triple", "suite"] as const;
const CHANNEL_ORDER: HotelSalesChannelId[] = ["tourOperators", "onlineAgencies", "direct", "corporate"];

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
  const soldRoomNightsByType = ROOM_TYPE_ORDER.reduce<Record<(typeof ROOM_TYPE_ORDER)[number], number>>(
    (current, type) => ({
      ...current,
      [type]: occupiedRoomNights * shares[type]
    }),
    {} as Record<(typeof ROOM_TYPE_ORDER)[number], number>
  );
  const channelRoomTypeResults: HotelChannelRoomTypeResult[] = [];

  for (const channel of CHANNEL_ORDER) {
    const config = input.channels[channel];

    for (const type of ROOM_TYPE_ORDER) {
      const occupiedChannelRoomNights = soldRoomNightsByType[type] * (config.share / 100);
      const availableChannelRoomNights = config.roomAllocation[type] * days;
      const grossRevenue = occupiedChannelRoomNights * config.rates[type];
      const commissionCost = grossRevenue * (config.commission / 100);
      const netRevenue = grossRevenue - commissionCost;

      channelRoomTypeResults.push({
        channel,
        type,
        assignedRooms: config.roomAllocation[type],
        availableRoomNights: roundMetric(availableChannelRoomNights),
        occupiedRoomNights: roundMetric(occupiedChannelRoomNights),
        occupancyRate: roundMetric(
          availableChannelRoomNights > 0 ? (occupiedChannelRoomNights / availableChannelRoomNights) * 100 : 0
        ),
        rate: roundCurrency(config.rates[type]),
        grossRevenue: roundCurrency(grossRevenue),
        commissionCost: roundCurrency(commissionCost),
        netRevenue: roundCurrency(netRevenue)
      });
    }
  }

  const roomTypeResults = ROOM_TYPE_ORDER.map((type) => {
    const soldRoomNights = soldRoomNightsByType[type];
    const revenue = channelRoomTypeResults
      .filter((item) => item.type === type)
      .reduce((sum, item) => sum + item.grossRevenue, 0);

    return {
      type,
      availableRooms: input.roomMix[type],
      soldRoomNights: roundMetric(soldRoomNights),
      rate: roundCurrency(input.roomRates[type]),
      revenue: roundCurrency(revenue)
    };
  });

  const grossRoomRevenue = channelRoomTypeResults.reduce((sum, item) => sum + item.grossRevenue, 0);
  const totalGuests = occupiedRoomNights * input.guestFactor;
  const achievedAdr = occupiedRoomNights > 0 ? grossRoomRevenue / occupiedRoomNights : 0;
  const breakfastRevenueCurrent = totalGuests * input.breakfastPriceCurrent;
  const breakfastRevenueProposed = totalGuests * input.breakfastPriceProposed;
  const breakfastRevenueDelta = breakfastRevenueProposed - breakfastRevenueCurrent;

  const channelResults: HotelChannelResult[] = CHANNEL_ORDER.map((channel) => {
    const config = input.channels[channel];
    const roomTypeRows = channelRoomTypeResults.filter((item) => item.channel === channel);
    const availableChannelRoomNights = roomTypeRows.reduce((sum, item) => sum + item.availableRoomNights, 0);
    const occupiedChannelRoomNights = roomTypeRows.reduce((sum, item) => sum + item.occupiedRoomNights, 0);
    const grossRevenue = roomTypeRows.reduce((sum, item) => sum + item.grossRevenue, 0);
    const commissionCost = roomTypeRows.reduce((sum, item) => sum + item.commissionCost, 0);
    const netRevenue = roomTypeRows.reduce((sum, item) => sum + item.netRevenue, 0);
    const netAdr = occupiedChannelRoomNights > 0 ? netRevenue / occupiedChannelRoomNights : 0;
    const assignedRooms = roomTypeRows.reduce((sum, item) => sum + item.assignedRooms, 0);

    return {
      channel,
      share: roundMetric(occupiedRoomNights > 0 ? (occupiedChannelRoomNights / occupiedRoomNights) * 100 : 0),
      commission: config.commission,
      assignedRooms,
      availableRoomNights: roundMetric(availableChannelRoomNights),
      occupiedRoomNights: roundMetric(occupiedChannelRoomNights),
      occupancyRate: roundMetric(availableChannelRoomNights > 0 ? (occupiedChannelRoomNights / availableChannelRoomNights) * 100 : 0),
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
    channelResults,
    channelRoomTypeResults
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
  return {
    ...input,
    solution: input.solution ?? input.nextAction,
    assumption:
      input.assumption ??
      "La proyección requiere ejecución comercial disciplinada y seguimiento semanal sobre la palanca elegida.",
    validationMetric:
      input.validationMetric ??
      "Revisar semanalmente ADR, ocupación, mix de canales y variación de revenue incremental."
  };
}

function buildWarnings(input: HotelCaseInput, weightedAverageAdr: number, monthlyForecasts: HotelMonthlyForecast[]) {
  const warnings: string[] = [];
  const roomMixTotal = sumRoomMix(input.roomMix);
  const allocatedRoomMix = ROOM_TYPE_ORDER.reduce<Record<(typeof ROOM_TYPE_ORDER)[number], number>>(
    (current, type) => ({
      ...current,
      [type]: CHANNEL_ORDER.reduce((sum, channel) => sum + input.channels[channel].roomAllocation[type], 0)
    }),
    {} as Record<(typeof ROOM_TYPE_ORDER)[number], number>
  );
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

  for (const type of ROOM_TYPE_ORDER) {
    if (allocatedRoomMix[type] !== input.roomMix[type]) {
      warnings.push(
        `La asignación por canal en ${ROOM_TYPE_LABELS[type]} suma ${allocatedRoomMix[type]} habitaciones, pero el mix del hotel declara ${input.roomMix[type]}. Corrige la grilla para que la ocupación por canal no quede sesgada.`
      );
    }
  }

  if (channelMixTotal !== 100) {
    warnings.push(`La suma de participación de canales es ${roundMetric(channelMixTotal)}%, no 100%. Esto puede inflar o subestimar ingresos por canal y comisiones.`);
  }

  const channelOverflows = monthlyForecasts.flatMap((month) =>
    month.channelRoomTypeResults.filter(
      (item) => item.availableRoomNights > 0 && item.occupiedRoomNights - item.availableRoomNights > 0.5
    )
  );

  if (channelOverflows.length > 0) {
    const overflow = channelOverflows[0];
    warnings.push(
      `${CHANNEL_LABELS[overflow.channel]} quedó sobreasignado en ${ROOM_TYPE_LABELS[overflow.type]}: proyecta ${roundMetric(overflow.occupiedRoomNights)} RN sobre una capacidad de ${roundMetric(overflow.availableRoomNights)} RN. Rebalancea cupos o participación del canal.`
    );
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
  const totalOccupiedRoomNights = monthlyForecasts.reduce((sum, month) => sum + month.occupiedRoomNights, 0);
  const roomTypeAggregates = (["single", "double", "triple", "suite"] as const).map((type) => ({
    type,
    soldRoomNights: monthlyForecasts.reduce(
      (sum, month) => sum + (month.roomTypeResults.find((item) => item.type === type)?.soldRoomNights ?? 0),
      0
    ),
    revenue: monthlyForecasts.reduce(
      (sum, month) => sum + (month.roomTypeResults.find((item) => item.type === type)?.revenue ?? 0),
      0
    ),
    rate: input.roomRates[type]
  }));
  const rankedRoomTypes = [...roomTypeAggregates].sort((a, b) => b.revenue - a.revenue);
  const primaryRoomType = rankedRoomTypes[0] ?? null;
  const secondaryRoomType = rankedRoomTypes.find((item) => item.type !== primaryRoomType?.type) ?? null;
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
  const premiumRoomRevenue = rankedRoomTypes.slice(0, 2).reduce((sum, item) => sum + item.revenue, 0);
  const rateFenceUpliftRate = averageOccupancy >= 90 ? 0.02 : 0.015;
  const rateFenceImpact = premiumRoomRevenue * rateFenceUpliftRate;
  const channelShiftPoints = Math.min(4, Math.max(2, rebalancedShare || 2));
  const channelShiftImpact =
    totalOccupiedRoomNights > 0
      ? totalOccupiedRoomNights * (channelShiftPoints / 100) * Math.max(bestNetAdr - lowestNetAdr, 0)
      : 0;
  const upsellConversion = averageOccupancy >= 90 ? 0.06 : 0.04;
  const nextRoomGap =
    primaryRoomType && secondaryRoomType
      ? Math.max(secondaryRoomType.rate - primaryRoomType.rate, 0)
      : 0;
  const roomUpsellImpact =
    primaryRoomType && nextRoomGap > 0
      ? primaryRoomType.soldRoomNights * upsellConversion * nextRoomGap
      : 0;
  const breakfastConservativeAttach = 0.8;
  const breakfastConservativeImpact = totalBreakfastDelta * breakfastConservativeAttach;
  const packageAttachRate = averageOccupancy >= 90 ? 0.12 : 0.08;
  const packageIncrementPerNight = averageOccupancy >= 90 ? 28 : 18;
  const packageImpact = totalOccupiedRoomNights * packageAttachRate * packageIncrementPerNight;

  if (weightedAverageAdr < input.targetAverageRate) {
    recommendations.push(
      buildRecommendation({
        title: "Arquitectura ADR",
        text: `El ADR proyectado queda US$${roundCurrency(input.targetAverageRate - weightedAverageAdr)} bajo la meta. La salida no es “más promoción”, sino rediseñar precio por tipología y canal: cerrar descuentos en ${CHANNEL_LABELS[lowestNetAdrChannel]}, aplicar pisos tarifarios en ${primaryRoomType ? ROOM_TYPE_LABELS[primaryRoomType.type] : "las categorías de mayor venta"} y reservar inventario premium para canales con mejor retorno.`,
        rationale: `La gerencia pide un ADR mayor a US$${roundCurrency(input.targetAverageRate)} y el caso llega a US$${roundCurrency(weightedAverageAdr)}. Si no se corrige, el hotel puede llenar habitaciones pero sostener una tarifa inferior a la meta.`,
        evidence: `${CHANNEL_LABELS[lowestNetAdrChannel]} deja un net ADR aproximado de US$${roundCurrency(lowestNetAdr)}, mientras ${CHANNEL_LABELS[mostProfitableChannel]} llega a US$${roundCurrency(bestNetAdr)}. Además, las dos tipologías con más ingreso concentran cerca de US$${roundCurrency(premiumRoomRevenue)} del revenue de habitaciones.`,
        solution: `Aplicar una malla tarifaria con pisos por canal y cerrar inventario promocional en ${CHANNEL_LABELS[lowestNetAdrChannel]} cuando la ocupación proyectada del mes supere 88%. La subida debe concentrarse en ${primaryRoomType ? ROOM_TYPE_LABELS[primaryRoomType.type] : "la categoría principal"} y ${secondaryRoomType ? ROOM_TYPE_LABELS[secondaryRoomType.type] : "la categoría siguiente"}, no en todo el hotel.`,
        assumption: `La proyección asume dos movimientos simultáneos: elevar en ${roundMetric(rateFenceUpliftRate * 100)}% el revenue de las tipologías líderes y migrar ${channelShiftPoints} puntos del mix hacia ${CHANNEL_LABELS[mostProfitableChannel]} sin perder room nights totales.`,
        expectedImpact: `Con ese ajuste, el upside referencial sería de US$${roundCurrency(rateFenceImpact + channelShiftImpact)} entre enero y febrero: US$${roundCurrency(rateFenceImpact)} por arquitectura tarifaria y US$${roundCurrency(channelShiftImpact)} por mejorar el mix de canal.`,
        validationMetric: `Validar semanalmente ADR de ${primaryRoomType ? ROOM_TYPE_LABELS[primaryRoomType.type] : "la categoría principal"}, mix por canal y pickup neto. Si cae el pickup más de 3% sin compensar ADR, la hipótesis no se está cumpliendo.`,
        nextAction: `Definir esta semana pisos tarifarios por canal, blackout de descuentos en fechas pico y cupo limitado para inventario premium en ${CHANNEL_LABELS[lowestNetAdrChannel]}.`,
        tone: "amber"
      })
    );
  } else {
    recommendations.push(buildRecommendation({
      title: "Blindaje de ADR",
      text: `El ADR proyectado supera la meta en US$${roundCurrency(weightedAverageAdr - input.targetAverageRate)}. La solución es blindarlo: no abrir descuento abierto y capturar valor vía precio por tipología, cierre de canales de menor retorno en picos y paquetes cerrados sin tocar la tarifa pública base.`,
      rationale: `El caso ya supera la meta de gerencia: ADR proyectado US$${roundCurrency(weightedAverageAdr)} versus meta US$${roundCurrency(input.targetAverageRate)}. Por eso el foco no debe ser bajar precio, sino vender valor adicional.`,
      evidence: `La ocupación media enero-febrero es ${roundMetric(averageOccupancy)}%, el revenue de las dos tipologías líderes ronda US$${roundCurrency(premiumRoomRevenue)} y ${CHANNEL_LABELS[mostProfitableChannel]} deja el mejor net ADR.`,
      solution: `Subir el precio efectivo donde ya existe disposición a pagar: cerrar descuentos en fechas de alta ocupación, aplicar upgrade pagado sobre ${primaryRoomType ? ROOM_TYPE_LABELS[primaryRoomType.type] : "la categoría principal"} y reservar el inventario premium para venta directa y paquetes cerrados ligados a ${destinationExperiences}.`,
      assumption: `La proyección asume un uplift promedio de ${roundMetric(rateFenceUpliftRate * 100)}% sobre las tipologías líderes y un traspaso de ${channelShiftPoints} puntos del mix desde ${CHANNEL_LABELS[lowestNetAdrChannel]} a ${CHANNEL_LABELS[mostProfitableChannel]} sin caída material de ocupación.`,
      expectedImpact: `Bajo ese supuesto, el upside referencial sería de US$${roundCurrency(rateFenceImpact + channelShiftImpact)} en enero-febrero, con mejora concentrada en ADR neto y no en mayor volumen.`,
      validationMetric: `Seguir semanalmente ADR por tipología, share de canal premium, pickup en fechas pico y porcentaje de noches vendidas sin descuento. Si el ADR sube y la ocupación se sostiene sobre 88%, la hipótesis se está cumpliendo.`,
      nextAction: `Activar desde la próxima semana una grilla de tarifas cerradas por fecha y canal, con paquetes no descontados y control diario de pickup en categorías altas.`,
      tone: "emerald"
    }));
  }

  if (input.channels.tourOperators.share > input.channels.direct.share) {
    recommendations.push(
      buildRecommendation({
        title: "Rebalanceo de canales",
        text: `Hoy ${CHANNEL_LABELS.direct} tiene menor peso que ${CHANNEL_LABELS.tourOperators}. La solución concreta es recuperar mix directo con una tarifa web con beneficio cerrado, remarketing a cotizaciones no convertidas y cupos limitados para intermediación en fechas de mayor presión.`,
        rationale: `La venta directa tiene ${directShare}% del mix y tour operadores tienen ${tourShare}%. Esa dependencia puede traer volumen, pero presiona margen por comisión y limita control comercial.`,
        evidence: `La comisión configurada para tour operadores es ${input.channels.tourOperators.commission}% versus ${input.channels.direct.commission}% en venta directa.`,
        solution: `Lanzar una tarifa directa con un beneficio que no rompa paridad pública: desayuno premium, late check-out o experiencia menor incluida. En paralelo, cerrar parte del inventario de tour operadores en fechas con pickup fuerte y reenfocar campañas al canal propio.`,
        assumption: `La proyección asume mover ${rebalancedShare} puntos del mix desde tour operadores hacia venta directa manteniendo el mismo volumen total de room nights.`,
        expectedImpact:
          commissionSavingsFromDirect > 0
            ? `Mover ${rebalancedShare} puntos de mix desde tour operadores a venta directa podría ahorrar cerca de US$${roundCurrency(commissionSavingsFromDirect)} en comisiones durante enero-febrero, manteniendo el mismo volumen total.`
            : `El impacto esperado es mejorar control de cliente y margen neto, aunque el ahorro exacto depende de cuánto volumen pueda migrarse sin perder ocupación.`,
        validationMetric: `Control semanal de share directo, costo de comisión total, conversión web y pickup por fecha. Si el directo sube sin caída de room nights, la migración está funcionando.`,
        nextAction: `Lanzar tarifa web con beneficio exclusivo y meta mínima: subir venta directa de ${directShare}% a ${Math.min(directShare + 5, 100)}% antes de temporada alta.`,
        tone: "amber"
      })
    );
  }

  if (primaryRoomType) {
    recommendations.push(buildRecommendation({
      title: "Producto estrella",
      text: `La categoría con más tracción hoy es ${ROOM_TYPE_LABELS[primaryRoomType.type]}. La recomendación no es promocionarla más, sino usarla como puerta de entrada a un upsell estructurado hacia una categoría superior o a bundles con margen.`,
      rationale: `La tipología que concentra más revenue es la mejor palanca para elevar ADR porque ya tiene volumen probado. El trabajo no está en generar demanda nueva, sino en convertir parte de esa demanda existente en tickets más altos.`,
      evidence: `${ROOM_TYPE_LABELS[primaryRoomType.type]} genera cerca de US$${roundCurrency(totalTopRoomTypeRevenue)} entre enero y febrero.${secondaryRoomType ? ` La siguiente categoría relevante es ${ROOM_TYPE_LABELS[secondaryRoomType.type]} con una brecha tarifaria de US$${roundCurrency(Math.max(secondaryRoomType.rate - primaryRoomType.rate, 0))}.` : ""}`,
      solution: secondaryRoomType
        ? `Diseñar una escalera de tres upgrades sobre ${ROOM_TYPE_LABELS[primaryRoomType.type]}: mejor vista o ubicación, bundle gastronómico y pase wellness/concierge, con precio anclado a la brecha hacia ${ROOM_TYPE_LABELS[secondaryRoomType.type]}.`
        : `Diseñar bundles sobre ${ROOM_TYPE_LABELS[primaryRoomType.type]} con experiencia gastronómica, traslado o wellness para elevar ingreso medio sin cambiar inventario.`,
      assumption: secondaryRoomType
        ? `La proyección asume que ${roundMetric(upsellConversion * 100)}% de las room nights vendidas en ${ROOM_TYPE_LABELS[primaryRoomType.type]} migra a una categoría o bundle equivalente con captura de la brecha tarifaria.`
        : `La proyección asume que ${roundMetric(upsellConversion * 100)}% de las room nights de la categoría líder compra un bundle adicional con margen incremental.`,
      expectedImpact: secondaryRoomType
        ? `Bajo ese supuesto, el ingreso incremental referencial sería de US$${roundCurrency(roomUpsellImpact)} en enero-febrero.`
        : `El upside depende del bundle definido, pero la lógica es elevar el ingreso medio sobre la categoría de mayor volumen sin añadir costo fijo relevante.`,
      validationMetric: `Revisar semanalmente take rate de upgrades, ADR de ${ROOM_TYPE_LABELS[primaryRoomType.type]} y porcentaje de reservas que migra a bundle superior. Si la conversión no llega al ${roundMetric(upsellConversion * 100)}%, la proyección no se cumple.`,
      nextAction: `Publicar tres ofertas de upgrade en web, email pre-arrival y recepción, con script comercial y cupo semanal medido por categoría.`,
      tone: "slate"
    }));
  }

  if (totalBreakfastDelta > 0) {
    recommendations.push(buildRecommendation({
      title: "Ingreso complementario",
      text: `Subir desayuno desde US$${input.breakfastPriceCurrent} a US$${input.breakfastPriceProposed} puede abrir un ingreso adicional relevante, pero solo si se empaqueta como producto y se protege la tasa de toma. La solución no es subir el precio solo en caja; debe venderse desde la reserva.`,
      rationale: `El cambio de precio no depende de vender más habitaciones; aprovecha huéspedes ya alojados. Por eso es una mejora de monetización directa sobre la demanda capturada.`,
      evidence: `Factor de ocupación: ${input.guestFactor} huéspedes por habitación. Precio actual: US$${input.breakfastPriceCurrent}; precio propuesto: US$${input.breakfastPriceProposed}.`,
      solution: `Vender desayuno como paquete premium desde el motor de reservas, check-in y pre-arrival: gastronomía local, horario extendido, opción express y descuento solo por preventa.`,
      assumption: `El full upside de US$${roundCurrency(totalBreakfastDelta)} solo se cumple si la toma de desayuno se mantiene al 100% del supuesto base. En un escenario más defendible de ${roundMetric(breakfastConservativeAttach * 100)}% de captura, el delta realizable sería de US$${roundCurrency(breakfastConservativeImpact)}.`,
      expectedImpact: `Escenario conservador: US$${roundCurrency(breakfastConservativeImpact)} entre enero y febrero. Escenario pleno del supuesto base: US$${roundCurrency(totalBreakfastDelta)}.`,
      validationMetric: `Medir semanalmente attach rate de desayuno, ingreso por huésped alojado y tasa de preventa al reservar. Si la captura cae bajo ${roundMetric(breakfastConservativeAttach * 100)}%, el forecast debe corregirse.`,
      nextAction: `Configurar preventa de desayuno en web y recepción esta semana, con meta mínima de attach rate sobre ${roundMetric(breakfastConservativeAttach * 100)}%.`,
      tone: "emerald"
    }));
  }

  if (averageOccupancy >= 90) {
    recommendations.push(buildRecommendation({
      title: "Paquete signature del destino",
      text: `Con ocupación media de ${roundMetric(averageOccupancy)}%, la oportunidad no está en vender más noches sino en aumentar ingreso por noche ocupada. La palanca concreta es armar un paquete signature ligado a ${destinationExperiences}, wellness y concierge premium, con cupos limitados y sin descuento abierto.`,
      rationale: `Cuando la ocupación proyectada está tan alta, la restricción principal no es generar demanda sino capturar más valor por huésped y proteger capacidad.`,
      evidence: `Ocupación media enero-febrero: ${roundMetric(averageOccupancy)}%. Ingreso neto de habitaciones proyectado: US$${roundCurrency(totalNetRoomRevenue)}.`,
      solution: `Publicar un paquete cerrado para una fracción pequeña del inventario con experiencia del destino, amenity premium y servicio preferente. Debe estar disponible solo en venta directa y en uno o dos canales seleccionados.`,
      assumption: `La proyección asume que ${roundMetric(packageAttachRate * 100)}% de las room nights ocupadas toma un paquete con margen incremental de US$${roundCurrency(packageIncrementPerNight)} por noche.`,
      expectedImpact: `Bajo ese supuesto, el upside referencial sería de US$${roundCurrency(packageImpact)} entre enero y febrero, sin depender de más ocupación.`,
      validationMetric: `Controlar semanalmente attach rate del paquete, margen incremental por reserva y share del paquete sobre nights ocupadas. Si el take rate no supera ${roundMetric(packageAttachRate * 100)}%, el upside no se materializa.`,
      nextAction: `Diseñar un paquete signature con precio cerrado, cupo máximo por semana y tracking por canal desde el lanzamiento.`,
      tone: "emerald"
    }));
  } else {
    recommendations.push(buildRecommendation({
      title: "Fechas de hombro",
      text: `Como la ocupación media proyectada es ${roundMetric(averageOccupancy)}%, el crecimiento debe venir de noches de hombro y no de descuentos masivos. La solución concreta es usar empresas, small groups y escapadas temáticas con valor agregado y fechas cerradas.`,
      rationale: `Con ocupación bajo 90%, todavía hay espacio de demanda que puede llenarse sin necesariamente bajar la tarifa pública principal.`,
      evidence: `Ocupación media enero-febrero: ${roundMetric(averageOccupancy)}%. Canal empresas configurado con ${input.channels.corporate.share}% del mix.`,
      solution: `Crear un calendario comercial por fecha de baja presión con paquetes corporate, reuniones pequeñas y escapadas de dos noches con servicios incluidos, sin abrir descuento público general.`,
      assumption: `La proyección asume mejorar 2 puntos de ocupación en la ventana analizada a tarifa protegida, capturando demanda adicional en noches de menor tensión.`,
      expectedImpact: `Ese movimiento agregaría aproximadamente ${roundMetric(input.totalRooms * 59 * 0.02)} room nights antes de comisiones, con mejor calidad de ingreso que una promoción abierta.`,
      validationMetric: `Revisar pickup por fecha de hombro, ADR de corporate y porcentaje de ocupación incremental fuera de fines de semana o picos. Si la ocupación extra entra con ADR destruido, la mejora no sirve.`,
      nextAction: `Armar un calendario de hombro con fechas, segmentos y paquete asignado antes del siguiente ciclo comercial.`,
      tone: "slate"
    }));
  }

  if (mostProfitableChannel !== largestNetContributor) {
    recommendations.push(buildRecommendation({
      title: "Gobernanza de canales",
      text: `${CHANNEL_LABELS[mostProfitableChannel]} deja hoy el mejor retorno por habitación, mientras ${CHANNEL_LABELS[largestNetContributor]} aporta el mayor volumen neto. La solución es separar explícitamente el rol de cada canal en vez de pedirle lo mismo a todos.`,
      rationale: `Un canal debe proteger ADR neto y otro puede estabilizar caja por volumen. Si se mezclan objetivos, el hotel termina erosionando tarifa donde debería defenderla.`,
      evidence: `Canal con mejor ADR neto: ${CHANNEL_LABELS[mostProfitableChannel]}. Canal con mayor aporte neto total: ${CHANNEL_LABELS[largestNetContributor]}.`,
      solution: `Asignar metas distintas: ${CHANNEL_LABELS[mostProfitableChannel]} para capturar margen y categorías altas; ${CHANNEL_LABELS[largestNetContributor]} para llenar demanda base con cupos y pisos tarifarios definidos.`,
      assumption: `La mejora se materializa si el canal de volumen no toma inventario premium y si el canal rentable gana share en categorías de mayor ADR.`,
      expectedImpact: `Separar funciones no crea ingresos por sí solo, pero evita canibalización entre canales y hace más probable sostener el ADR neto proyectado.`,
      validationMetric: `Medir cada semana ADR neto por canal, share por tipo de habitación y margen después de comisión. Si un canal de volumen empieza a captar categorías premium sin piso tarifario, la estrategia falla.`,
      nextAction: `Definir una matriz comercial por canal con objetivo, tipología prioritaria y tope de inventario para las próximas ocho semanas.`,
      tone: "emerald"
    }));
  } else {
    recommendations.push(buildRecommendation({
      title: "Proteger canal líder",
      text: `${CHANNEL_LABELS[mostProfitableChannel]} hoy lidera tanto en ADR neto como en aporte neto. La solución no es cargarle todo el crecimiento, sino protegerlo con beneficios exclusivos, control de sobreexposición y reglas claras para no degradar el precio.`,
      rationale: `Cuando un mismo canal concentra margen y volumen, el riesgo principal es deteriorarlo por sobreuso, descuentos excesivos o dependencia excesiva de una sola fuente de demanda.`,
      evidence: `${CHANNEL_LABELS[mostProfitableChannel]} concentra el mejor retorno por habitación y el mayor aporte neto total en el caso actual.`,
      solution: `Mantener ese canal como eje de captura, pero con beneficios cerrados, paridad pública controlada y respaldo de canales secundarios para no depender de una sola fuente.`,
      assumption: `La recomendación se cumple si ese canal mantiene su share sin aumentar su costo comercial ni obligar descuentos para sostener conversión.`,
      expectedImpact: `El beneficio esperado es proteger el ADR neto ya capturado y reducir el riesgo de concentración comercial más que abrir un upside inmediato adicional.`,
      validationMetric: `Monitorear semanalmente share del canal líder, ADR neto, tasa de conversión y dependencia sobre el total de net revenue. Si supera el umbral interno de concentración, conviene diversificar.`,
      nextAction: `Definir un umbral máximo de dependencia por canal y un plan de respaldo con dos canales secundarios antes de abrir más inventario al canal líder.`,
      tone: "emerald"
    }));
  }

  return uniqueRecommendations(recommendations).slice(0, 6);
}

export function validateHotelCaseInput(input: HotelCaseInput) {
  const issues: string[] = [];
  const normalizedInput = normalizeHotelCaseInput(input);

  if (!normalizedInput.hotelName.trim()) issues.push("Ingresa el nombre del hotel.");
  if (!normalizedInput.concept.trim()) issues.push("Describe el concepto del hotel.");
  if (!normalizedInput.services.trim()) issues.push("Detalla los servicios del hotel.");
  if (!normalizedInput.differentiation.trim()) issues.push("Explica la diferenciacion del hotel.");
  if (sumRoomMix(normalizedInput.roomMix) !== normalizedInput.totalRooms) issues.push("El mix de habitaciones debe coincidir con el total.");

  const channelShare =
    normalizedInput.channels.tourOperators.share +
    normalizedInput.channels.onlineAgencies.share +
    normalizedInput.channels.direct.share +
    normalizedInput.channels.corporate.share;
  const expectedAllocation = buildChannelRoomAllocation(normalizedInput.roomMix, {
    tourOperators: normalizedInput.channels.tourOperators.share,
    onlineAgencies: normalizedInput.channels.onlineAgencies.share,
    direct: normalizedInput.channels.direct.share,
    corporate: normalizedInput.channels.corporate.share
  });

  if (channelShare !== 100) issues.push("La distribucion de canales debe sumar 100%.");

  for (const type of ROOM_TYPE_ORDER) {
    const allocationTotal = CHANNEL_ORDER.reduce(
      (sum, channel) => sum + normalizedInput.channels[channel].roomAllocation[type],
      0
    );

    if (allocationTotal !== normalizedInput.roomMix[type]) {
      issues.push(`La asignacion por canal de ${ROOM_TYPE_LABELS[type]} debe coincidir con el inventario total de esa tipologia.`);
    }
  }

  for (const channel of CHANNEL_ORDER) {
    const assignedTotal = ROOM_TYPE_ORDER.reduce(
      (sum, type) => sum + normalizedInput.channels[channel].roomAllocation[type],
      0
    );
    const expectedTotal = ROOM_TYPE_ORDER.reduce((sum, type) => sum + expectedAllocation[channel][type], 0);

    if (assignedTotal !== expectedTotal) {
      issues.push(
        `${CHANNEL_LABELS[channel]} tiene ${assignedTotal} habitaciones asignadas, pero por su participación debería trabajar con ${expectedTotal}. Ajusta la grilla de cupos o la participación del canal.`
      );
    }
  }

  if (normalizedInput.occupancyJanuary < 1 || normalizedInput.occupancyJanuary > 100) issues.push("La ocupacion de enero debe estar entre 1% y 100%.");
  if (normalizedInput.occupancyFebruary < 1 || normalizedInput.occupancyFebruary > 100) issues.push("La ocupacion de febrero debe estar entre 1% y 100%.");
  if (normalizedInput.targetAverageRate <= 0) issues.push("La meta de ADR debe ser positiva.");

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
  const normalizedInput = normalizeHotelCaseInput(input);
  const monthlyForecasts = [
    buildMonthlyForecast(normalizedInput, "Enero 2027", normalizedInput.occupancyJanuary, 31),
    buildMonthlyForecast(normalizedInput, "Febrero 2027", normalizedInput.occupancyFebruary, 28)
  ];

  return {
    input: normalizedInput,
    monthlyForecasts,
    summary: buildHotelForecastSummary(normalizedInput, monthlyForecasts),
    generatedAt: new Date().toISOString()
  };
}

export function normalizeHotelCaseResult(result: HotelCaseResult | null) {
  if (!result) return null;

  const normalizedInput = normalizeHotelCaseInput(result.input);
  const rebuilt = buildHotelCaseBaseResult(normalizedInput);

  return {
    ...rebuilt,
    research: result.research,
    generatedAt: result.generatedAt ?? rebuilt.generatedAt
  };
}
