export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          company_name: string
          country: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          customer_rank: string | null
          fax_number: string | null
          id: string
          kintone_record_id: string
          notes: string | null
          payment_terms: string | null
          phone_number: string | null
          tax_id: string | null
          updated_at: string | null
          updated_by: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          company_name: string
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          customer_rank?: string | null
          fax_number?: string | null
          id?: string
          kintone_record_id: string
          notes?: string | null
          payment_terms?: string | null
          phone_number?: string | null
          tax_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          customer_rank?: string | null
          fax_number?: string | null
          id?: string
          kintone_record_id?: string
          notes?: string | null
          payment_terms?: string | null
          phone_number?: string | null
          tax_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          after_discount: number | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          customer_name: string | null
          discount: number | null
          grand_total: number | null
          id: string
          invoice_date: string | null
          invoice_no: string
          kintone_record_id: string
          status: string | null
          sub_total: number | null
          updated_at: string | null
          updated_by: string | null
          vat: number | null
          work_no: string
        }
        Insert: {
          after_discount?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          discount?: number | null
          grand_total?: number | null
          id?: string
          invoice_date?: string | null
          invoice_no: string
          kintone_record_id: string
          status?: string | null
          sub_total?: number | null
          updated_at?: string | null
          updated_by?: string | null
          vat?: number | null
          work_no: string
        }
        Update: {
          after_discount?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          discount?: number | null
          grand_total?: number | null
          id?: string
          invoice_date?: string | null
          invoice_no?: string
          kintone_record_id?: string
          status?: string | null
          sub_total?: number | null
          updated_at?: string | null
          updated_by?: string | null
          vat?: number | null
          work_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_invoice_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      machines: {
        Row: {
          created_at: string | null
          customer_id: string
          customer_name: string | null
          id: string
          install_date: string | null
          kintone_record_id: string
          machine_category: string | null
          machine_item: string | null
          machine_number: string | null
          machine_type: string | null
          manufacture_date: string | null
          model: string | null
          nameplate_files: Json | null
          photo_files: Json | null
          quotation_count: number | null
          quotation_history: Json | null
          remarks: string | null
          report_count: number | null
          serial_number: string | null
          updated_at: string | null
          vendor: string | null
          work_order_count: number | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          customer_name?: string | null
          id?: string
          install_date?: string | null
          kintone_record_id: string
          machine_category?: string | null
          machine_item?: string | null
          machine_number?: string | null
          machine_type?: string | null
          manufacture_date?: string | null
          model?: string | null
          nameplate_files?: Json | null
          photo_files?: Json | null
          quotation_count?: number | null
          quotation_history?: Json | null
          remarks?: string | null
          report_count?: number | null
          serial_number?: string | null
          updated_at?: string | null
          vendor?: string | null
          work_order_count?: number | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          customer_name?: string | null
          id?: string
          install_date?: string | null
          kintone_record_id?: string
          machine_category?: string | null
          machine_item?: string | null
          machine_number?: string | null
          machine_type?: string | null
          manufacture_date?: string | null
          model?: string | null
          nameplate_files?: Json | null
          photo_files?: Json | null
          quotation_count?: number | null
          quotation_history?: Json | null
          remarks?: string | null
          report_count?: number | null
          serial_number?: string | null
          updated_at?: string | null
          vendor?: string | null
          work_order_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "machines_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
        ]
      }
      project_electrical_parts: {
        Row: {
          brand: string | null
          created_at: string | null
          id: string
          item_no: number
          lead_time: string | null
          mark: string | null
          model: string | null
          name: string | null
          note: string | null
          qty: number | null
          section_id: string
          supplier: string | null
          total: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string | null
          id?: string
          item_no: number
          lead_time?: string | null
          mark?: string | null
          model?: string | null
          name?: string | null
          note?: string | null
          qty?: number | null
          section_id: string
          supplier?: string | null
          unit_price?: number | null
        }
        Update: {
          brand?: string | null
          created_at?: string | null
          id?: string
          item_no?: number
          lead_time?: string | null
          mark?: string | null
          model?: string | null
          name?: string | null
          note?: string | null
          qty?: number | null
          section_id?: string
          supplier?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_electrical_parts_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "project_part_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      project_mechanical_parts: {
        Row: {
          created_at: string | null
          dwg_no: string | null
          heat_treatment: string | null
          id: string
          lead_time: string | null
          material: string | null
          name: string | null
          no: number
          note: string | null
          order_type: string | null
          qty: number | null
          section_id: string
          surface_treatment: string | null
          total_price: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dwg_no?: string | null
          heat_treatment?: string | null
          id?: string
          lead_time?: string | null
          material?: string | null
          name?: string | null
          no: number
          note?: string | null
          order_type?: string | null
          qty?: number | null
          section_id: string
          surface_treatment?: string | null
          unit_price?: number | null
        }
        Update: {
          created_at?: string | null
          dwg_no?: string | null
          heat_treatment?: string | null
          id?: string
          lead_time?: string | null
          material?: string | null
          name?: string | null
          no?: number
          note?: string | null
          order_type?: string | null
          qty?: number | null
          section_id?: string
          surface_treatment?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_mechanical_parts_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "project_part_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      project_part_sections: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          section_name: string
          section_order: number
          section_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          section_name: string
          section_order: number
          section_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          section_name?: string
          section_order?: number
          section_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          company_name: string
          company_name_en: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          fax_number: string | null
          id: string
          kintone_record_id: string | null
          phone_number: string | null
          supplier_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          company_name: string
          company_name_en?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          fax_number?: string | null
          id?: string
          kintone_record_id?: string | null
          phone_number?: string | null
          supplier_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string
          company_name_en?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          fax_number?: string | null
          id?: string
          kintone_record_id?: string | null
          phone_number?: string | null
          supplier_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never