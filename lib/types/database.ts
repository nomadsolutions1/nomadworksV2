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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          company_id: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          title: string
          user_id: string | null
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          title: string
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          allow_free_site_selection: boolean | null
          auto_export_day: number | null
          auto_export_enabled: boolean | null
          bank_bic: string | null
          bank_iban: string | null
          bank_name: string | null
          created_at: string
          default_tax_rate: number | null
          default_work_start_time: string | null
          id: string
          invoice_prefix: string | null
          is_active: boolean | null
          logo_url: string | null
          max_employees: number | null
          monthly_price: number | null
          name: string
          next_invoice_number: number | null
          onboarding_completed: boolean | null
          onboarding_data: Record<string, unknown> | null
          onboarding_step: number | null
          payment_terms_days: number | null
          plan: string
          primary_color: string | null
          reminder_clock_in_enabled: boolean | null
          reminder_minutes_before: number | null
          secondary_color: string | null
          soka_betriebskonto_nr: string | null
          soka_branchenkennziffer: string | null
          soka_umlagesatz_berufsbildung: number | null
          soka_umlagesatz_rente: number | null
          soka_umlagesatz_urlaub: number | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tax_advisor_email: string | null
          tax_advisor_firm: string | null
          tax_advisor_name: string | null
          tax_advisor_phone: string | null
          tax_id: string | null
          trade_license: string | null
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          allow_free_site_selection?: boolean | null
          auto_export_day?: number | null
          auto_export_enabled?: boolean | null
          bank_bic?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          created_at?: string
          default_tax_rate?: number | null
          default_work_start_time?: string | null
          id?: string
          invoice_prefix?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          max_employees?: number | null
          monthly_price?: number | null
          name: string
          next_invoice_number?: number | null
          onboarding_completed?: boolean | null
          onboarding_data?: Record<string, unknown> | null
          onboarding_step?: number | null
          payment_terms_days?: number | null
          plan?: string
          primary_color?: string | null
          reminder_clock_in_enabled?: boolean | null
          reminder_minutes_before?: number | null
          secondary_color?: string | null
          soka_betriebskonto_nr?: string | null
          soka_branchenkennziffer?: string | null
          soka_umlagesatz_berufsbildung?: number | null
          soka_umlagesatz_rente?: number | null
          soka_umlagesatz_urlaub?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tax_advisor_email?: string | null
          tax_advisor_firm?: string | null
          tax_advisor_name?: string | null
          tax_advisor_phone?: string | null
          tax_id?: string | null
          trade_license?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          allow_free_site_selection?: boolean | null
          auto_export_day?: number | null
          auto_export_enabled?: boolean | null
          bank_bic?: string | null
          bank_iban?: string | null
          bank_name?: string | null
          created_at?: string
          default_tax_rate?: number | null
          default_work_start_time?: string | null
          id?: string
          invoice_prefix?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          max_employees?: number | null
          monthly_price?: number | null
          name?: string
          next_invoice_number?: number | null
          onboarding_completed?: boolean | null
          onboarding_data?: Record<string, unknown> | null
          onboarding_step?: number | null
          payment_terms_days?: number | null
          plan?: string
          primary_color?: string | null
          reminder_clock_in_enabled?: boolean | null
          reminder_minutes_before?: number | null
          secondary_color?: string | null
          soka_betriebskonto_nr?: string | null
          soka_branchenkennziffer?: string | null
          soka_umlagesatz_berufsbildung?: number | null
          soka_umlagesatz_rente?: number | null
          soka_umlagesatz_urlaub?: number | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tax_advisor_email?: string | null
          tax_advisor_firm?: string | null
          tax_advisor_name?: string | null
          tax_advisor_phone?: string | null
          tax_id?: string | null
          trade_license?: string | null
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      construction_sites: {
        Row: {
          address: string | null
          budget: number | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          company_id: string
          contact_name: string | null
          contact_phone: string | null
          contact_role: string | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          order_id: string | null
          qr_code: string | null
          site_manager: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          budget?: number | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          company_id: string
          contact_name?: string | null
          contact_phone?: string | null
          contact_role?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          order_id?: string | null
          qr_code?: string | null
          site_manager?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          budget?: number | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          company_id?: string
          contact_name?: string | null
          contact_phone?: string | null
          contact_role?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          order_id?: string | null
          qr_code?: string | null
          site_manager?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "construction_sites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "construction_sites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "construction_sites_site_manager_fkey"
            columns: ["site_manager"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          company_id: string
          contact_person: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id: string
          contact_person?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string
          contact_person?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      diary_documents: {
        Row: {
          company_id: string
          created_at: string
          diary_entry_id: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          site_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          diary_entry_id?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          site_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          diary_entry_id?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          site_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diary_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diary_documents_diary_entry_id_fkey"
            columns: ["diary_entry_id"]
            isOneToOne: false
            referencedRelation: "diary_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diary_documents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "construction_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diary_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      diary_entries: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          defects: string | null
          entry_date: string
          hindrances: string | null
          id: string
          incidents: string | null
          site_id: string
          temperature: number | null
          updated_at: string
          weather: string | null
          wind: string | null
          work_description: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          defects?: string | null
          entry_date?: string
          hindrances?: string | null
          id?: string
          incidents?: string | null
          site_id: string
          temperature?: number | null
          updated_at?: string
          weather?: string | null
          wind?: string | null
          work_description: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          defects?: string | null
          entry_date?: string
          hindrances?: string | null
          id?: string
          incidents?: string | null
          site_id?: string
          temperature?: number | null
          updated_at?: string
          weather?: string | null
          wind?: string | null
          work_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "diary_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diary_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diary_entries_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "construction_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      diary_photos: {
        Row: {
          caption: string | null
          created_at: string
          diary_entry_id: string
          file_path: string
          id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          diary_entry_id: string
          file_path: string
          id?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          diary_entry_id?: string
          file_path?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diary_photos_diary_entry_id_fkey"
            columns: ["diary_entry_id"]
            isOneToOne: false
            referencedRelation: "diary_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      dismissed_tips: {
        Row: {
          dismissed_at: string
          id: string
          tip_key: string
          user_id: string
        }
        Insert: {
          dismissed_at?: string
          id?: string
          tip_key: string
          user_id: string
        }
        Update: {
          dismissed_at?: string
          id?: string
          tip_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dismissed_tips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          category: string
          company_id: string
          entity_id: string | null
          entity_type: string | null
          expiry_date: string | null
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          name: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          category: string
          company_id: string
          entity_id?: string | null
          entity_type?: string | null
          expiry_date?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          category?: string
          company_id?: string
          entity_id?: string | null
          entity_type?: string | null
          expiry_date?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          name?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          assigned_site: string | null
          availability_status: string | null
          category: string
          company_id: string
          created_at: string
          daily_rate: number | null
          deleted_at: string | null
          id: string
          name: string
          next_maintenance: string | null
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          serial_number: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_site?: string | null
          availability_status?: string | null
          category?: string
          company_id: string
          created_at?: string
          daily_rate?: number | null
          deleted_at?: string | null
          id?: string
          name: string
          next_maintenance?: string | null
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_site?: string | null
          availability_status?: string | null
          category?: string
          company_id?: string
          created_at?: string
          daily_rate?: number | null
          deleted_at?: string | null
          id?: string
          name?: string
          next_maintenance?: string | null
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_assigned_site_fkey"
            columns: ["assigned_site"]
            isOneToOne: false
            referencedRelation: "construction_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_costs: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          date: string
          description: string | null
          equipment_id: string
          id: string
          type: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          date?: string
          description?: string | null
          equipment_id: string
          id?: string
          type: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          date?: string
          description?: string | null
          equipment_id?: string
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_costs_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      foreman_permissions: {
        Row: {
          can_edit: boolean | null
          can_view: boolean | null
          company_id: string
          created_at: string | null
          foreman_id: string
          granted_by: string | null
          id: string
          module_name: string
          updated_at: string | null
        }
        Insert: {
          can_edit?: boolean | null
          can_view?: boolean | null
          company_id: string
          created_at?: string | null
          foreman_id: string
          granted_by?: string | null
          id?: string
          module_name: string
          updated_at?: string | null
        }
        Update: {
          can_edit?: boolean | null
          can_view?: boolean | null
          company_id?: string
          created_at?: string | null
          foreman_id?: string
          granted_by?: string | null
          id?: string
          module_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foreman_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foreman_permissions_foreman_id_fkey"
            columns: ["foreman_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foreman_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_logs: {
        Row: {
          company_id: string
          cost: number
          created_at: string
          date: string
          id: string
          liters: number
          mileage: number | null
          vehicle_id: string
        }
        Insert: {
          company_id: string
          cost: number
          created_at?: string
          date?: string
          id?: string
          liters: number
          mileage?: number | null
          vehicle_id: string
        }
        Update: {
          company_id?: string
          cost?: number
          created_at?: string
          date?: string
          id?: string
          liters?: number
          mileage?: number | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string
          created_by: string
          email: string | null
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string
          created_by: string
          email?: string | null
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          email?: string | null
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          position: number
          quantity: number
          total: number
          unit: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          position: number
          quantity?: number
          total: number
          unit?: string
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          position?: number
          quantity?: number
          total?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          company_id: string
          created_at: string
          customer_id: string
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          notes: string | null
          order_id: string | null
          paid_amount: number | null
          paid_date: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          total: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          customer_id: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          order_id?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          customer_id?: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          order_id?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_by: string | null
          company_id: string
          created_at: string
          days: number
          end_date: string
          id: string
          notes: string | null
          start_date: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          company_id: string
          created_at?: string
          days: number
          end_date: string
          id?: string
          notes?: string | null
          start_date: string
          status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          company_id?: string
          created_at?: string
          days?: number
          end_date?: string
          id?: string
          notes?: string | null
          start_date?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      material_bundle_items: {
        Row: {
          bundle_id: string
          created_at: string
          id: string
          material_id: string
          quantity: number
        }
        Insert: {
          bundle_id: string
          created_at?: string
          id?: string
          material_id: string
          quantity?: number
        }
        Update: {
          bundle_id?: string
          created_at?: string
          id?: string
          material_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "material_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_bundle_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      material_bundles: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_bundles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          article_number: string | null
          category: string
          company_id: string
          created_at: string
          current_stock: number | null
          deleted_at: string | null
          id: string
          min_stock: number | null
          name: string
          price_per_unit: number | null
          supplier_id: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          article_number?: string | null
          category?: string
          company_id: string
          created_at?: string
          current_stock?: number | null
          deleted_at?: string | null
          id?: string
          min_stock?: number | null
          name: string
          price_per_unit?: number | null
          supplier_id?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          article_number?: string | null
          category?: string
          company_id?: string
          created_at?: string
          current_stock?: number | null
          deleted_at?: string | null
          id?: string
          min_stock?: number | null
          name?: string
          price_per_unit?: number | null
          supplier_id?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      measurements: {
        Row: {
          calculated_value: number | null
          company_id: string
          created_at: string
          description: string
          height: number | null
          id: string
          length: number | null
          measured_at: string
          measured_by: string
          notes: string | null
          order_id: string | null
          quantity: number
          site_id: string | null
          unit: string
          width: number | null
        }
        Insert: {
          calculated_value?: number | null
          company_id: string
          created_at?: string
          description: string
          height?: number | null
          id?: string
          length?: number | null
          measured_at?: string
          measured_by: string
          notes?: string | null
          order_id?: string | null
          quantity?: number
          site_id?: string | null
          unit?: string
          width?: number | null
        }
        Update: {
          calculated_value?: number | null
          company_id?: string
          created_at?: string
          description?: string
          height?: number | null
          id?: string
          length?: number | null
          measured_at?: string
          measured_by?: string
          notes?: string | null
          order_id?: string | null
          quantity?: number
          site_id?: string | null
          unit?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "measurements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurements_measured_by_fkey"
            columns: ["measured_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurements_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "construction_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          company_id: string
          created_at: string
          id: string
          link: string | null
          message: string
          read_at: string | null
          severity: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read_at?: string | null
          severity?: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read_at?: string | null
          severity?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          company_id: string
          created_at: string
          first_employee_invited: boolean | null
          first_order_created: boolean | null
          first_site_created: boolean | null
          first_time_entry: boolean | null
          id: string
          profile_completed: boolean | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          first_employee_invited?: boolean | null
          first_order_created?: boolean | null
          first_site_created?: boolean | null
          first_time_entry?: boolean | null
          id?: string
          profile_completed?: boolean | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          first_employee_invited?: boolean | null
          first_order_created?: boolean | null
          first_site_created?: boolean | null
          first_time_entry?: boolean | null
          id?: string
          profile_completed?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      order_assignments: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          order_id: string
          resource_id: string
          resource_type: string
          start_date: string | null
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          order_id: string
          resource_id: string
          resource_type: string
          start_date?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          resource_id?: string
          resource_type?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_costs: {
        Row: {
          amount: number
          category: string
          company_id: string
          created_at: string
          date: string
          description: string
          id: string
          order_id: string
        }
        Insert: {
          amount: number
          category: string
          company_id: string
          created_at?: string
          date?: string
          description: string
          id?: string
          order_id: string
        }
        Update: {
          amount?: number
          category?: string
          company_id?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_costs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_costs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          description: string
          id: string
          order_id: string
          position: number
          quantity: number
          unit: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          order_id: string
          position: number
          quantity?: number
          unit?: string
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          order_id?: string
          position?: number
          quantity?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          budget: number | null
          company_id: string
          created_at: string
          customer_id: string | null
          deleted_at: string | null
          description: string | null
          end_date: string | null
          id: string
          original_budget: number | null
          change_order_notes: string | null
          site_id: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          budget?: number | null
          company_id: string
          created_at?: string
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          site_id?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          budget?: number | null
          company_id?: string
          created_at?: string
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          site_id?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "construction_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_reminders: {
        Row: {
          company_id: string
          created_at: string
          due_amount: number
          fee: number | null
          id: string
          invoice_id: string
          notes: string | null
          reminder_level: number
          sent_date: string
        }
        Insert: {
          company_id: string
          created_at?: string
          due_amount: number
          fee?: number | null
          id?: string
          invoice_id: string
          notes?: string | null
          reminder_level?: number
          sent_date?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          due_amount?: number
          fee?: number | null
          id?: string
          invoice_id?: string
          notes?: string | null
          reminder_level?: number
          sent_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          annual_leave_days: number | null
          birth_date: string | null
          can_view_sensitive_data: boolean | null
          company_id: string | null
          contract_start: string | null
          contract_type: string | null
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          first_name: string
          guest_token: string | null
          has_account: boolean | null
          health_insurance: string | null
          hourly_rate: number | null
          iban: string | null
          id: string
          invited_by: string | null
          is_temporary: boolean | null
          job_title: string | null
          language: string | null
          languages: string[] | null
          last_name: string
          monthly_salary: number | null
          nationality: string | null
          notice_period: string | null
          phone: string | null
          probation_end: string | null
          role: Database["public"]["Enums"]["user_role"]
          social_security_number: string | null
          soka_arbeitnehmer_nr: string | null
          soka_urlaubsanspruch_tage: number | null
          soka_urlaubsguthaben: number | null
          tax_class: string | null
          updated_at: string
        }
        Insert: {
          annual_leave_days?: number | null
          birth_date?: string | null
          can_view_sensitive_data?: boolean | null
          company_id?: string | null
          contract_start?: string | null
          contract_type?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          first_name: string
          guest_token?: string | null
          has_account?: boolean | null
          health_insurance?: string | null
          hourly_rate?: number | null
          iban?: string | null
          id?: string
          invited_by?: string | null
          is_temporary?: boolean | null
          job_title?: string | null
          language?: string | null
          languages?: string[] | null
          last_name: string
          monthly_salary?: number | null
          nationality?: string | null
          notice_period?: string | null
          phone?: string | null
          probation_end?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          social_security_number?: string | null
          soka_arbeitnehmer_nr?: string | null
          soka_urlaubsanspruch_tage?: number | null
          soka_urlaubsguthaben?: number | null
          tax_class?: string | null
          updated_at?: string
        }
        Update: {
          annual_leave_days?: number | null
          birth_date?: string | null
          can_view_sensitive_data?: boolean | null
          company_id?: string | null
          contract_start?: string | null
          contract_type?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          first_name?: string
          guest_token?: string | null
          has_account?: boolean | null
          health_insurance?: string | null
          hourly_rate?: number | null
          iban?: string | null
          id?: string
          invited_by?: string | null
          is_temporary?: boolean | null
          job_title?: string | null
          language?: string | null
          languages?: string[] | null
          last_name?: string
          monthly_salary?: number | null
          nationality?: string | null
          notice_period?: string | null
          phone?: string | null
          probation_end?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          social_security_number?: string | null
          soka_arbeitnehmer_nr?: string | null
          soka_urlaubsanspruch_tage?: number | null
          soka_urlaubsguthaben?: number | null
          tax_class?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          delivered_quantity: number
          id: string
          material_id: string | null
          order_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          delivered_quantity?: number
          id?: string
          material_id?: string | null
          order_id: string
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          delivered_quantity?: number
          id?: string
          material_id?: string | null
          order_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          company_id: string
          created_at: string
          id: string
          notes: string | null
          order_date: string
          order_id: string | null
          status: string
          supplier_id: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          order_date?: string
          order_id?: string | null
          status?: string
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          order_date?: string
          order_id?: string | null
          status?: string
          supplier_id?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      qualifications: {
        Row: {
          company_id: string
          created_at: string
          expiry_date: string | null
          id: string
          issued_by: string | null
          issued_date: string | null
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          expiry_date?: string | null
          id?: string
          issued_by?: string | null
          issued_date?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qualifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          channel: string
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          message: string
          scheduled_for: string
          sent_at: string | null
          status: string
          type: string
          user_id: string | null
        }
        Insert: {
          channel?: string
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          type: string
          user_id?: string | null
        }
        Update: {
          channel?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      safety_briefings: {
        Row: {
          briefing_date: string
          company_id: string
          created_at: string
          id: string
          next_date: string | null
          notes: string | null
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          briefing_date: string
          company_id: string
          created_at?: string
          id?: string
          next_date?: string | null
          notes?: string | null
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          briefing_date?: string
          company_id?: string
          created_at?: string
          id?: string
          next_date?: string | null
          notes?: string | null
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safety_briefings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safety_briefings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_entries: {
        Row: {
          break_minutes: number | null
          company_id: string
          created_at: string
          date: string
          end_time: string | null
          id: string
          notes: string | null
          shift: string | null
          site_id: string
          start_time: string | null
          user_id: string
        }
        Insert: {
          break_minutes?: number | null
          company_id: string
          created_at?: string
          date: string
          end_time?: string | null
          id?: string
          notes?: string | null
          shift?: string | null
          site_id: string
          start_time?: string | null
          user_id: string
        }
        Update: {
          break_minutes?: number | null
          company_id?: string
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          shift?: string | null
          site_id?: string
          start_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_entries_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "construction_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sick_days: {
        Row: {
          certificate_file: string | null
          company_id: string
          created_at: string
          days: number
          end_date: string
          has_certificate: boolean | null
          id: string
          notes: string | null
          reported_by: string | null
          start_date: string
          status: string | null
          user_id: string
        }
        Insert: {
          certificate_file?: string | null
          company_id: string
          created_at?: string
          days: number
          end_date: string
          has_certificate?: boolean | null
          id?: string
          notes?: string | null
          reported_by?: string | null
          start_date: string
          status?: string | null
          user_id: string
        }
        Update: {
          certificate_file?: string | null
          company_id?: string
          created_at?: string
          days?: number
          end_date?: string
          has_certificate?: boolean | null
          id?: string
          notes?: string | null
          reported_by?: string | null
          start_date?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sick_days_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sick_days_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sick_days_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          id: string
          material_id: string
          notes: string | null
          order_id: string | null
          quantity: number
          site_id: string | null
          type: string
          unit_price: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          id?: string
          material_id: string
          notes?: string | null
          order_id?: string | null
          quantity: number
          site_id?: string | null
          type: string
          unit_price?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          id?: string
          material_id?: string
          notes?: string | null
          order_id?: string | null
          quantity?: number
          site_id?: string | null
          type?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "construction_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractor_assignments: {
        Row: {
          agreed_amount: number | null
          company_id: string
          created_at: string
          description: string
          id: string
          invoiced_amount: number | null
          order_id: string
          status: string
          subcontractor_id: string
          updated_at: string
        }
        Insert: {
          agreed_amount?: number | null
          company_id: string
          created_at?: string
          description: string
          id?: string
          invoiced_amount?: number | null
          order_id: string
          status?: string
          subcontractor_id: string
          updated_at?: string
        }
        Update: {
          agreed_amount?: number | null
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          invoiced_amount?: number | null
          order_id?: string
          status?: string
          subcontractor_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractor_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcontractor_assignments_subcontractor_id_fkey"
            columns: ["subcontractor_id"]
            isOneToOne: false
            referencedRelation: "subcontractors"
            referencedColumns: ["id"]
          },
        ]
      }
      subcontractors: {
        Row: {
          address: string | null
          company_id: string
          contact_person: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          price_rating: number | null
          quality_rating: number | null
          reliability_rating: number | null
          reverse_charge_13b: boolean | null
          reverse_charge_certificate_valid_until: string | null
          tax_exemption_valid_until: string | null
          trade: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id: string
          contact_person?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          price_rating?: number | null
          quality_rating?: number | null
          reliability_rating?: number | null
          reverse_charge_13b?: boolean | null
          reverse_charge_certificate_valid_until?: string | null
          tax_exemption_valid_until?: string | null
          trade?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string
          contact_person?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          price_rating?: number | null
          quality_rating?: number | null
          reliability_rating?: number | null
          reverse_charge_13b?: boolean | null
          reverse_charge_certificate_valid_until?: string | null
          tax_exemption_valid_until?: string | null
          trade?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcontractors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          company_id: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          rating: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          break_minutes: number
          clock_in: string
          clock_in_lat: number | null
          clock_in_lng: number | null
          clock_out: string | null
          clock_out_lat: number | null
          clock_out_lng: number | null
          company_id: string
          created_at: string
          edited_at: string | null
          edited_by: string | null
          id: string
          notes: string | null
          photo_url: string | null
          site_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          break_minutes?: number
          clock_in?: string
          clock_in_lat?: number | null
          clock_in_lng?: number | null
          clock_out?: string | null
          clock_out_lat?: number | null
          clock_out_lng?: number | null
          company_id: string
          created_at?: string
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          site_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          break_minutes?: number
          clock_in?: string
          clock_in_lat?: number | null
          clock_in_lng?: number | null
          clock_out?: string | null
          clock_out_lat?: number | null
          clock_out_lng?: number | null
          company_id?: string
          created_at?: string
          edited_at?: string | null
          edited_by?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          site_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "construction_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_logs: {
        Row: {
          company_id: string
          created_at: string
          date: string
          driver_id: string
          end_location: string
          id: string
          km: number
          purpose: string
          start_location: string
          vehicle_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          date?: string
          driver_id: string
          end_location: string
          id?: string
          km: number
          purpose: string
          start_location: string
          vehicle_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          date?: string
          driver_id?: string
          end_location?: string
          id?: string
          km?: number
          purpose?: string
          start_location?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_logs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          acquisition_type: string | null
          assigned_to: string | null
          availability_status: string | null
          company_id: string
          contract_end: string | null
          contract_start: string | null
          created_at: string
          deleted_at: string | null
          down_payment: number | null
          id: string
          insurance_cost: number | null
          interest_rate: number | null
          leasing_cost: number | null
          license_plate: string
          loan_amount: number | null
          make: string
          mileage: number | null
          model: string
          monthly_rate: number | null
          next_inspection: string | null
          purchase_date: string | null
          purchase_price: number | null
          rental_daily_rate: number | null
          residual_value: number | null
          status: string
          tax_cost: number | null
          type: string
          updated_at: string
          year: number | null
        }
        Insert: {
          acquisition_type?: string | null
          assigned_to?: string | null
          availability_status?: string | null
          company_id: string
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          deleted_at?: string | null
          down_payment?: number | null
          id?: string
          insurance_cost?: number | null
          interest_rate?: number | null
          leasing_cost?: number | null
          license_plate: string
          loan_amount?: number | null
          make: string
          mileage?: number | null
          model: string
          monthly_rate?: number | null
          next_inspection?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          rental_daily_rate?: number | null
          residual_value?: number | null
          status?: string
          tax_cost?: number | null
          type?: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          acquisition_type?: string | null
          assigned_to?: string | null
          availability_status?: string | null
          company_id?: string
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          deleted_at?: string | null
          down_payment?: number | null
          id?: string
          insurance_cost?: number | null
          interest_rate?: number | null
          leasing_cost?: number | null
          license_plate?: string
          loan_amount?: number | null
          make?: string
          mileage?: number | null
          model?: string
          monthly_rate?: number | null
          next_inspection?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          rental_daily_rate?: number | null
          residual_value?: number | null
          status?: string
          tax_cost?: number | null
          type?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_entries: {
        Row: {
          company_id: string
          completed_at: string | null
          cost_external: number | null
          cost_labor: number | null
          cost_parts: number | null
          created_at: string
          created_by: string | null
          description: string | null
          entered_at: string
          entity_id: string
          entity_type: string
          expected_completion: string | null
          id: string
          notes: string | null
          reason: string
          status: string
          updated_at: string
          workshop_name: string | null
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          cost_external?: number | null
          cost_labor?: number | null
          cost_parts?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entered_at?: string
          entity_id: string
          entity_type: string
          expected_completion?: string | null
          id?: string
          notes?: string | null
          reason: string
          status?: string
          updated_at?: string
          workshop_name?: string | null
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          cost_external?: number | null
          cost_labor?: number | null
          cost_parts?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entered_at?: string
          entity_id?: string
          entity_type?: string
          expected_completion?: string | null
          id?: string
          notes?: string | null
          reason?: string
          status?: string
          updated_at?: string
          workshop_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workshop_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_company_id: { Args: never; Returns: string }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      user_role:
        | "owner"
        | "foreman"
        | "worker"
        | "super_admin"
        | "office"
        | "accountant"
        | "employee"
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
    Enums: {
      user_role: [
        "owner",
        "foreman",
        "worker",
        "super_admin",
        "office",
        "accountant",
        "employee",
      ],
    },
  },
} as const
