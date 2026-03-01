export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_features: {
        Row: {
          code: string
          created_at: string | null
          description_en: string | null
          description_ja: string | null
          description_th: string | null
          id: string
          is_active: boolean | null
          name_en: string | null
          name_ja: string
          name_th: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description_en?: string | null
          description_ja?: string | null
          description_th?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string | null
          name_ja: string
          name_th?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description_en?: string | null
          description_ja?: string | null
          description_th?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string | null
          name_ja?: string
          name_th?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      app_fields: {
        Row: {
          app_id: string
          col_index: number | null
          col_span: number | null
          created_at: string | null
          default_value: Json | null
          description: Json | null
          display_order: number | null
          field_code: string
          field_type: string
          id: string
          is_active: boolean | null
          label: Json
          options: Json | null
          required: boolean | null
          row_index: number | null
          unique_field: boolean | null
          updated_at: string | null
          validation: Json | null
        }
        Insert: {
          app_id: string
          col_index?: number | null
          col_span?: number | null
          created_at?: string | null
          default_value?: Json | null
          description?: Json | null
          display_order?: number | null
          field_code: string
          field_type: string
          id?: string
          is_active?: boolean | null
          label?: Json
          options?: Json | null
          required?: boolean | null
          row_index?: number | null
          unique_field?: boolean | null
          updated_at?: string | null
          validation?: Json | null
        }
        Update: {
          app_id?: string
          col_index?: number | null
          col_span?: number | null
          created_at?: string | null
          default_value?: Json | null
          description?: Json | null
          display_order?: number | null
          field_code?: string
          field_type?: string
          id?: string
          is_active?: boolean | null
          label?: Json
          options?: Json | null
          required?: boolean | null
          row_index?: number | null
          unique_field?: boolean | null
          updated_at?: string | null
          validation?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "app_fields_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      app_notification_rules: {
        Row: {
          app_id: string
          condition: Json | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          message_template: string | null
          name: string
          notify_target_field: string | null
          notify_target_id: string | null
          notify_type: string
          title_template: string | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          app_id: string
          condition?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message_template?: string | null
          name: string
          notify_target_field?: string | null
          notify_target_id?: string | null
          notify_type: string
          title_template?: string | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          app_id?: string
          condition?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          message_template?: string | null
          name?: string
          notify_target_field?: string | null
          notify_target_id?: string | null
          notify_type?: string
          title_template?: string | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_notification_rules_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      app_permissions: {
        Row: {
          app_id: string
          can_add: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_export: boolean | null
          can_import: boolean | null
          can_manage: boolean | null
          can_view: boolean | null
          created_at: string | null
          created_by: string | null
          id: string
          include_sub_organizations: boolean | null
          is_active: boolean | null
          priority: number | null
          target_id: string | null
          target_type: string
          updated_at: string | null
        }
        Insert: {
          app_id: string
          can_add?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          can_import?: boolean | null
          can_manage?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          include_sub_organizations?: boolean | null
          is_active?: boolean | null
          priority?: number | null
          target_id?: string | null
          target_type: string
          updated_at?: string | null
        }
        Update: {
          app_id?: string
          can_add?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          can_import?: boolean | null
          can_manage?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          include_sub_organizations?: boolean | null
          is_active?: boolean | null
          priority?: number | null
          target_id?: string | null
          target_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_permissions_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      app_record_comments: {
        Row: {
          app_id: string
          body: string
          created_at: string
          id: string
          is_deleted: boolean
          record_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          app_id: string
          body: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          record_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          app_id?: string
          body?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          record_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_record_comments_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      app_record_files: {
        Row: {
          app_id: string
          field_code: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string | null
          record_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          app_id: string
          field_code: string
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          mime_type?: string | null
          record_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          app_id?: string
          field_code?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string | null
          record_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_record_files_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      app_record_history: {
        Row: {
          app_id: string
          changed_at: string
          changed_by: string | null
          field_code: string
          id: string
          new_value: Json | null
          old_value: Json | null
          record_id: string
        }
        Insert: {
          app_id: string
          changed_at?: string
          changed_by?: string | null
          field_code: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          record_id: string
        }
        Update: {
          app_id?: string
          changed_at?: string
          changed_by?: string | null
          field_code?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_record_history_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      app_records: {
        Row: {
          app_id: string
          created_at: string | null
          created_by: string | null
          data: Json
          id: string
          record_number: number
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          app_id: string
          created_at?: string | null
          created_by?: string | null
          data?: Json
          id?: string
          record_number?: number
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          app_id?: string
          created_at?: string | null
          created_by?: string | null
          data?: Json
          id?: string
          record_number?: number
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_records_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      app_templates: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          name_en: string | null
          name_th: string | null
          template_data: Json
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          name_en?: string | null
          name_th?: string | null
          template_data?: Json
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          name_en?: string | null
          name_th?: string | null
          template_data?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      app_views: {
        Row: {
          app_id: string
          config: Json
          created_at: string
          created_by: string | null
          display_order: number
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          updated_at: string
          view_type: string
        }
        Insert: {
          app_id: string
          config?: Json
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          updated_at?: string
          view_type: string
        }
        Update: {
          app_id?: string
          config?: Json
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          updated_at?: string
          view_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_views_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      app_webhooks: {
        Row: {
          app_id: string
          created_at: string
          created_by: string | null
          headers: Json | null
          id: string
          is_active: boolean
          name: string
          trigger_type: string
          updated_at: string
          url: string
        }
        Insert: {
          app_id: string
          created_at?: string
          created_by?: string | null
          headers?: Json | null
          id?: string
          is_active?: boolean
          name: string
          trigger_type: string
          updated_at?: string
          url: string
        }
        Update: {
          app_id?: string
          created_at?: string
          created_by?: string | null
          headers?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          trigger_type?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_webhooks_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      apps: {
        Row: {
          app_type: string | null
          code: string
          color: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          display_order: number | null
          enable_bulk_delete: boolean
          enable_comments: boolean
          enable_history: boolean
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          name_en: string | null
          name_th: string | null
          table_name: string
          updated_at: string | null
        }
        Insert: {
          app_type?: string | null
          code: string
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          display_order?: number | null
          enable_bulk_delete?: boolean
          enable_comments?: boolean
          enable_history?: boolean
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_en?: string | null
          name_th?: string | null
          table_name: string
          updated_at?: string | null
        }
        Update: {
          app_type?: string | null
          code?: string
          color?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          display_order?: number | null
          enable_bulk_delete?: boolean
          enable_comments?: boolean
          enable_history?: boolean
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          name_th?: string | null
          table_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      buyers: {
        Row: {
          address: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          name_en: string | null
          name_kana: string | null
          organization_id: string | null
          phone_number: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_en?: string | null
          name_kana?: string | null
          organization_id?: string | null
          phone_number?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          name_kana?: string | null
          organization_id?: string | null
          phone_number?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_records: {
        Row: {
          arrival_date: string | null
          cost_status: string | null
          created_at: string
          customer_id: string | null
          description: string | null
          finish_date: string | null
          id: string
          invoice_date: string | null
          item_code: string | null
          kintone_record_id: string
          model_type: string | null
          payment_date: string | null
          payment_term: string | null
          po_date: string | null
          po_no: string | null
          quantity: number | null
          record_no: string | null
          registered_by: string | null
          start_date: string | null
          supplier_name: string | null
          total_amount: number | null
          unit: string | null
          unit_price: number | null
          updated_at: string
          wn_status: string | null
          work_no: string
        }
        Insert: {
          arrival_date?: string | null
          cost_status?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          finish_date?: string | null
          id?: string
          invoice_date?: string | null
          item_code?: string | null
          kintone_record_id: string
          model_type?: string | null
          payment_date?: string | null
          payment_term?: string | null
          po_date?: string | null
          po_no?: string | null
          quantity?: number | null
          record_no?: string | null
          registered_by?: string | null
          start_date?: string | null
          supplier_name?: string | null
          total_amount?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string
          wn_status?: string | null
          work_no: string
        }
        Update: {
          arrival_date?: string | null
          cost_status?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string | null
          finish_date?: string | null
          id?: string
          invoice_date?: string | null
          item_code?: string | null
          kintone_record_id?: string
          model_type?: string | null
          payment_date?: string | null
          payment_term?: string | null
          po_date?: string | null
          po_no?: string | null
          quantity?: number | null
          record_no?: string | null
          registered_by?: string | null
          start_date?: string | null
          supplier_name?: string | null
          total_amount?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string
          wn_status?: string | null
          work_no?: string
        }
        Relationships: []
      }
      customer_orders: {
        Row: {
          amount_after_discount: number | null
          amount_before_discount: number | null
          attachments: Json | null
          company_name: string | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          discount_amount: number | null
          id: string
          kintone_record_id: string
          mc_item: string | null
          model: string | null
          order_date: string | null
          po_number: string | null
          quotation_date: string | null
          quotation_no: string | null
          serial_no: string | null
          status: string | null
          subject: string | null
          total_amount: number | null
          updated_at: string | null
          updated_at_kintone: string | null
          vat: number | null
          vendor: string | null
          work_no: string | null
        }
        Insert: {
          amount_after_discount?: number | null
          amount_before_discount?: number | null
          attachments?: Json | null
          company_name?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          discount_amount?: number | null
          id?: string
          kintone_record_id: string
          mc_item?: string | null
          model?: string | null
          order_date?: string | null
          po_number?: string | null
          quotation_date?: string | null
          quotation_no?: string | null
          serial_no?: string | null
          status?: string | null
          subject?: string | null
          total_amount?: number | null
          updated_at?: string | null
          updated_at_kintone?: string | null
          vat?: number | null
          vendor?: string | null
          work_no?: string | null
        }
        Update: {
          amount_after_discount?: number | null
          amount_before_discount?: number | null
          attachments?: Json | null
          company_name?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          discount_amount?: number | null
          id?: string
          kintone_record_id?: string
          mc_item?: string | null
          model?: string | null
          order_date?: string | null
          po_number?: string | null
          quotation_date?: string | null
          quotation_no?: string | null
          serial_no?: string | null
          status?: string | null
          subject?: string | null
          total_amount?: number | null
          updated_at?: string | null
          updated_at_kintone?: string | null
          vat?: number | null
          vendor?: string | null
          work_no?: string | null
        }
        Relationships: []
      }
      customer_staff: {
        Row: {
          company_name: string | null
          created_at: string | null
          customer_id: string | null
          division: string | null
          email: string | null
          id: string
          kintone_record_id: string
          line_id: string | null
          notes: string | null
          organization_id: string | null
          position: string | null
          staff_name: string
          telephone: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          customer_id?: string | null
          division?: string | null
          email?: string | null
          id?: string
          kintone_record_id: string
          line_id?: string | null
          notes?: string | null
          organization_id?: string | null
          position?: string | null
          staff_name: string
          telephone?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          customer_id?: string | null
          division?: string | null
          email?: string | null
          id?: string
          kintone_record_id?: string
          line_id?: string | null
          notes?: string | null
          organization_id?: string | null
          position?: string | null
          staff_name?: string
          telephone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
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
          organization_id: string | null
          payment_terms: string | null
          phone_number: string | null
          postal_code: string | null
          short_name: string | null
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
          organization_id?: string | null
          payment_terms?: string | null
          phone_number?: string | null
          postal_code?: string | null
          short_name?: string | null
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
          organization_id?: string | null
          payment_terms?: string | null
          phone_number?: string | null
          postal_code?: string | null
          short_name?: string | null
          tax_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dom_elec_items: {
        Row: {
          actual_delivery_date: string | null
          amount: number | null
          category: string
          created_at: string | null
          created_by: string | null
          desired_delivery_date: string | null
          dom_header_id: string
          id: string
          is_deleted: boolean | null
          item_number: number
          lead_time_days: number | null
          manufacturer: string | null
          mark: string | null
          model_number: string | null
          notes: string | null
          order_deadline: string | null
          part_name: string | null
          quantity: number
          sort_order: number
          status: string
          supplier_delivery_date: string | null
          unit: string
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          amount?: number | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          desired_delivery_date?: string | null
          dom_header_id: string
          id?: string
          is_deleted?: boolean | null
          item_number?: number
          lead_time_days?: number | null
          manufacturer?: string | null
          mark?: string | null
          model_number?: string | null
          notes?: string | null
          order_deadline?: string | null
          part_name?: string | null
          quantity?: number
          sort_order?: number
          status?: string
          supplier_delivery_date?: string | null
          unit?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          amount?: number | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          desired_delivery_date?: string | null
          dom_header_id?: string
          id?: string
          is_deleted?: boolean | null
          item_number?: number
          lead_time_days?: number | null
          manufacturer?: string | null
          mark?: string | null
          model_number?: string | null
          notes?: string | null
          order_deadline?: string | null
          part_name?: string | null
          quantity?: number
          sort_order?: number
          status?: string
          supplier_delivery_date?: string | null
          unit?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dom_elec_items_dom_header_id_fkey"
            columns: ["dom_header_id"]
            isOneToOne: false
            referencedRelation: "dom_headers"
            referencedColumns: ["id"]
          },
        ]
      }
      dom_headers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          checked_at: string | null
          checked_by: string | null
          created_at: string | null
          created_by: string | null
          customer_name: string | null
          designed_at: string | null
          designed_by: string | null
          id: string
          machine_model: string | null
          machine_name: string | null
          notes: string | null
          project_deadline: string | null
          project_id: string
          status: string
          total_cost: number | null
          updated_at: string | null
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          designed_at?: string | null
          designed_by?: string | null
          id?: string
          machine_model?: string | null
          machine_name?: string | null
          notes?: string | null
          project_deadline?: string | null
          project_id: string
          status?: string
          total_cost?: number | null
          updated_at?: string | null
          version?: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          designed_at?: string | null
          designed_by?: string | null
          id?: string
          machine_model?: string | null
          machine_name?: string | null
          notes?: string | null
          project_deadline?: string | null
          project_id?: string
          status?: string
          total_cost?: number | null
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "dom_headers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      dom_item_files: {
        Row: {
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          item_id: string
          item_type: string
          revision: number | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string
          id?: string
          item_id: string
          item_type: string
          revision?: number | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          item_id?: string
          item_type?: string
          revision?: number | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      dom_labor: {
        Row: {
          amount: number | null
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          discipline: string
          dom_header_id: string
          hourly_rate: number
          hours: number
          id: string
          is_deleted: boolean | null
          notes: string | null
          sort_order: number
          updated_at: string | null
          work_type: string
        }
        Insert: {
          amount?: number | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discipline: string
          dom_header_id: string
          hourly_rate?: number
          hours?: number
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          sort_order?: number
          updated_at?: string | null
          work_type: string
        }
        Update: {
          amount?: number | null
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discipline?: string
          dom_header_id?: string
          hourly_rate?: number
          hours?: number
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          sort_order?: number
          updated_at?: string | null
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dom_labor_dom_header_id_fkey"
            columns: ["dom_header_id"]
            isOneToOne: false
            referencedRelation: "dom_headers"
            referencedColumns: ["id"]
          },
        ]
      }
      dom_mech_items: {
        Row: {
          actual_delivery_date: string | null
          amount: number | null
          category: string
          created_at: string | null
          created_by: string | null
          desired_delivery_date: string | null
          dom_section_id: string
          heat_treatment_id: string | null
          id: string
          is_deleted: boolean | null
          item_number: number
          item_type: string | null
          lead_time_days: number | null
          manufacturer: string | null
          material_id: string | null
          model_number: string | null
          notes: string | null
          order_deadline: string | null
          parent_id: string | null
          part_code: string | null
          part_name: string | null
          quantity: number
          revision: number
          sort_order: number
          status: string
          supplier_delivery_date: string | null
          surface_treatment_id: string | null
          unit: string
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          amount?: number | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          desired_delivery_date?: string | null
          dom_section_id: string
          heat_treatment_id?: string | null
          id?: string
          is_deleted?: boolean | null
          item_number?: number
          item_type?: string | null
          lead_time_days?: number | null
          manufacturer?: string | null
          material_id?: string | null
          model_number?: string | null
          notes?: string | null
          order_deadline?: string | null
          parent_id?: string | null
          part_code?: string | null
          part_name?: string | null
          quantity?: number
          revision?: number
          sort_order?: number
          status?: string
          supplier_delivery_date?: string | null
          surface_treatment_id?: string | null
          unit?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          amount?: number | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          desired_delivery_date?: string | null
          dom_section_id?: string
          heat_treatment_id?: string | null
          id?: string
          is_deleted?: boolean | null
          item_number?: number
          item_type?: string | null
          lead_time_days?: number | null
          manufacturer?: string | null
          material_id?: string | null
          model_number?: string | null
          notes?: string | null
          order_deadline?: string | null
          parent_id?: string | null
          part_code?: string | null
          part_name?: string | null
          quantity?: number
          revision?: number
          sort_order?: number
          status?: string
          supplier_delivery_date?: string | null
          surface_treatment_id?: string | null
          unit?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dom_mech_items_dom_section_id_fkey"
            columns: ["dom_section_id"]
            isOneToOne: false
            referencedRelation: "dom_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dom_mech_items_heat_treatment_id_fkey"
            columns: ["heat_treatment_id"]
            isOneToOne: false
            referencedRelation: "master_heat_treatments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dom_mech_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "master_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dom_mech_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "dom_mech_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dom_mech_items_surface_treatment_id_fkey"
            columns: ["surface_treatment_id"]
            isOneToOne: false
            referencedRelation: "master_surface_treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      dom_sections: {
        Row: {
          created_at: string | null
          dom_header_id: string
          id: string
          notes: string | null
          section_code: string
          section_name: string | null
          section_number: number
          sort_order: number
          subtotal: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dom_header_id: string
          id?: string
          notes?: string | null
          section_code: string
          section_name?: string | null
          section_number: number
          sort_order?: number
          subtotal?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dom_header_id?: string
          id?: string
          notes?: string | null
          section_code?: string
          section_name?: string | null
          section_number?: number
          sort_order?: number
          subtotal?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dom_sections_dom_header_id_fkey"
            columns: ["dom_header_id"]
            isOneToOne: false
            referencedRelation: "dom_headers"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          bank_account: string | null
          bank_book_files: Json | null
          birth_date: string | null
          company_email: string | null
          created_at: string | null
          created_by: string | null
          date_of_birth: string | null
          department: string | null
          driver_license_expiry_date: string | null
          driver_license_number: string | null
          driver_license_type: string | null
          email: string | null
          emergency_contact_address: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          emergency_contact_tel: string | null
          employee_number: string | null
          employment_type: string | null
          first_name: string | null
          first_name_th: string | null
          gender: string | null
          hire_date: string | null
          id: string
          id_expiry: string | null
          id_expiry_date: string | null
          id_image_url: string | null
          id_number: string | null
          kintone_id: string | null
          kintone_record_id: string | null
          last_name: string | null
          last_name_th: string | null
          license_expiry: string | null
          license_number: string | null
          marital_status: string | null
          mobile: string | null
          name: string
          name_th: string | null
          name_thai: string | null
          nationality: string | null
          nickname: string | null
          passport_expiry: string | null
          passport_expiry_date: string | null
          passport_image_url: string | null
          passport_issue_date: string | null
          passport_number: string | null
          position: string | null
          postal_code: string | null
          profile_image_url: string | null
          resign_date: string | null
          resume_files: Json | null
          salary_amount: number | null
          salary_type: string | null
          status: string | null
          tel: string | null
          updated_at: string | null
          updated_by: string | null
          user_id: string | null
          visa_expiry: string | null
          visa_expiry_date: string | null
          visa_image_url: string | null
          visa_number: string | null
          visa_type: string | null
          work_permit_expiry: string | null
          work_permit_image_url: string | null
          work_permit_number: string | null
        }
        Insert: {
          address?: string | null
          bank_account?: string | null
          bank_book_files?: Json | null
          birth_date?: string | null
          company_email?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          department?: string | null
          driver_license_expiry_date?: string | null
          driver_license_number?: string | null
          driver_license_type?: string | null
          email?: string | null
          emergency_contact_address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          emergency_contact_tel?: string | null
          employee_number?: string | null
          employment_type?: string | null
          first_name?: string | null
          first_name_th?: string | null
          gender?: string | null
          hire_date?: string | null
          id?: string
          id_expiry?: string | null
          id_expiry_date?: string | null
          id_image_url?: string | null
          id_number?: string | null
          kintone_id?: string | null
          kintone_record_id?: string | null
          last_name?: string | null
          last_name_th?: string | null
          license_expiry?: string | null
          license_number?: string | null
          marital_status?: string | null
          mobile?: string | null
          name: string
          name_th?: string | null
          name_thai?: string | null
          nationality?: string | null
          nickname?: string | null
          passport_expiry?: string | null
          passport_expiry_date?: string | null
          passport_image_url?: string | null
          passport_issue_date?: string | null
          passport_number?: string | null
          position?: string | null
          postal_code?: string | null
          profile_image_url?: string | null
          resign_date?: string | null
          resume_files?: Json | null
          salary_amount?: number | null
          salary_type?: string | null
          status?: string | null
          tel?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string | null
          visa_expiry?: string | null
          visa_expiry_date?: string | null
          visa_image_url?: string | null
          visa_number?: string | null
          visa_type?: string | null
          work_permit_expiry?: string | null
          work_permit_image_url?: string | null
          work_permit_number?: string | null
        }
        Update: {
          address?: string | null
          bank_account?: string | null
          bank_book_files?: Json | null
          birth_date?: string | null
          company_email?: string | null
          created_at?: string | null
          created_by?: string | null
          date_of_birth?: string | null
          department?: string | null
          driver_license_expiry_date?: string | null
          driver_license_number?: string | null
          driver_license_type?: string | null
          email?: string | null
          emergency_contact_address?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          emergency_contact_tel?: string | null
          employee_number?: string | null
          employment_type?: string | null
          first_name?: string | null
          first_name_th?: string | null
          gender?: string | null
          hire_date?: string | null
          id?: string
          id_expiry?: string | null
          id_expiry_date?: string | null
          id_image_url?: string | null
          id_number?: string | null
          kintone_id?: string | null
          kintone_record_id?: string | null
          last_name?: string | null
          last_name_th?: string | null
          license_expiry?: string | null
          license_number?: string | null
          marital_status?: string | null
          mobile?: string | null
          name?: string
          name_th?: string | null
          name_thai?: string | null
          nationality?: string | null
          nickname?: string | null
          passport_expiry?: string | null
          passport_expiry_date?: string | null
          passport_image_url?: string | null
          passport_issue_date?: string | null
          passport_number?: string | null
          position?: string | null
          postal_code?: string | null
          profile_image_url?: string | null
          resign_date?: string | null
          resume_files?: Json | null
          salary_amount?: number | null
          salary_type?: string | null
          status?: string | null
          tel?: string | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string | null
          visa_expiry?: string | null
          visa_expiry_date?: string | null
          visa_image_url?: string | null
          visa_number?: string | null
          visa_type?: string | null
          work_permit_expiry?: string | null
          work_permit_image_url?: string | null
          work_permit_number?: string | null
        }
        Relationships: []
      }
      field_permissions: {
        Row: {
          access_level: string
          app_id: string
          created_at: string | null
          created_by: string | null
          field_label: string | null
          field_name: string
          id: string
          include_sub_organizations: boolean | null
          is_active: boolean | null
          priority: number | null
          target_id: string | null
          target_type: string
          updated_at: string | null
        }
        Insert: {
          access_level: string
          app_id: string
          created_at?: string | null
          created_by?: string | null
          field_label?: string | null
          field_name: string
          id?: string
          include_sub_organizations?: boolean | null
          is_active?: boolean | null
          priority?: number | null
          target_id?: string | null
          target_type: string
          updated_at?: string | null
        }
        Update: {
          access_level?: string
          app_id?: string
          created_at?: string | null
          created_by?: string | null
          field_label?: string | null
          field_name?: string
          id?: string
          include_sub_organizations?: boolean | null
          is_active?: boolean | null
          priority?: number | null
          target_id?: string | null
          target_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_permissions_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          after_discount: number | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          customer_name: string | null
          customer_ref_no: string | null
          delivery_date: string | null
          description: string | null
          detail: string | null
          discount: number | null
          due_date: string | null
          grand_total: number | null
          id: string
          invoice_date: string | null
          invoice_no: string
          kintone_record_id: string
          organization_id: string | null
          payment_date: string | null
          payment_terms: string | null
          period: string | null
          po_no: string | null
          repair_description: string | null
          status: string | null
          sub_total: number | null
          tax_rate: number | null
          updated_at: string | null
          updated_by: string | null
          vat: number | null
          vat_price: number | null
          wht: string | null
          wht_price: number | null
          wht_rate: number | null
          work_no: string
        }
        Insert: {
          after_discount?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_ref_no?: string | null
          delivery_date?: string | null
          description?: string | null
          detail?: string | null
          discount?: number | null
          due_date?: string | null
          grand_total?: number | null
          id?: string
          invoice_date?: string | null
          invoice_no: string
          kintone_record_id: string
          organization_id?: string | null
          payment_date?: string | null
          payment_terms?: string | null
          period?: string | null
          po_no?: string | null
          repair_description?: string | null
          status?: string | null
          sub_total?: number | null
          tax_rate?: number | null
          updated_at?: string | null
          updated_by?: string | null
          vat?: number | null
          vat_price?: number | null
          wht?: string | null
          wht_price?: number | null
          wht_rate?: number | null
          work_no: string
        }
        Update: {
          after_discount?: number | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_ref_no?: string | null
          delivery_date?: string | null
          description?: string | null
          detail?: string | null
          discount?: number | null
          due_date?: string | null
          grand_total?: number | null
          id?: string
          invoice_date?: string | null
          invoice_no?: string
          kintone_record_id?: string
          organization_id?: string | null
          payment_date?: string | null
          payment_terms?: string | null
          period?: string | null
          po_no?: string | null
          repair_description?: string | null
          status?: string | null
          sub_total?: number | null
          tax_rate?: number | null
          updated_at?: string | null
          updated_by?: string | null
          vat?: number | null
          vat_price?: number | null
          wht?: string | null
          wht_price?: number | null
          wht_rate?: number | null
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
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          buyer_id: string | null
          commission: number | null
          construction_number: string | null
          created_at: string | null
          customer_id: string
          customer_name: string | null
          id: string
          install_date: string | null
          is_new_or_used: string | null
          kintone_record_id: string
          machine_category: string | null
          machine_item: string | null
          machine_number: string | null
          machine_type: string | null
          manufacture_date: string | null
          model: string | null
          nameplate_files: Json | null
          notes: string | null
          organization_id: string | null
          photo_files: Json | null
          purchase_amount: number | null
          purchase_currency: string | null
          purchase_date: string | null
          purchase_expenses: number | null
          purchasing_staff: string | null
          quotation_count: number | null
          quotation_history: Json | null
          remarks: string | null
          report_count: number | null
          sales_date: string | null
          sales_representative_id: string | null
          serial_number: string | null
          supplier_id: string | null
          supplier_notes: string | null
          total_purchase: number | null
          updated_at: string | null
          vendor: string | null
          work_order_count: number | null
        }
        Insert: {
          buyer_id?: string | null
          commission?: number | null
          construction_number?: string | null
          created_at?: string | null
          customer_id: string
          customer_name?: string | null
          id?: string
          install_date?: string | null
          is_new_or_used?: string | null
          kintone_record_id: string
          machine_category?: string | null
          machine_item?: string | null
          machine_number?: string | null
          machine_type?: string | null
          manufacture_date?: string | null
          model?: string | null
          nameplate_files?: Json | null
          notes?: string | null
          organization_id?: string | null
          photo_files?: Json | null
          purchase_amount?: number | null
          purchase_currency?: string | null
          purchase_date?: string | null
          purchase_expenses?: number | null
          purchasing_staff?: string | null
          quotation_count?: number | null
          quotation_history?: Json | null
          remarks?: string | null
          report_count?: number | null
          sales_date?: string | null
          sales_representative_id?: string | null
          serial_number?: string | null
          supplier_id?: string | null
          supplier_notes?: string | null
          total_purchase?: number | null
          updated_at?: string | null
          vendor?: string | null
          work_order_count?: number | null
        }
        Update: {
          buyer_id?: string | null
          commission?: number | null
          construction_number?: string | null
          created_at?: string | null
          customer_id?: string
          customer_name?: string | null
          id?: string
          install_date?: string | null
          is_new_or_used?: string | null
          kintone_record_id?: string
          machine_category?: string | null
          machine_item?: string | null
          machine_number?: string | null
          machine_type?: string | null
          manufacture_date?: string | null
          model?: string | null
          nameplate_files?: Json | null
          notes?: string | null
          organization_id?: string | null
          photo_files?: Json | null
          purchase_amount?: number | null
          purchase_currency?: string | null
          purchase_date?: string | null
          purchase_expenses?: number | null
          purchasing_staff?: string | null
          quotation_count?: number | null
          quotation_history?: Json | null
          remarks?: string | null
          report_count?: number | null
          sales_date?: string | null
          sales_representative_id?: string | null
          serial_number?: string | null
          supplier_id?: string | null
          supplier_notes?: string | null
          total_purchase?: number | null
          updated_at?: string | null
          vendor?: string | null
          work_order_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "machines_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machines_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "machines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machines_sales_representative_id_fkey"
            columns: ["sales_representative_id"]
            isOneToOne: false
            referencedRelation: "sales_representatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machines_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      master_heat_treatments: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          method: string | null
          name: string
          name_en: string | null
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          method?: string | null
          name: string
          name_en?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          method?: string | null
          name?: string
          name_en?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      master_materials: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name_en: string | null
          name_ja: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string | null
          name_ja: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string | null
          name_ja?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      master_surface_treatments: {
        Row: {
          category: string | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          name_en: string | null
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_en?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      menu_configurations: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          is_visible: boolean
          menu_key: string
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean
          menu_key: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean
          menu_key?: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          metadata: Json | null
          read_at: string | null
          related_id: string | null
          related_table: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          metadata?: Json | null
          read_at?: string | null
          related_id?: string | null
          related_table?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          metadata?: Json | null
          read_at?: string | null
          related_id?: string | null
          related_table?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string | null
          employee_id: string
          id: string
          is_active: boolean | null
          joined_at: string | null
          left_at: string | null
          organization_id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          organization_id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          organization_id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          manager_id: string | null
          name: string
          name_en: string | null
          name_th: string | null
          parent_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name: string
          name_en?: string | null
          name_th?: string | null
          parent_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name?: string
          name_en?: string | null
          name_th?: string | null
          parent_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      part_categories: {
        Row: {
          code: string
          created_at: string | null
          has_sections: boolean | null
          id: string
          name: string
          name_en: string | null
          name_th: string | null
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          has_sections?: boolean | null
          id?: string
          name: string
          name_en?: string | null
          name_th?: string | null
          sort_order: number
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          has_sections?: boolean | null
          id?: string
          name?: string
          name_en?: string | null
          name_th?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      part_list_items: {
        Row: {
          category_id: string
          created_at: string | null
          created_by: string | null
          drawing_no: string | null
          id: string
          is_deleted: boolean | null
          manufacturer: string | null
          model_number: string | null
          part_name: string | null
          part_number: string | null
          project_code: string
          quantity: number
          remarks: string | null
          section_id: string | null
          sort_order: number
          unit: string | null
          unit_price: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          created_by?: string | null
          drawing_no?: string | null
          id?: string
          is_deleted?: boolean | null
          manufacturer?: string | null
          model_number?: string | null
          part_name?: string | null
          part_number?: string | null
          project_code: string
          quantity?: number
          remarks?: string | null
          section_id?: string | null
          sort_order?: number
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          created_by?: string | null
          drawing_no?: string | null
          id?: string
          is_deleted?: boolean | null
          manufacturer?: string | null
          model_number?: string | null
          part_name?: string | null
          part_number?: string | null
          project_code?: string
          quantity?: number
          remarks?: string | null
          section_id?: string | null
          sort_order?: number
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "part_list_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "part_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_list_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "part_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      part_sections: {
        Row: {
          category_id: string
          created_at: string | null
          created_by: string | null
          id: string
          project_code: string
          section_code: string
          section_name: string | null
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_code: string
          section_code: string
          section_name?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          project_code?: string
          section_code?: string
          section_name?: string | null
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "part_sections_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "part_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      po_line_items: {
        Row: {
          amount: number | null
          description: string | null
          id: string
          item_no: string | null
          kintone_row_id: string | null
          line_date_1: string | null
          line_date_2: string | null
          line_payment: string | null
          line_status: string | null
          notes: string | null
          po_record_id: string
          quantity: number | null
          sort_order: number | null
          unit: string | null
          unit_price: number | null
        }
        Insert: {
          amount?: number | null
          description?: string | null
          id?: string
          item_no?: string | null
          kintone_row_id?: string | null
          line_date_1?: string | null
          line_date_2?: string | null
          line_payment?: string | null
          line_status?: string | null
          notes?: string | null
          po_record_id: string
          quantity?: number | null
          sort_order?: number | null
          unit?: string | null
          unit_price?: number | null
        }
        Update: {
          amount?: number | null
          description?: string | null
          id?: string
          item_no?: string | null
          kintone_row_id?: string | null
          line_date_1?: string | null
          line_date_2?: string | null
          line_payment?: string | null
          line_status?: string | null
          notes?: string | null
          po_record_id?: string
          quantity?: number | null
          sort_order?: number | null
          unit?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "po_line_items_po_record_id_fkey"
            columns: ["po_record_id"]
            isOneToOne: false
            referencedRelation: "po_records"
            referencedColumns: ["id"]
          },
        ]
      }
      po_records: {
        Row: {
          approval_status: string | null
          created_at: string | null
          cs_id: string | null
          data_status: string | null
          date_1: string | null
          date_2: string | null
          date_3: string | null
          date_4: string | null
          date_5: string | null
          date_6: string | null
          date_7: string | null
          delivery_date: string | null
          discount: number | null
          forward: string | null
          grand_total: number | null
          id: string
          kintone_record_id: string
          mc_item: string | null
          model: string | null
          payment_term: string | null
          po_date: string | null
          po_no: string | null
          po_status: string | null
          qt_no: string | null
          requester: string | null
          subject: string | null
          subtotal: number | null
          supplier_name: string | null
          updated_at: string | null
          work_no: string | null
        }
        Insert: {
          approval_status?: string | null
          created_at?: string | null
          cs_id?: string | null
          data_status?: string | null
          date_1?: string | null
          date_2?: string | null
          date_3?: string | null
          date_4?: string | null
          date_5?: string | null
          date_6?: string | null
          date_7?: string | null
          delivery_date?: string | null
          discount?: number | null
          forward?: string | null
          grand_total?: number | null
          id?: string
          kintone_record_id: string
          mc_item?: string | null
          model?: string | null
          payment_term?: string | null
          po_date?: string | null
          po_no?: string | null
          po_status?: string | null
          qt_no?: string | null
          requester?: string | null
          subject?: string | null
          subtotal?: number | null
          supplier_name?: string | null
          updated_at?: string | null
          work_no?: string | null
        }
        Update: {
          approval_status?: string | null
          created_at?: string | null
          cs_id?: string | null
          data_status?: string | null
          date_1?: string | null
          date_2?: string | null
          date_3?: string | null
          date_4?: string | null
          date_5?: string | null
          date_6?: string | null
          date_7?: string | null
          delivery_date?: string | null
          discount?: number | null
          forward?: string | null
          grand_total?: number | null
          id?: string
          kintone_record_id?: string
          mc_item?: string | null
          model?: string | null
          payment_term?: string | null
          po_date?: string | null
          po_no?: string | null
          po_status?: string | null
          qt_no?: string | null
          requester?: string | null
          subject?: string | null
          subtotal?: number | null
          supplier_name?: string | null
          updated_at?: string | null
          work_no?: string | null
        }
        Relationships: []
      }
      process_action_executors: {
        Row: {
          entity_code: string | null
          entity_type: string
          id: string
          include_subs: boolean | null
          process_action_id: string
        }
        Insert: {
          entity_code?: string | null
          entity_type: string
          id?: string
          include_subs?: boolean | null
          process_action_id: string
        }
        Update: {
          entity_code?: string | null
          entity_type?: string
          id?: string
          include_subs?: boolean | null
          process_action_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_action_executors_process_action_id_fkey"
            columns: ["process_action_id"]
            isOneToOne: false
            referencedRelation: "process_actions"
            referencedColumns: ["id"]
          },
        ]
      }
      process_action_logs: {
        Row: {
          action_id: string
          comment: string | null
          executed_at: string | null
          executed_by: string
          from_status_id: string
          id: string
          record_id: string
          record_table: string
          to_status_id: string
        }
        Insert: {
          action_id: string
          comment?: string | null
          executed_at?: string | null
          executed_by: string
          from_status_id: string
          id?: string
          record_id: string
          record_table?: string
          to_status_id: string
        }
        Update: {
          action_id?: string
          comment?: string | null
          executed_at?: string | null
          executed_by?: string
          from_status_id?: string
          id?: string
          record_id?: string
          record_table?: string
          to_status_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_action_logs_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "process_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_action_logs_from_status_id_fkey"
            columns: ["from_status_id"]
            isOneToOne: false
            referencedRelation: "process_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_action_logs_to_status_id_fkey"
            columns: ["to_status_id"]
            isOneToOne: false
            referencedRelation: "process_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      process_actions: {
        Row: {
          action_type: string | null
          display_order: number | null
          filter_condition: string | null
          from_status_id: string
          id: string
          name: string
          process_definition_id: string
          requirement_type: string | null
          to_status_id: string
        }
        Insert: {
          action_type?: string | null
          display_order?: number | null
          filter_condition?: string | null
          from_status_id: string
          id?: string
          name: string
          process_definition_id: string
          requirement_type?: string | null
          to_status_id: string
        }
        Update: {
          action_type?: string | null
          display_order?: number | null
          filter_condition?: string | null
          from_status_id?: string
          id?: string
          name?: string
          process_definition_id?: string
          requirement_type?: string | null
          to_status_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_actions_from_status_id_fkey"
            columns: ["from_status_id"]
            isOneToOne: false
            referencedRelation: "process_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_actions_process_definition_id_fkey"
            columns: ["process_definition_id"]
            isOneToOne: false
            referencedRelation: "process_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_actions_to_status_id_fkey"
            columns: ["to_status_id"]
            isOneToOne: false
            referencedRelation: "process_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      process_definitions: {
        Row: {
          app_id: string
          created_at: string | null
          enabled: boolean | null
          id: string
          revision: number | null
          updated_at: string | null
        }
        Insert: {
          app_id: string
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          revision?: number | null
          updated_at?: string | null
        }
        Update: {
          app_id?: string
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          revision?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_definitions_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: true
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      process_status_assignees: {
        Row: {
          entity_code: string | null
          entity_type: string
          id: string
          include_subs: boolean | null
          process_status_id: string
        }
        Insert: {
          entity_code?: string | null
          entity_type: string
          id?: string
          include_subs?: boolean | null
          process_status_id: string
        }
        Update: {
          entity_code?: string | null
          entity_type?: string
          id?: string
          include_subs?: boolean | null
          process_status_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_status_assignees_process_status_id_fkey"
            columns: ["process_status_id"]
            isOneToOne: false
            referencedRelation: "process_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      process_statuses: {
        Row: {
          assignee_type: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_final: boolean | null
          is_initial: boolean | null
          name: string
          process_definition_id: string
        }
        Insert: {
          assignee_type?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_final?: boolean | null
          is_initial?: boolean | null
          name: string
          process_definition_id: string
        }
        Update: {
          assignee_type?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_final?: boolean | null
          is_initial?: boolean | null
          name?: string
          process_definition_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_statuses_process_definition_id_fkey"
            columns: ["process_definition_id"]
            isOneToOne: false
            referencedRelation: "process_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
          total?: number | null
          unit_price?: number | null
          updated_at?: string | null
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
          total?: number | null
          unit_price?: number | null
          updated_at?: string | null
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
      project_files: {
        Row: {
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          project_id: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          project_id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string | null
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
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string | null
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
      project_statuses: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_terminal: boolean | null
          name: string
          name_en: string | null
          name_th: string | null
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_terminal?: boolean | null
          name: string
          name_en?: string | null
          name_th?: string | null
          sort_order: number
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_terminal?: boolean | null
          name?: string
          name_en?: string | null
          name_th?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_code: string | null
          customer_name: string | null
          description: string | null
          due_date: string | null
          id: string
          project_code: string
          project_name: string
          sales_person_id: string | null
          start_date: string | null
          status_id: string
          updated_at: string | null
          updated_by: string | null
          work_no: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_code?: string | null
          customer_name?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          project_code: string
          project_name: string
          sales_person_id?: string | null
          start_date?: string | null
          status_id: string
          updated_at?: string | null
          updated_by?: string | null
          work_no?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_code?: string | null
          customer_name?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          project_code?: string
          project_name?: string
          sales_person_id?: string | null
          start_date?: string | null
          status_id?: string
          updated_at?: string | null
          updated_by?: string | null
          work_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_sales_person_id_fkey"
            columns: ["sales_person_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "project_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          cc: string | null
          company_name: string | null
          contact_person: string | null
          cost_total: number | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          delivery_date: string | null
          discount: number | null
          expected_order_date: string | null
          grand_total: number | null
          gross_profit: number | null
          gross_profit_rate: string | null
          id: string
          kintone_record_id: string
          machine_no: string | null
          model: string | null
          other_total: number | null
          payment_terms_1: string | null
          payment_terms_2: string | null
          payment_terms_3: string | null
          probability: string | null
          project_name: string | null
          quotation_date: string | null
          quotation_no: string | null
          remarks: string | null
          sales_forecast: string | null
          sales_profit: number | null
          sales_profit_rate: string | null
          sales_staff: string | null
          serial_no: string | null
          status: string | null
          sub_total: number | null
          title: string | null
          type: string | null
          updated_at: string | null
          valid_until: string | null
          vendor: string | null
          work_no: string | null
        }
        Insert: {
          cc?: string | null
          company_name?: string | null
          contact_person?: string | null
          cost_total?: number | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          delivery_date?: string | null
          discount?: number | null
          expected_order_date?: string | null
          grand_total?: number | null
          gross_profit?: number | null
          gross_profit_rate?: string | null
          id?: string
          kintone_record_id: string
          machine_no?: string | null
          model?: string | null
          other_total?: number | null
          payment_terms_1?: string | null
          payment_terms_2?: string | null
          payment_terms_3?: string | null
          probability?: string | null
          project_name?: string | null
          quotation_date?: string | null
          quotation_no?: string | null
          remarks?: string | null
          sales_forecast?: string | null
          sales_profit?: number | null
          sales_profit_rate?: string | null
          sales_staff?: string | null
          serial_no?: string | null
          status?: string | null
          sub_total?: number | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          valid_until?: string | null
          vendor?: string | null
          work_no?: string | null
        }
        Update: {
          cc?: string | null
          company_name?: string | null
          contact_person?: string | null
          cost_total?: number | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          delivery_date?: string | null
          discount?: number | null
          expected_order_date?: string | null
          grand_total?: number | null
          gross_profit?: number | null
          gross_profit_rate?: string | null
          id?: string
          kintone_record_id?: string
          machine_no?: string | null
          model?: string | null
          other_total?: number | null
          payment_terms_1?: string | null
          payment_terms_2?: string | null
          payment_terms_3?: string | null
          probability?: string | null
          project_name?: string | null
          quotation_date?: string | null
          quotation_no?: string | null
          remarks?: string | null
          sales_forecast?: string | null
          sales_profit?: number | null
          sales_profit_rate?: string | null
          sales_staff?: string | null
          serial_no?: string | null
          status?: string | null
          sub_total?: number | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          valid_until?: string | null
          vendor?: string | null
          work_no?: string | null
        }
        Relationships: []
      }
      quote_request_files: {
        Row: {
          created_at: string | null
          created_by: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          mime_type: string | null
          offer_id: string | null
          quote_request_id: string | null
          quote_request_item_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          mime_type?: string | null
          offer_id?: string | null
          quote_request_id?: string | null
          quote_request_item_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          mime_type?: string | null
          offer_id?: string | null
          quote_request_id?: string | null
          quote_request_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_request_files_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "quote_request_item_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_request_files_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_request_files_quote_request_item_id_fkey"
            columns: ["quote_request_item_id"]
            isOneToOne: false
            referencedRelation: "quote_request_items"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_request_item_offers: {
        Row: {
          awarded_at: string | null
          awarded_by: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_awarded: boolean | null
          lead_time_days: number | null
          purchaser_remarks: string | null
          quote_request_item_id: string
          quoted_delivery_date: string | null
          quoted_price: number | null
          quoted_unit_price: number | null
          supplier_code: string | null
          supplier_name: string | null
          updated_at: string | null
        }
        Insert: {
          awarded_at?: string | null
          awarded_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_awarded?: boolean | null
          lead_time_days?: number | null
          purchaser_remarks?: string | null
          quote_request_item_id: string
          quoted_delivery_date?: string | null
          quoted_price?: number | null
          quoted_unit_price?: number | null
          supplier_code?: string | null
          supplier_name?: string | null
          updated_at?: string | null
        }
        Update: {
          awarded_at?: string | null
          awarded_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_awarded?: boolean | null
          lead_time_days?: number | null
          purchaser_remarks?: string | null
          quote_request_item_id?: string
          quoted_delivery_date?: string | null
          quoted_price?: number | null
          quoted_unit_price?: number | null
          supplier_code?: string | null
          supplier_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_request_item_offers_quote_request_item_id_fkey"
            columns: ["quote_request_item_id"]
            isOneToOne: false
            referencedRelation: "quote_request_items"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_request_item_orders: {
        Row: {
          created_at: string | null
          created_by: string | null
          delivered_at: string | null
          delivered_by: string | null
          delivery_date: string | null
          id: string
          offer_id: string | null
          order_amount: number | null
          order_date: string | null
          order_quantity: number
          order_status: string | null
          po_number: string | null
          quote_request_item_id: string
          remarks: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_date?: string | null
          id?: string
          offer_id?: string | null
          order_amount?: number | null
          order_date?: string | null
          order_quantity: number
          order_status?: string | null
          po_number?: string | null
          quote_request_item_id: string
          remarks?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          delivered_by?: string | null
          delivery_date?: string | null
          id?: string
          offer_id?: string | null
          order_amount?: number | null
          order_date?: string | null
          order_quantity?: number
          order_status?: string | null
          po_number?: string | null
          quote_request_item_id?: string
          remarks?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_request_item_orders_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "quote_request_item_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_request_item_orders_quote_request_item_id_fkey"
            columns: ["quote_request_item_id"]
            isOneToOne: false
            referencedRelation: "quote_request_items"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_request_items: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          dom_elec_item_id: string | null
          dom_mech_item_id: string | null
          id: string
          item_remarks: string | null
          manufacturer: string
          model_number: string
          part_list_item_id: string | null
          quantity: number
          quote_request_id: string
          sort_order: number
          status_id: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          dom_elec_item_id?: string | null
          dom_mech_item_id?: string | null
          id?: string
          item_remarks?: string | null
          manufacturer: string
          model_number: string
          part_list_item_id?: string | null
          quantity: number
          quote_request_id: string
          sort_order?: number
          status_id?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          dom_elec_item_id?: string | null
          dom_mech_item_id?: string | null
          id?: string
          item_remarks?: string | null
          manufacturer?: string
          model_number?: string
          part_list_item_id?: string | null
          quantity?: number
          quote_request_id?: string
          sort_order?: number
          status_id?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_request_items_dom_elec_item_id_fkey"
            columns: ["dom_elec_item_id"]
            isOneToOne: false
            referencedRelation: "dom_elec_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_request_items_dom_mech_item_id_fkey"
            columns: ["dom_mech_item_id"]
            isOneToOne: false
            referencedRelation: "dom_mech_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_request_items_part_list_item_id_fkey"
            columns: ["part_list_item_id"]
            isOneToOne: false
            referencedRelation: "part_list_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_request_items_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_request_items_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "quote_request_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_request_notifications: {
        Row: {
          app_notification_sent: boolean | null
          email_sent: boolean | null
          error_message: string | null
          id: string
          notification_type: string
          quote_request_id: string
          read_at: string | null
          recipient_id: string
          sent_at: string | null
        }
        Insert: {
          app_notification_sent?: boolean | null
          email_sent?: boolean | null
          error_message?: string | null
          id?: string
          notification_type: string
          quote_request_id: string
          read_at?: string | null
          recipient_id: string
          sent_at?: string | null
        }
        Update: {
          app_notification_sent?: boolean | null
          email_sent?: boolean | null
          error_message?: string | null
          id?: string
          notification_type?: string
          quote_request_id?: string
          read_at?: string | null
          recipient_id?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_request_notifications_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_request_status_logs: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          from_status_id: string | null
          id: string
          quote_request_id: string | null
          quote_request_item_id: string | null
          reason: string | null
          to_status_id: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          from_status_id?: string | null
          id?: string
          quote_request_id?: string | null
          quote_request_item_id?: string | null
          reason?: string | null
          to_status_id: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          from_status_id?: string | null
          id?: string
          quote_request_id?: string | null
          quote_request_item_id?: string | null
          reason?: string | null
          to_status_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_request_status_logs_from_status_id_fkey"
            columns: ["from_status_id"]
            isOneToOne: false
            referencedRelation: "quote_request_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_request_status_logs_quote_request_id_fkey"
            columns: ["quote_request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_request_status_logs_quote_request_item_id_fkey"
            columns: ["quote_request_item_id"]
            isOneToOne: false
            referencedRelation: "quote_request_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_request_status_logs_to_status_id_fkey"
            columns: ["to_status_id"]
            isOneToOne: false
            referencedRelation: "quote_request_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_request_statuses: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_terminal: boolean | null
          name: string
          name_en: string | null
          name_th: string | null
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_terminal?: boolean | null
          name: string
          name_en?: string | null
          name_th?: string | null
          sort_order: number
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_terminal?: boolean | null
          name?: string
          name_en?: string | null
          name_th?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          created_by: string | null
          desired_delivery_date: string | null
          id: string
          project_code: string | null
          purchaser_id: string | null
          purchaser_name: string | null
          remarks: string | null
          request_no: string
          requester_id: string
          requester_name: string | null
          status_id: string
          updated_at: string | null
          updated_by: string | null
          work_no: string | null
        }
        Insert: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          created_by?: string | null
          desired_delivery_date?: string | null
          id?: string
          project_code?: string | null
          purchaser_id?: string | null
          purchaser_name?: string | null
          remarks?: string | null
          request_no: string
          requester_id: string
          requester_name?: string | null
          status_id: string
          updated_at?: string | null
          updated_by?: string | null
          work_no?: string | null
        }
        Update: {
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          created_by?: string | null
          desired_delivery_date?: string | null
          id?: string
          project_code?: string | null
          purchaser_id?: string | null
          purchaser_name?: string | null
          remarks?: string | null
          request_no?: string
          requester_id?: string
          requester_name?: string | null
          status_id?: string
          updated_at?: string | null
          updated_by?: string | null
          work_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "quote_request_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      record_assignees: {
        Row: {
          executed_action_id: string | null
          executed_at: string | null
          has_executed: boolean | null
          id: string
          record_process_state_id: string
          user_id: string
        }
        Insert: {
          executed_action_id?: string | null
          executed_at?: string | null
          has_executed?: boolean | null
          id?: string
          record_process_state_id: string
          user_id: string
        }
        Update: {
          executed_action_id?: string | null
          executed_at?: string | null
          has_executed?: boolean | null
          id?: string
          record_process_state_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_assignees_executed_action_id_fkey"
            columns: ["executed_action_id"]
            isOneToOne: false
            referencedRelation: "process_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_assignees_record_process_state_id_fkey"
            columns: ["record_process_state_id"]
            isOneToOne: false
            referencedRelation: "record_process_states"
            referencedColumns: ["id"]
          },
        ]
      }
      record_permission_rules: {
        Row: {
          app_id: string
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          condition: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          include_sub_organizations: boolean | null
          is_active: boolean | null
          name: string
          priority: number | null
          target_field: string | null
          target_id: string | null
          target_type: string
          updated_at: string | null
        }
        Insert: {
          app_id: string
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          condition: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          include_sub_organizations?: boolean | null
          is_active?: boolean | null
          name: string
          priority?: number | null
          target_field?: string | null
          target_id?: string | null
          target_type: string
          updated_at?: string | null
        }
        Update: {
          app_id?: string
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          condition?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          include_sub_organizations?: boolean | null
          is_active?: boolean | null
          name?: string
          priority?: number | null
          target_field?: string | null
          target_id?: string | null
          target_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "record_permission_rules_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
        ]
      }
      record_process_states: {
        Row: {
          current_status_id: string
          id: string
          record_id: string
          record_table: string
          updated_at: string | null
        }
        Insert: {
          current_status_id: string
          id?: string
          record_id: string
          record_table?: string
          updated_at?: string | null
        }
        Update: {
          current_status_id?: string
          id?: string
          record_id?: string
          record_table?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "record_process_states_current_status_id_fkey"
            columns: ["current_status_id"]
            isOneToOne: false
            referencedRelation: "process_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          can_delete_records: boolean | null
          can_edit_all_records: boolean | null
          can_export_data: boolean | null
          can_import_data: boolean | null
          can_manage_employees: boolean | null
          can_manage_organizations: boolean | null
          can_manage_quotations: boolean | null
          can_manage_settings: boolean | null
          can_manage_users: boolean | null
          can_view_all_records: boolean | null
          code: string
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_system_role: boolean | null
          name: string
          name_en: string | null
          name_th: string | null
          updated_at: string | null
        }
        Insert: {
          can_delete_records?: boolean | null
          can_edit_all_records?: boolean | null
          can_export_data?: boolean | null
          can_import_data?: boolean | null
          can_manage_employees?: boolean | null
          can_manage_organizations?: boolean | null
          can_manage_quotations?: boolean | null
          can_manage_settings?: boolean | null
          can_manage_users?: boolean | null
          can_view_all_records?: boolean | null
          code: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_system_role?: boolean | null
          name: string
          name_en?: string | null
          name_th?: string | null
          updated_at?: string | null
        }
        Update: {
          can_delete_records?: boolean | null
          can_edit_all_records?: boolean | null
          can_export_data?: boolean | null
          can_import_data?: boolean | null
          can_manage_employees?: boolean | null
          can_manage_organizations?: boolean | null
          can_manage_quotations?: boolean | null
          can_manage_settings?: boolean | null
          can_manage_users?: boolean | null
          can_view_all_records?: boolean | null
          code?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_system_role?: boolean | null
          name?: string
          name_en?: string | null
          name_th?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sales_representatives: {
        Row: {
          created_at: string | null
          created_by: string | null
          department: string | null
          employee_id: string | null
          id: string
          is_active: boolean | null
          name: string
          name_en: string | null
          name_kana: string | null
          organization_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          name_en?: string | null
          name_kana?: string | null
          organization_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          employee_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          name_en?: string | null
          name_kana?: string | null
          organization_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_representatives_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          name_kana: string | null
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
          name_kana?: string | null
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
          name_kana?: string | null
          phone_number?: string | null
          supplier_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          can_delete: boolean | null
          can_edit: boolean | null
          can_manage: boolean | null
          can_view: boolean | null
          created_at: string | null
          employee_id: string
          feature_code: string
          id: string
          updated_at: string | null
        }
        Insert: {
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_manage?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          employee_id: string
          feature_code: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_manage?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          employee_id?: string
          feature_code?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_feature_code_fkey"
            columns: ["feature_code"]
            isOneToOne: false
            referencedRelation: "app_features"
            referencedColumns: ["code"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          employee_id: string
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          organization_id: string | null
          role_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          role_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          role_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          error_message: string | null
          executed_at: string
          id: string
          payload: Json | null
          response_body: string | null
          response_status: number | null
          trigger_type: string
          webhook_id: string
        }
        Insert: {
          error_message?: string | null
          executed_at?: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          trigger_type: string
          webhook_id: string
        }
        Update: {
          error_message?: string | null
          executed_at?: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          trigger_type?: string
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "app_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          category: string | null
          commission_rate: number | null
          cost_total: number | null
          created_at: string | null
          customer_id: string | null
          customer_name: string | null
          description: string | null
          discount: number | null
          finish_date: string | null
          grand_total: number | null
          id: string
          inv_list: string | null
          invoice_date_1: string | null
          invoice_date_2: string | null
          invoice_date_3: string | null
          invoice_no_1: string | null
          invoice_no_2: string | null
          invoice_no_3: string | null
          invoice_no_4: string | null
          kintone_record_id: string
          labor_cost: number | null
          machine_item: string | null
          machine_number: string | null
          machine_type: string | null
          model: string | null
          organization_id: string | null
          overhead_rate: number | null
          person_in_charge: string | null
          po_list: string | null
          purchase_cost: number | null
          sales_date: string | null
          sales_staff: string | null
          serial_number: string | null
          start_date: string | null
          status: string
          sub_total: number | null
          updated_at: string | null
          vendor: string | null
          work_no: string
        }
        Insert: {
          category?: string | null
          commission_rate?: number | null
          cost_total?: number | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          description?: string | null
          discount?: number | null
          finish_date?: string | null
          grand_total?: number | null
          id?: string
          inv_list?: string | null
          invoice_date_1?: string | null
          invoice_date_2?: string | null
          invoice_date_3?: string | null
          invoice_no_1?: string | null
          invoice_no_2?: string | null
          invoice_no_3?: string | null
          invoice_no_4?: string | null
          kintone_record_id: string
          labor_cost?: number | null
          machine_item?: string | null
          machine_number?: string | null
          machine_type?: string | null
          model?: string | null
          organization_id?: string | null
          overhead_rate?: number | null
          person_in_charge?: string | null
          po_list?: string | null
          purchase_cost?: number | null
          sales_date?: string | null
          sales_staff?: string | null
          serial_number?: string | null
          start_date?: string | null
          status?: string
          sub_total?: number | null
          updated_at?: string | null
          vendor?: string | null
          work_no: string
        }
        Update: {
          category?: string | null
          commission_rate?: number | null
          cost_total?: number | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string | null
          description?: string | null
          discount?: number | null
          finish_date?: string | null
          grand_total?: number | null
          id?: string
          inv_list?: string | null
          invoice_date_1?: string | null
          invoice_date_2?: string | null
          invoice_date_3?: string | null
          invoice_no_1?: string | null
          invoice_no_2?: string | null
          invoice_no_3?: string | null
          invoice_no_4?: string | null
          kintone_record_id?: string
          labor_cost?: number | null
          machine_item?: string | null
          machine_number?: string | null
          machine_type?: string | null
          model?: string | null
          organization_id?: string | null
          overhead_rate?: number | null
          person_in_charge?: string | null
          po_list?: string | null
          purchase_cost?: number | null
          sales_date?: string | null
          sales_staff?: string | null
          serial_number?: string | null
          start_date?: string | null
          status?: string
          sub_total?: number | null
          updated_at?: string | null
          vendor?: string | null
          work_no?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_quote_request_no: { Args: never; Returns: string }
      get_user_app_permissions: {
        Args: { p_app_code: string; p_user_id: string }
        Returns: {
          can_add: boolean
          can_delete: boolean
          can_edit: boolean
          can_export: boolean
          can_import: boolean
          can_manage: boolean
          can_view: boolean
        }[]
      }
      get_user_field_permissions: {
        Args: { p_app_code: string; p_user_id: string }
        Returns: {
          access_level: string
          field_name: string
        }[]
      }
      get_user_organization_ids: { Args: never; Returns: string[] }
      is_admin_user: { Args: never; Returns: boolean }
      user_belongs_to_organization: {
        Args: { org_id: string }
        Returns: boolean
      }
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
