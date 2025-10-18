-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id VARCHAR(255) UNIQUE NOT NULL,
  company_name VARCHAR(500) NOT NULL,
  company_name_en VARCHAR(500),
  phone_number VARCHAR(100),
  fax_number VARCHAR(100),
  email VARCHAR(255),
  address TEXT,
  kintone_record_id VARCHAR(50) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.suppliers
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.suppliers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users only" ON public.suppliers
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users only" ON public.suppliers
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes
CREATE INDEX idx_suppliers_supplier_id ON public.suppliers(supplier_id);
CREATE INDEX idx_suppliers_company_name ON public.suppliers(company_name);
CREATE INDEX idx_suppliers_company_name_en ON public.suppliers(company_name_en);
CREATE INDEX idx_suppliers_kintone_record_id ON public.suppliers(kintone_record_id);