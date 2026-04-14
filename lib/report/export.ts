import { HOTEL_CHANNEL_LABELS } from "@/lib/hotel/data";
import type { EvaluationSnapshot, HotelCaseResult, HotelSalesChannelId } from "@/types";
import { slugify } from "@/lib/utils";

export function printCurrentPage(projectName?: string) {
  if (typeof window === "undefined") return;

  const previousTitle = window.document.title;

  if (projectName) {
    window.document.title = `${slugify(projectName) || "factibiz"}-informe-completo`;
  }

  window.print();

  if (projectName) {
    window.setTimeout(() => {
      window.document.title = previousTitle;
    }, 250);
  }
}

export function downloadEvaluationJson(snapshot: EvaluationSnapshot) {
  if (typeof window === "undefined") return;

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: "application/json"
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = slugify(snapshot.input.projectName);

  link.href = url;
  link.download = `${safeName || "factibiz"}-evaluacion.json`;
  link.click();
  window.URL.revokeObjectURL(url);
}

const HOTEL_ROOM_TYPE_ORDER = ["single", "double", "triple", "suite"] as const;
const HOTEL_CHANNEL_ORDER: HotelSalesChannelId[] = ["tourOperators", "onlineAgencies", "direct", "corporate"];

const HOTEL_ROOM_TYPE_LABELS: Record<(typeof HOTEL_ROOM_TYPE_ORDER)[number], string> = {
  single: "Single",
  double: "Doble",
  triple: "Triple",
  suite: "Suite"
};

function roundExportMetric(value: number) {
  return Math.round(value * 100) / 100;
}

const EXCEL_COLORS = {
  black: "FF000000",
  white: "FFFFFFFF",
  navy: "FF1F2A44",
  sky: "FF9ED5E5",
  yellow: "FFFFFF00",
  paleYellow: "FFFFF799",
  peach: "FFF6C49B",
  green: "FF88A83F",
  orange: "FFF28B20",
  lavender: "FFD7D3FF",
  red: "FFFF2B1F",
  lightGray: "FFF5F5F5",
  border: "FF000000"
} as const;

const BORDER_THIN = {
  top: { style: "thin", color: { argb: EXCEL_COLORS.border } },
  left: { style: "thin", color: { argb: EXCEL_COLORS.border } },
  bottom: { style: "thin", color: { argb: EXCEL_COLORS.border } },
  right: { style: "thin", color: { argb: EXCEL_COLORS.border } }
} as const;

function styleCell(cell: any, options: {
  fill?: string;
  bold?: boolean;
  fontColor?: string;
  size?: number;
  align?: "left" | "center" | "right";
  numFmt?: string;
  wrapText?: boolean;
}) {
  cell.border = BORDER_THIN;
  cell.font = {
    name: "Arial",
    size: options.size ?? 10,
    bold: options.bold ?? false,
    color: options.fontColor ? { argb: options.fontColor } : undefined
  };
  cell.alignment = {
    vertical: "middle",
    horizontal: options.align ?? "left",
    wrapText: options.wrapText ?? false
  };

  if (options.fill) {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: options.fill }
    };
  }

  if (options.numFmt) {
    cell.numFmt = options.numFmt;
  }
}

function styleRange(worksheet: any, fromRow: number, fromCol: number, toRow: number, toCol: number, options: Parameters<typeof styleCell>[1]) {
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let col = fromCol; col <= toCol; col += 1) {
      styleCell(worksheet.getCell(row, col), options);
    }
  }
}

function setValue(
  worksheet: any,
  row: number,
  col: number,
  value: string | number,
  options: Parameters<typeof styleCell>[1] = {}
) {
  const cell = worksheet.getCell(row, col);
  cell.value = value;
  styleCell(cell, options);
}

function mergeValue(
  worksheet: any,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  value: string | number,
  options: Parameters<typeof styleCell>[1] = {}
) {
  worksheet.mergeCells(fromRow, fromCol, toRow, toCol);
  styleRange(worksheet, fromRow, fromCol, toRow, toCol, options);
  worksheet.getCell(fromRow, fromCol).value = value;
}

