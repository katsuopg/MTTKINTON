import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSuppliersTable() {
  console.log('Creating suppliers table...');
  
  try {
    // Create table
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (createTableError) {
      console.error('Error creating table:', createTableError);
      // テーブルが既に存在する場合はそのまま続行
      console.log('Table might already exist, continuing...');
    } else {
      console.log('Table created successfully');
    }

    // Enable RLS
    await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;'
    });

    // Create policies
    const policies = [
      {
        name: 'Enable read access for all users',
        sql: `
          CREATE POLICY "Enable read access for all users" ON public.suppliers
          FOR SELECT USING (true);
        `
      },
      {
        name: 'Enable insert for authenticated users only',
        sql: `
          CREATE POLICY "Enable insert for authenticated users only" ON public.suppliers
          FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
        `
      },
      {
        name: 'Enable update for authenticated users only',
        sql: `
          CREATE POLICY "Enable update for authenticated users only" ON public.suppliers
          FOR UPDATE USING (auth.uid() IS NOT NULL);
        `
      },
      {
        name: 'Enable delete for authenticated users only',
        sql: `
          CREATE POLICY "Enable delete for authenticated users only" ON public.suppliers
          FOR DELETE USING (auth.uid() IS NOT NULL);
        `
      }
    ];

    for (const policy of policies) {
      try {
        await supabase.rpc('exec_sql', { sql: policy.sql });
        console.log(`Created policy: ${policy.name}`);
      } catch (err) {
        console.log(`Policy might already exist: ${policy.name}`);
      }
    }

    // Create updated_at trigger
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.handle_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = TIMEZONE('utc', NOW());
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    await supabase.rpc('exec_sql', {
      sql: `
        CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON public.suppliers
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
      `
    });

    // Create indexes
    const indexes = [
      'CREATE INDEX idx_suppliers_supplier_id ON public.suppliers(supplier_id);',
      'CREATE INDEX idx_suppliers_company_name ON public.suppliers(company_name);',
      'CREATE INDEX idx_suppliers_company_name_en ON public.suppliers(company_name_en);',
      'CREATE INDEX idx_suppliers_kintone_record_id ON public.suppliers(kintone_record_id);'
    ];

    for (const index of indexes) {
      try {
        await supabase.rpc('exec_sql', { sql: index });
        console.log('Created index');
      } catch (err) {
        console.log('Index might already exist');
      }
    }

    console.log('Suppliers table setup completed!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createSuppliersTable();