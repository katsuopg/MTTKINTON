-- Machine management table migrated from Kintone
create table if not exists machines (
  id uuid default gen_random_uuid() primary key,
  kintone_record_id text unique not null,
  customer_id text not null,
  customer_name text,
  machine_category text,
  machine_type text,
  vendor text,
  model text,
  serial_number text,
  machine_number text,
  machine_item text,
  install_date date,
  manufacture_date text,
  remarks text,
  photo_files jsonb,
  nameplate_files jsonb,
  quotation_count integer,
  work_order_count integer,
  report_count integer,
  quotation_history jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_machines_customer_id on machines(customer_id);
create index if not exists idx_machines_machine_item on machines(machine_item);
create index if not exists idx_machines_category on machines(machine_category);
create index if not exists idx_machines_vendor on machines(vendor);

alter table machines enable row level security;

create policy "Allow authenticated users to read machines" on machines
  for select to authenticated using (true);

create policy "Allow authenticated users to insert machines" on machines
  for insert to authenticated with check (true);

create policy "Allow authenticated users to update machines" on machines
  for update to authenticated using (true);
