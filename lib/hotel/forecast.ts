import { HOTEL_DESTINATION_PROFILES } from "@/lib/hotel/data";
import type {
  HotelCaseInput,
  HotelCaseResult,
  HotelChannelResult,
  HotelMonthlyForecast,
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

function buildWarnings(input: HotelCaseInput, weightedAverageAdr: number) {
  const warnings: string[] = [];
  const roomMixTotal = sumRoomMix(input.roomMix);
  const channelMixTotal =
    input.channels.tourOperators.share +
    input.channels.onlineAgencies.share +
    input.channels.direct.share +
    input.channels.corporate.share;

  if (roomMixTotal !== input.totalRooms) {
    warnings.push("El mix de habitaciones no coincide con el total declarado del hotel.");
  }

  if (channelMixTotal !== 100) {
    warnings.push("La suma de participacion de canales debe ser 100% para interpretar bien el forecast.");
  }

  if (weightedAverageAdr < input.targetAverageRate) {
    warnings.push(
      `El ADR proyectado queda por debajo de la meta de gerencia por US$${roundCurrency(input.targetAverageRate - weightedAverageAdr)}.`
    );
  }

  if (input.channels.tourOperators.share >= 40) {
    warnings.push("La dependencia de tour operadores sigue alta y puede seguir presionando la tarifa promedio.");
  }

  if (input.channels.direct.share < 18) {
    warnings.push("La venta directa tiene participacion baja para un hotel que quiere defender ADR y margen.");
  }

  return warnings;
}

function buildRecommendations(input: HotelCaseInput, weightedAverageAdr: number) {
  const destination = HOTEL_DESTINATION_PROFILES[input.destination];
  const recommendations: string[] = [];

  if (weightedAverageAdr < input.targetAverageRate) {
    recommendations.push(
      "Reasignar parte del inventario de mayor valor a canal directo y OTA premium con minimos tarifarios protegidos."
    );
  }

  if (input.channels.tourOperators.share > input.channels.direct.share) {
    recommendations.push(
      "Reducir gradualmente la cuota de tour operadores y aumentar la venta directa con beneficios exclusivos, early booking y upgrades."
    );
  }

  recommendations.push(
    `Diseñar paquetes de ${destination.label} que integren desayuno, experiencias y wellness para elevar ingreso por huesped sin competir solo por tarifa.`
  );
  recommendations.push(
    "Trabajar revenue management por tipo de habitacion, cuidando especialmente suite y doble premium para sostener ADR mensual."
  );
  recommendations.push(
    "Usar empresas y grupos pequenos de alto valor en periodos de hombro para mejorar ocupacion sin deteriorar la tarifa publica."
  );

  return recommendations;
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
    warnings: buildWarnings(input, weightedAverageAdr),
    recommendations: buildRecommendations(input, weightedAverageAdr)
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