function applyCurrency(cell: any) {
  cell.numFmt = '"US$"#,##0';
}

function applyPercentLike(cell: any) {
  cell.numFmt = '0.0"%"';
}

function configureWorksheetBase(worksheet: any) {
  worksheet.views = [{ state: "frozen", xSplit: 1, ySplit: 8 }];
  worksheet.properties.defaultRowHeight = 20;
  worksheet.pageSetup = {
    paperSize: 9,
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0
  };

  const widths = [4, 16, 14, 10, 10, 14, 12, 14, 12, 14, 12, 14, 12, 12, 12, 18, 18];
  widths.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });
}

function buildHotelSummarySheet(workbook: any, result: HotelCaseResult) {
  const worksheet = workbook.addWorksheet("Resumen");
  configureWorksheetBase(worksheet);

  mergeValue(worksheet, 1, 2, 1, 8, result.input.hotelName, {
    fill: EXCEL_COLORS.navy,
    bold: true,
    size: 14,
    fontColor: EXCEL_COLORS.white,
    align: "center"
  });
  mergeValue(worksheet, 1, 9, 1, 11, result.input.category, {
    fill: EXCEL_COLORS.black,
    bold: true,
    size: 12,
    fontColor: EXCEL_COLORS.white,
    align: "center"
  });

  const summaryPairs: Array<[string, string | number]> = [
    ["Destino", result.input.destination],
    ["Región", result.input.region],
    ["País", result.input.country],
    ["Habitaciones", result.input.totalRooms],
    ["ADR meta", result.input.targetAverageRate],
    ["ADR proyectado", result.summary.weightedAverageAdr],
    ["Gross habitaciones", result.summary.totalGrossRoomRevenue],
    ["Neto habitaciones", result.summary.totalNetRoomRevenue],
    ["Comisiones", result.summary.totalCommissions],
    ["Delta desayuno", result.summary.totalBreakfastDelta],
    ["Canal más rentable", HOTEL_CHANNEL_LABELS[result.summary.mostProfitableChannel]],
    ["Mayor aporte neto", HOTEL_CHANNEL_LABELS[result.summary.largestNetContributor]]
  ];

  let currentRow = 3;
  for (const [label, value] of summaryPairs) {
    setValue(worksheet, currentRow, 2, label, {
      fill: EXCEL_COLORS.sky,
      bold: true
    });
    setValue(worksheet, currentRow, 3, value, {});
    if (typeof value === "number" && label !== "Habitaciones") {
      applyCurrency(worksheet.getCell(currentRow, 3));
    }
    currentRow += 1;
  }

  currentRow += 1;
  mergeValue(worksheet, currentRow, 2, currentRow, 8, "Resumen mensual", {
    fill: EXCEL_COLORS.yellow,
    bold: true
  });
  currentRow += 1;

  ["Mes", "Ocupación %", "RN disponibles", "RN vendidas", "ADR", "Gross", "Comisiones", "Neto"].forEach((label, index) => {
    setValue(worksheet, currentRow, index + 2, label, {
      fill: EXCEL_COLORS.black,
      bold: true,
      fontColor: EXCEL_COLORS.white,
      align: "center"
    });
  });
  currentRow += 1;

  for (const month of result.monthlyForecasts) {
    setValue(worksheet, currentRow, 2, month.month);
    setValue(worksheet, currentRow, 3, month.occupancyRate, { align: "right" });
    applyPercentLike(worksheet.getCell(currentRow, 3));
    setValue(worksheet, currentRow, 4, month.availableRoomNights, { align: "right" });
    setValue(worksheet, currentRow, 5, month.occupiedRoomNights, { align: "right" });
    setValue(worksheet, currentRow, 6, month.achievedAdr, { align: "right" });
    applyCurrency(worksheet.getCell(currentRow, 6));
    setValue(worksheet, currentRow, 7, month.grossRoomRevenue, { align: "right" });
    applyCurrency(worksheet.getCell(currentRow, 7));
    setValue(worksheet, currentRow, 8, month.commissionsTotal, { align: "right" });
    applyCurrency(worksheet.getCell(currentRow, 8));
    setValue(worksheet, currentRow, 9, month.netRoomRevenue, { align: "right" });
    applyCurrency(worksheet.getCell(currentRow, 9));
    currentRow += 1;
  }

  currentRow += 2;
  mergeValue(worksheet, currentRow, 2, currentRow, 11, "Alertas importantes", {
    fill: EXCEL_COLORS.orange,
    bold: true
  });
  currentRow += 1;

  if (result.summary.warnings.length === 0) {
    mergeValue(worksheet, currentRow, 2, currentRow, 11, "Sin alertas relevantes.", {
      fill: EXCEL_COLORS.lightGray
    });
  } else {
    for (const warning of result.summary.warnings) {
      mergeValue(worksheet, currentRow, 2, currentRow, 11, warning, {
        fill: EXCEL_COLORS.lightGray,
        wrapText: true
      });
      currentRow += 1;
    }
  }
}

