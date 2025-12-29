// Supabase Database Types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string
          name: string
          name_en: string | null
          name_th: string | null
          description: string | null
          parent_id: string | null
          manager_id: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          name_en?: string | null
          name_th?: string | null
          description?: string | null
          parent_id?: string | null
          manager_id?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_en?: string | null
          name_th?: string | null
          description?: string | null
          parent_id?: string | null
          manager_id?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          department: string | null
          language: 'ja' | 'th'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: string
          department?: string | null
          language?: 'ja' | 'th'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
          department?: string | null
          language?: 'ja' | 'th'
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          theme: string
          notifications_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          code: string
          name: string
          name_en: string | null
          name_th: string | null
          parent_id: string | null
          display_order: number
          description: string | null
          manager_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          name_en?: string | null
          name_th?: string | null
          parent_id?: string | null
          display_order?: number
          description?: string | null
          manager_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          name_en?: string | null
          name_th?: string | null
          parent_id?: string | null
          display_order?: number
          description?: string | null
          manager_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          employee_id: string
          role: string | null
          is_active: boolean
          joined_at: string
          left_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          employee_id: string
          role?: string | null
          is_active?: boolean
          joined_at?: string
          left_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          employee_id?: string
          role?: string | null
          is_active?: boolean
          joined_at?: string
          left_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          employee_number: string
          name: string
          name_th: string | null
          nickname: string | null
          email: string | null
          company_email: string | null
          tel: string | null
          mobile: string | null
          date_of_birth: string | null
          gender: string | null
          nationality: string | null
          department: string | null
          position: string | null
          employment_type: string | null
          hire_date: string | null
          resign_date: string | null
          status: string
          salary_type: string | null
          salary_amount: number | null
          bank_account: string | null
          id_number: string | null
          id_expiry: string | null
          id_image_url: string | null
          passport_number: string | null
          passport_expiry: string | null
          passport_image_url: string | null
          visa_type: string | null
          visa_number: string | null
          visa_expiry: string | null
          visa_image_url: string | null
          work_permit_number: string | null
          work_permit_expiry: string | null
          work_permit_image_url: string | null
          license_number: string | null
          license_expiry: string | null
          emergency_contact_name: string | null
          emergency_contact_tel: string | null
          emergency_contact_address: string | null
          profile_image_url: string | null
          resume_files: string[] | null
          bank_book_files: string[] | null
          address: string | null
          first_name: string | null
          last_name: string | null
          first_name_th: string | null
          last_name_th: string | null
          user_id: string | null
          kintone_record_id: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          employee_number: string
          name: string
          name_th?: string | null
          nickname?: string | null
          email?: string | null
          company_email?: string | null
          tel?: string | null
          mobile?: string | null
          date_of_birth?: string | null
          gender?: string | null
          nationality?: string | null
          department?: string | null
          position?: string | null
          employment_type?: string | null
          hire_date?: string | null
          resign_date?: string | null
          status?: string
          salary_type?: string | null
          salary_amount?: number | null
          bank_account?: string | null
          id_number?: string | null
          id_expiry?: string | null
          id_image_url?: string | null
          passport_number?: string | null
          passport_expiry?: string | null
          passport_image_url?: string | null
          visa_type?: string | null
          visa_number?: string | null
          visa_expiry?: string | null
          visa_image_url?: string | null
          work_permit_number?: string | null
          work_permit_expiry?: string | null
          work_permit_image_url?: string | null
          license_number?: string | null
          license_expiry?: string | null
          emergency_contact_name?: string | null
          emergency_contact_tel?: string | null
          emergency_contact_address?: string | null
          profile_image_url?: string | null
          resume_files?: string[] | null
          bank_book_files?: string[] | null
          address?: string | null
          first_name?: string | null
          last_name?: string | null
          first_name_th?: string | null
          last_name_th?: string | null
          user_id?: string | null
          kintone_record_id?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          employee_number?: string
          name?: string
          name_th?: string | null
          nickname?: string | null
          email?: string | null
          company_email?: string | null
          tel?: string | null
          mobile?: string | null
          date_of_birth?: string | null
          gender?: string | null
          nationality?: string | null
          department?: string | null
          position?: string | null
          employment_type?: string | null
          hire_date?: string | null
          resign_date?: string | null
          status?: string
          salary_type?: string | null
          salary_amount?: number | null
          bank_account?: string | null
          id_number?: string | null
          id_expiry?: string | null
          id_image_url?: string | null
          passport_number?: string | null
          passport_expiry?: string | null
          passport_image_url?: string | null
          visa_type?: string | null
          visa_number?: string | null
          visa_expiry?: string | null
          visa_image_url?: string | null
          work_permit_number?: string | null
          work_permit_expiry?: string | null
          work_permit_image_url?: string | null
          license_number?: string | null
          license_expiry?: string | null
          emergency_contact_name?: string | null
          emergency_contact_tel?: string | null
          emergency_contact_address?: string | null
          profile_image_url?: string | null
          resume_files?: string[] | null
          bank_book_files?: string[] | null
          address?: string | null
          first_name?: string | null
          last_name?: string | null
          first_name_th?: string | null
          last_name_th?: string | null
          user_id?: string | null
          kintone_record_id?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'manager' | 'employee'
      user_language: 'ja' | 'th'
    }
  }
}