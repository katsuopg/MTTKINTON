import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  }
});

async function setupSuppliersTable() {
  console.log('Setting up suppliers table...');
  console.log('Supabase URL:', supabaseUrl);
  
  try {
    // テーブルが存在するか確認
    const { data: existingTable, error: checkError } = await supabase
      .from('suppliers')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      console.log('Table does not exist. Please create it using Supabase Dashboard.');
      console.log('\nSQL to execute in Supabase Dashboard SQL Editor:\n');
      
      const sql = `-- Create suppliers table
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

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_updated_at ON public.suppliers;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_id ON public.suppliers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company_name ON public.suppliers(company_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_company_name_en ON public.suppliers(company_name_en);
CREATE INDEX IF NOT EXISTS idx_suppliers_kintone_record_id ON public.suppliers(kintone_record_id);`;
      
      console.log(sql);
      console.log('\nPlease copy and execute the above SQL in Supabase Dashboard.');
      console.log('Dashboard URL: https://supabase.com/dashboard/project/' + supabaseUrl.split('.')[0].split('//')[1]);
      return;
    }

    if (!checkError) {
      console.log('Suppliers table already exists!');
      
      // テーブル内のデータ件数を確認
      const { count, error: countError } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true });
      
      if (!countError) {
        console.log(`Current record count: ${count}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

setupSuppliersTable();