function buildHotelChannelsSheet(workbook: any, result: HotelCaseResult) {
  const worksheet = workbook.addWorksheet("Canales");
  configureWorksheetBase(worksheet);

  mergeValue(worksheet, 1, 2, 1, 12, "Tablero consolidado de canales", {
    fill: EXCEL_COLORS.navy,
    bold: true,
    size: 14,
    fontColor: EXCEL_COLORS.white,
    align: "center"
  });

  const headers = [
    "Canal",
    "Participación %",
    "Comisión %",
    "Hab. asignadas",
    "Single",
    "Doble",
    "Triple",
    "Suite",
    "Gross",
    "Comisión USD",
    "Neto",
    "Net ADR"
  ];

  headers.forEach((header, index) => {
    setValue(worksheet, 3, index + 2, header, {
      fill: EXCEL_COLORS.black,
      bold: true,
      fontColor: EXCEL_COLORS.white,
      align: "center"
    });
  });

  const aggregate = new Map<
    HotelSalesChannelId,
    { grossRevenue: number; commissionCost: number; netRevenue: number; occupiedRoomNights: number }
  >();
  for (const channel of HOTEL_CHANNEL_ORDER) {
    aggregate.set(channel, { grossRevenue: 0, commissionCost: 0, netRevenue: 0, occupiedRoomNights: 0 });
  }
  for (const month of result.monthlyForecasts) {
    for (const row of month.channelResults) {
      const current = aggregate.get(row.channel)!;
      current.grossRevenue += row.grossRevenue;
      current.commissionCost += row.commissionCost;
      current.netRevenue += row.netRevenue;
      current.occupiedRoomNights += row.occupiedRoomNights;
    }
  }

  let row = 4;
  for (const channel of HOTEL_CHANNEL_ORDER) {
    const config = result.input.channels[channel];
    const channelTotals = aggregate.get(channel)!;
    const assignedRooms = HOTEL_ROOM_TYPE_ORDER.reduce((sum, type) => sum + config.roomAllocation[type], 0);
    const referenceMix = result.monthlyForecasts[0]?.channelResults.find((item) => item.channel === channel)?.share ?? config.share;
    const netAdr = channelTotals.occupiedRoomNights > 0 ? channelTotals.netRevenue / channelTotals.occupiedRoomNights : 0;

    setValue(worksheet, row, 2, HOTEL_CHANNEL_LABELS[channel], { bold: true });
    setValue(worksheet, row, 3, referenceMix, { align: "right" });
    applyPercentLike(worksheet.getCell(row, 3));
    setValue(worksheet, row, 4, config.commission, { align: "right" });
    applyPercentLike(worksheet.getCell(row, 4));
    setValue(worksheet, row, 5, assignedRooms, { align: "right" });
    setValue(worksheet, row, 6, config.roomAllocation.single, { align: "right" });
    setValue(worksheet, row, 7, config.roomAllocation.double, { align: "right" });
    setValue(worksheet, row, 8, config.roomAllocation.triple, { align: "right" });
    setValue(worksheet, row, 9, config.roomAllocation.suite, { align: "right" });
    setValue(worksheet, row, 10, channelTotals.grossRevenue, { align: "right" });
    setValue(worksheet, row, 11, channelTotals.commissionCost, { align: "right" });
    setValue(worksheet, row, 12, channelTotals.netRevenue, { align: "right" });
    setValue(worksheet, row, 13, netAdr, { align: "right" });
    [10, 11, 12, 13].forEach((column) => applyCurrency(worksheet.getCell(row, column)));
    row += 1;
  }
}

