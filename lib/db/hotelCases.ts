import { createSupabaseAdminClient } from "@/lib/db/supabase";
import type { HotelCaseInput, HotelCaseResult, SavedHotelCaseListItem, SavedHotelCaseRecord } from "@/types";

type HotelCaseRow = {
  id: string;
  user_id: string | null;
  hotel_name: string;
  destination: HotelCaseInput["destination"];
  region: string;
  country: string;
  category: string;
  status: "draft" | "solved";
  case_input: HotelCaseInput;
  case_result: HotelCaseResult | null;
  created_at: string;
  updated_at: string;
};

function mapRowToRecord(row: HotelCaseRow): SavedHotelCaseRecord {
  return {
    id: row.id,
    userId: row.user_id,
    hotelName: row.hotel_name,
    destination: row.destination,
    region: row.region,
    country: row.country,
    category: row.category,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    caseInput: row.case_input,
    caseResult: row.case_result
  };
}

function mapRowToListItem(row: HotelCaseRow): SavedHotelCaseListItem {
  return {
    id: row.id,
    hotelName: row.hotel_name,
    destination: row.destination,
    region: row.region,
    country: row.country,
    category: row.category,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    weightedAverageAdr: row.case_result?.summary.weightedAverageAdr,
    mostProfitableChannel: row.case_result?.summary.mostProfitableChannel
  };
}

export async function saveHotelCaseRecord(payload: {
  userId: string;
  input: HotelCaseInput;
  result?: HotelCaseResult | null;
}) {
  const supabase = createSupabaseAdminClient();

  const insertPayload = {
    user_id: payload.userId,
    hotel_name: payload.input.hotelName,
    destination: payload.input.destination,
    region: payload.input.region,
    country: payload.input.country,
    category: payload.input.category,
    status: payload.result ? "solved" : "draft",
    case_input: payload.input,
    case_result: payload.result ?? null
  };

  const { data, error } = await supabase
    .from("hotel_cases")
    .insert(insertPayload)
    .select("*")
    .single<HotelCaseRow>();

  if (error) {
    throw new Error(`No fue posible guardar el caso hotelero en Supabase: ${error.message}`);
  }

  return mapRowToRecord(data);
}

export async function updateHotelCaseRecord(
  id: string,
  userId: string,
  payload: {
    input: HotelCaseInput;
    result?: HotelCaseResult | null;
  }
) {
  const supabase = createSupabaseAdminClient();

  const updatePayload = {
    hotel_name: payload.input.hotelName,
    destination: payload.input.destination,
    region: payload.input.region,
    country: payload.input.country,
    category: payload.input.category,
    status: payload.result ? "solved" : "draft",
    case_input: payload.input,
    case_result: payload.result ?? null
  };

  const { data, error } = await supabase
    .from("hotel_cases")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single<HotelCaseRow>();

  if (error) {
    throw new Error(`No fue posible actualizar el caso hotelero en Supabase: ${error.message}`);
  }

  return mapRowToRecord(data);
}

export async function deleteHotelCaseRecord(id: string, userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("hotel_cases")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(`No fue posible eliminar el caso hotelero en Supabase: ${error.message}`);
  }

  if (!data) {
    throw new Error("No se encontró el caso hotelero o no pertenece al usuario actual.");
  }

  return data.id;
}

export async function listHotelCaseRecords(filters: {
  userId: string;
  search?: string;
  destination?: HotelCaseInput["destination"] | "";
}) {
  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("hotel_cases")
    .select("*")
    .eq("user_id", filters.userId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (filters?.destination) {
    query = query.eq("destination", filters.destination);
  }

  if (filters?.search?.trim()) {
    const search = filters.search.trim();
    query = query.or(`hotel_name.ilike.%${search}%,region.ilike.%${search}%,country.ilike.%${search}%`);
  }

  const { data, error } = await query.returns<HotelCaseRow[]>();

  if (error) {
    throw new Error(`No fue posible listar los casos hoteleros guardados: ${error.message}`);
  }

  return (data ?? []).map(mapRowToListItem);
}

export async function getHotelCaseRecordById(id: string, userId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("hotel_cases")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single<HotelCaseRow>();

  if (error) {
    throw new Error(`No fue posible cargar el caso hotelero solicitado: ${error.message}`);
  }

  return mapRowToRecord(data);
}
