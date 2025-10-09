import { createClient } from '@/lib/supabase/server';

export interface SupabaseMachine {
  id: string;
  kintone_record_id: string;
  customer_id: string;
  customer_name: string | null;
  machine_category: string | null;
  machine_type: string | null;
  vendor: string | null;
  model: string | null;
  serial_number: string | null;
  machine_number: string | null;
  machine_item: string | null;
  install_date: string | null;
  manufacture_date: string | null;
  remarks: string | null;
  photo_files: any[] | null;
  nameplate_files: any[] | null;
  quotation_count: number | null;
  work_order_count: number | null;
  report_count: number | null;
  quotation_history: any[] | null;
  created_at: string;
  updated_at: string;
}

interface GetMachinesOptions {
  search?: string;
  category?: string;
  vendor?: string;
  limit?: number;
}

export async function getMachinesFromSupabase(options: GetMachinesOptions = {}): Promise<SupabaseMachine[]> {
  const supabase = await createClient();
  const { search, category, vendor, limit = 200 } = options;

  let query = supabase
    .from('machines')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (category && category !== 'all') {
    query = query.eq('machine_category', category);
  }

  if (vendor && vendor !== 'all') {
    query = query.eq('vendor', vendor);
  }

  if (search && search.trim() !== '') {
    const term = `%${search.trim()}%`;
    query = query.or([
      `customer_name.ilike.${term}`,
      `customer_id.ilike.${term}`,
      `model.ilike.${term}`,
      `serial_number.ilike.${term}`,
      `machine_item.ilike.${term}`,
    ].join(','));
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch machines from Supabase:', error);
    throw error;
  }

  return data ?? [];
}

export async function getMachinesByCustomerFromSupabase(customerId: string): Promise<SupabaseMachine[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .eq('customer_id', customerId)
    .order('machine_item', { ascending: true });

  if (error) {
    console.error('Failed to fetch machines by customer from Supabase:', error);
    throw error;
  }

  return data ?? [];
}

export async function getMachineByIdFromSupabase(machineId: string): Promise<SupabaseMachine | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .eq('id', machineId)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch machine from Supabase:', error);
    return null;
  }

  return data ?? null;
}

export async function getDistinctMachineFilters() {
  const supabase = await createClient();

  const [categoriesRes, vendorsRes] = await Promise.all([
    supabase.from('machines').select('machine_category').not('machine_category', 'is', null),
    supabase.from('machines').select('vendor').not('vendor', 'is', null),
  ]);

  const categories = Array.from(new Set((categoriesRes.data ?? []).map((row) => row.machine_category).filter(Boolean))) as string[];
  const vendors = Array.from(new Set((vendorsRes.data ?? []).map((row) => row.vendor).filter(Boolean))) as string[];

  return { categories, vendors };
}