function buildHotelMonthSheet(workbook: any, result: HotelCaseResult, month: HotelCaseResult["monthlyForecasts"][number]) {
  const worksheet = workbook.addWorksheet(month.month.replace(" 2027", ""));
  configureWorksheetBase(worksheet);

  const monthLabel = month.month.replace(" 2027", "");
  const dailyOccupiedRooms = month.occupiedRoomNights / month.days;

  mergeValue(worksheet, 1, 6, 1, 8, result.input.hotelName, {
    fill: EXCEL_COLORS.white,
    bold: true,
    size: 13,
    align: "center"
  });
  mergeValue(worksheet, 1, 9, 1, 10, result.input.category, {
    fill: EXCEL_COLORS.white,
    bold: true,
    size: 12,
    align: "center"
  });

  setValue(worksheet, 3, 2, "Tarifario", { fill: EXCEL_COLORS.yellow, bold: true });
  setValue(worksheet, 3, 4, "Temporada", { bold: true });
  setValue(worksheet, 3, 5, "Alta");
  setValue(worksheet, 3, 7, monthLabel, { bold: true });

  mergeValue(worksheet, 3, 9, 4, 10, month.occupancyRate, {
    fill: EXCEL_COLORS.red,
    bold: true,
    align: "right",
    size: 12
  });
  applyPercentLike(worksheet.getCell(3, 9));
  mergeValue(worksheet, 5, 9, 5, 10, roundExportMetric(dailyOccupiedRooms), {
    fill: EXCEL_COLORS.yellow,
    bold: true,
    align: "right",
    size: 11
  });

  setValue(worksheet, 3, 14, "Cant Hab", { bold: true });
  setValue(worksheet, 3, 15, result.input.totalRooms, { align: "right" });
  setValue(worksheet, 4, 14, "Días", { bold: true });
  setValue(worksheet, 4, 15, month.days, { align: "right" });
  setValue(worksheet, 5, 14, "Factor Oc", { bold: true });
  setValue(worksheet, 5, 15, result.input.guestFactor, { align: "right" });

  setValue(worksheet, 8, 2, 1, { bold: true, align: "center" });
  mergeValue(worksheet, 8, 4, 8, 9, `${monthLabel} - Oferta de Habitaciones y Tarifas`, {
    bold: true,
    align: "center"
  });

  mergeValue(worksheet, 9, 2, 9, 4, "Oferta", {
    fill: EXCEL_COLORS.sky,
    bold: true,
    align: "center"
  });
  setValue(worksheet, 9, 5, "Cant", { bold: true, align: "center" });

  const tariffChannelColumns: Record<HotelSalesChannelId, number> = {
    tourOperators: 6,
    corporate: 8,
    onlineAgencies: 10,
    direct: 12
  };
  const tariffChannelColors: Record<HotelSalesChannelId, string> = {
    tourOperators: EXCEL_COLORS.yellow,
    corporate: EXCEL_COLORS.green,
    onlineAgencies: EXCEL_COLORS.orange,
    direct: EXCEL_COLORS.lavender
  };

  (["tourOperators", "corporate", "onlineAgencies", "direct"] as HotelSalesChannelId[]).forEach((channel) => {
    mergeValue(worksheet, 9, tariffChannelColumns[channel], 9, tariffChannelColumns[channel] + 1, HOTEL_CHANNEL_LABELS[channel], {
      fill: tariffChannelColors[channel],
      bold: true,
      align: "center"
    });
  });

  let row = 10;
  for (const type of HOTEL_ROOM_TYPE_ORDER) {
    const inventoryShare = result.input.totalRooms > 0 ? (result.input.roomMix[type] / result.input.totalRooms) * 100 : 0;
    setValue(worksheet, row, 2, HOTEL_ROOM_TYPE_LABELS[type], { fill: EXCEL_COLORS.sky });
    setValue(worksheet, row, 3, inventoryShare, { fill: EXCEL_COLORS.sky, align: "right" });
    applyPercentLike(worksheet.getCell(row, 3));
    setValue(worksheet, row, 4, result.input.roomMix[type], { fill: EXCEL_COLORS.sky, align: "right" });
    setValue(worksheet, row, 5, result.input.roomMix[type], { align: "right" });

    (["tourOperators", "corporate", "onlineAgencies", "direct"] as HotelSalesChannelId[]).forEach((channel) => {
      const col = tariffChannelColumns[channel];
      setValue(worksheet, row, col, result.input.channels[channel].rates[type], {
        fill: tariffChannelColors[channel],
        align: "right"
      });
      applyCurrency(worksheet.getCell(row, col));
      styleCell(worksheet.getCell(row, col + 1), { fill: tariffChannelColors[channel] });
    });
    row += 1;
  }

  setValue(worksheet, 14, 4, 100, { fill: EXCEL_COLORS.sky, bold: true, align: "right" });
  applyPercentLike(worksheet.getCell(14, 4));
  setValue(worksheet, 14, 5, result.input.totalRooms, { fill: EXCEL_COLORS.yellow, bold: true, align: "right" });

  setValue(worksheet, 18, 2, 2, { bold: true, align: "center" });
  mergeValue(worksheet, 18, 4, 18, 9, "Distribución de Habitaciones", {
    fill: EXCEL_COLORS.yellow,
    bold: true,
    align: "center"
  });
  mergeValue(worksheet, 19, 2, 19, 4, "Oferta", {
    fill: EXCEL_COLORS.sky,
    bold: true,
    align: "center"
  });
  setValue(worksheet, 19, 5, "Cant", { bold: true, align: "center" });

  const distributionColumns: Record<HotelSalesChannelId, number> = {
    tourOperators: 6,
    corporate: 8,
    onlineAgencies: 10,
    direct: 12
  };
  (["tourOperators", "corporate", "onlineAgencies", "direct"] as HotelSalesChannelId[]).forEach((channel) => {
    mergeValue(worksheet, 19, distributionColumns[channel], 19, distributionColumns[channel] + 1, HOTEL_CHANNEL_LABELS[channel], {
      fill: tariffChannelColors[channel],
      bold: true,
      align: "center"
    });
  });
  setValue(worksheet, 19, 14, "100%", { bold: true, align: "center" });

  row = 20;
  for (const type of HOTEL_ROOM_TYPE_ORDER) {
    setValue(worksheet, row, 2, HOTEL_ROOM_TYPE_LABELS[type], { fill: EXCEL_COLORS.sky });
    const inventoryShare = result.input.totalRooms > 0 ? (result.input.roomMix[type] / result.input.totalRooms) * 100 : 0;
    setValue(worksheet, row, 3, inventoryShare, { fill: EXCEL_COLORS.sky, align: "right" });
    applyPercentLike(worksheet.getCell(row, 3));
    setValue(worksheet, row, 4, result.input.roomMix[type], { fill: EXCEL_COLORS.sky, align: "right" });
    setValue(worksheet, row, 5, result.input.roomMix[type], { align: "right" });

    (["tourOperators", "corporate", "onlineAgencies", "direct"] as HotelSalesChannelId[]).forEach((channel) => {
      const col = distributionColumns[channel];
      const assigned = result.input.channels[channel].roomAllocation[type];
      const share = result.input.roomMix[type] > 0 ? (assigned / result.input.roomMix[type]) * 100 : 0;
      setValue(worksheet, row, col, assigned, { align: "right" });
      setValue(worksheet, row, col + 1, share, { align: "right" });
      applyPercentLike(worksheet.getCell(row, col + 1));
    });
    setValue(worksheet, row, 14, 100, { align: "right" });
    applyPercentLike(worksheet.getCell(row, 14));
    row += 1;
  }
  setValue(worksheet, 24, 4, 100, { fill: EXCEL_COLORS.sky, bold: true, align: "right" });
  applyPercentLike(worksheet.getCell(24, 4));
  setValue(worksheet, 24, 5, result.input.totalRooms, { bold: true, align: "right" });

  setValue(worksheet, 28, 2, 3, { bold: true, align: "center" });
  mergeValue(worksheet, 28, 4, 28, 9, "Ingreso por habitaciones", {
    bold: true,
    align: "center"
  });
  mergeValue(worksheet, 29, 2, 29, 4, "Oferta", {
    fill: EXCEL_COLORS.sky,
    bold: true,
    align: "center"
  });
  setValue(worksheet, 29, 5, "Cant", { bold: true, align: "center" });

  (["tourOperators", "corporate", "onlineAgencies", "direct"] as HotelSalesChannelId[]).forEach((channel) => {
    mergeValue(worksheet, 29, distributionColumns[channel], 29, distributionColumns[channel] + 1, HOTEL_CHANNEL_LABELS[channel], {
      fill: tariffChannelColors[channel],
      bold: true,
      align: "center"
    });
  });
  setValue(worksheet, 29, 14, "100%", { bold: true, align: "center" });

  row = 30;
  const revenueTotalsByChannel: Record<HotelSalesChannelId, number> = {
    tourOperators: 0,
    corporate: 0,
    onlineAgencies: 0,
    direct: 0
  };
  for (const type of HOTEL_ROOM_TYPE_ORDER) {
    setValue(worksheet, row, 2, HOTEL_ROOM_TYPE_LABELS[type], { fill: EXCEL_COLORS.sky });
    const inventoryShare = result.input.totalRooms > 0 ? (result.input.roomMix[type] / result.input.totalRooms) * 100 : 0;
    setValue(worksheet, row, 3, inventoryShare, { fill: EXCEL_COLORS.sky, align: "right" });
    applyPercentLike(worksheet.getCell(row, 3));
    setValue(worksheet, row, 4, result.input.roomMix[type], { fill: EXCEL_COLORS.sky, align: "right" });
    setValue(worksheet, row, 5, result.input.roomMix[type], { align: "right" });

    const totalRevenueType = month.roomTypeResults.find((item) => item.type === type)?.revenue ?? 0;
    (["tourOperators", "corporate", "onlineAgencies", "direct"] as HotelSalesChannelId[]).forEach((channel) => {
      const col = distributionColumns[channel];
      const channelType = month.channelRoomTypeResults.find((item) => item.channel === channel && item.type === type);
      const share = totalRevenueType > 0 ? ((channelType?.grossRevenue ?? 0) / totalRevenueType) * 100 : 0;
      const value = channelType?.grossRevenue ?? 0;
      revenueTotalsByChannel[channel] += value;
      setValue(worksheet, row, col, value, { align: "right" });
      applyCurrency(worksheet.getCell(row, col));
      setValue(worksheet, row, col + 1, share, { align: "right" });
      applyPercentLike(worksheet.getCell(row, col + 1));
    });
    setValue(worksheet, row, 14, 100, { align: "right" });
    applyPercentLike(worksheet.getCell(row, 14));
    row += 1;
  }

  setValue(worksheet, 34, 4, 100, { fill: EXCEL_COLORS.sky, bold: true, align: "right" });
  applyPercentLike(worksheet.getCell(34, 4));
  setValue(worksheet, 34, 5, result.input.totalRooms, { bold: true, align: "right" });
  (["tourOperators", "corporate", "onlineAgencies", "direct"] as HotelSalesChannelId[]).forEach((channel) => {
    const col = distributionColumns[channel];
    setValue(worksheet, 34, col, revenueTotalsByChannel[channel], { bold: true, align: "right" });
    applyCurrency(worksheet.getCell(34, col));
    setValue(worksheet, 34, col + 1, 1, { bold: true, align: "right" });
  });

  mergeValue(worksheet, 37, 2, 37, 3, "Venta", { bold: true });
  setValue(worksheet, 37, 4, "Diaria");
  setValue(worksheet, 37, 5, roundExportMetric(month.grossRoomRevenue / month.days), {
    fill: EXCEL_COLORS.white,
    align: "right"
  });
  applyCurrency(worksheet.getCell(37, 5));
  setValue(worksheet, 38, 4, "Mensual");
  setValue(worksheet, 38, 5, month.grossRoomRevenue, { fill: EXCEL_COLORS.yellow, bold: true, align: "right" });
  applyCurrency(worksheet.getCell(38, 5));

  mergeValue(worksheet, 41, 3, 41, 13, "Comisión", {
    fill: EXCEL_COLORS.orange,
    bold: true,
    align: "center"
  });
  (["tourOperators", "corporate", "onlineAgencies", "direct"] as HotelSalesChannelId[]).forEach((channel) => {
    const channelRow = month.channelResults.find((item) => item.channel === channel);
    const col = distributionColumns[channel];
    setValue(worksheet, 42, col, channelRow?.commission ?? result.input.channels[channel].commission, { align: "right" });
    applyPercentLike(worksheet.getCell(42, col));
    setValue(worksheet, 43, col, channelRow?.commissionCost ?? 0, { align: "right" });
    applyCurrency(worksheet.getCell(43, col));
  });
  setValue(worksheet, 43, 14, month.commissionsTotal, { bold: true, align: "right" });
  applyCurrency(worksheet.getCell(43, 14));

  setValue(worksheet, 45, 4, "Cantidad desayuno", { bold: true });
  setValue(worksheet, 45, 5, roundExportMetric(dailyOccupiedRooms), { align: "right" });
  setValue(worksheet, 45, 6, result.input.guestFactor, { align: "right" });
  setValue(worksheet, 45, 7, roundExportMetric(month.totalGuests), { align: "right" });
  setValue(worksheet, 45, 10, month.breakfastRevenueCurrent, { align: "right" });
  applyCurrency(worksheet.getCell(45, 10));

  setValue(worksheet, 46, 4, "Ingreso desayuno", { bold: true });
  setValue(worksheet, 46, 8, "Actual", { bold: true });
  setValue(worksheet, 46, 9, result.input.breakfastPriceCurrent, { align: "right" });
  applyCurrency(worksheet.getCell(46, 9));
  setValue(worksheet, 46, 10, month.breakfastRevenueCurrent, { align: "right" });
  applyCurrency(worksheet.getCell(46, 10));
  setValue(worksheet, 46, 12, "Propuesto", { bold: true });
  setValue(worksheet, 46, 13, result.input.breakfastPriceProposed, { align: "right" });
  applyCurrency(worksheet.getCell(46, 13));
  setValue(worksheet, 46, 14, month.breakfastRevenueProposed, { align: "right" });
  applyCurrency(worksheet.getCell(46, 14));
  setValue(worksheet, 46, 16, month.breakfastRevenueDelta, { fill: EXCEL_COLORS.paleYellow, bold: true, align: "right" });
  applyCurrency(worksheet.getCell(46, 16));

  mergeValue(worksheet, 18, 16, 24, 17, "Fase 2: distribución de habitaciones según canal de venta y participación configurada.", {
    wrapText: true
  });
  mergeValue(worksheet, 28, 16, 34, 17, "Fase 3: ingreso por habitaciones calculado desde las room nights del canal y su tarifario por tipología.", {
    wrapText: true
  });
}

export async function downloadHotelExcel(result: HotelCaseResult) {
  if (typeof window === "undefined") return;

  const ExcelJS = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const safeName = slugify(result.input.hotelName) || "hotel-case";

  workbook.creator = "Factibiz";
  workbook.created = new Date();
  workbook.modified = new Date();

  buildHotelSummarySheet(workbook, result);
  buildHotelChannelsSheet(workbook, result);
  result.monthlyForecasts.forEach((month) => buildHotelMonthSheet(workbook, result, month));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${safeName}-proyeccion-hotelera.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}
