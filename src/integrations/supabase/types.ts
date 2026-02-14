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
      application_documents: {
        Row: {
          application_id: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          uploaded_at: string | null
        }
        Insert: {
          application_id: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          uploaded_at?: string | null
        }
        Update: {
          application_id?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "visa_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_snapshots: {
        Row: {
          application_id: string
          booking_id: string | null
          created_at: string
          document_urls: Json | null
          id: string
          payment_id: string | null
          snapshot_data: Json
          submitted_at: string
          submitted_by: string
        }
        Insert: {
          application_id: string
          booking_id?: string | null
          created_at?: string
          document_urls?: Json | null
          id?: string
          payment_id?: string | null
          snapshot_data: Json
          submitted_at?: string
          submitted_by: string
        }
        Update: {
          application_id?: string
          booking_id?: string | null
          created_at?: string
          document_urls?: Json | null
          id?: string
          payment_id?: string | null
          snapshot_data?: Json
          submitted_at?: string
          submitted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_snapshots_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "visa_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_snapshots_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_snapshots_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      arrival_points: {
        Row: {
          city: string | null
          code: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
        }
        Insert: {
          city?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
        }
        Update: {
          city?: string | null
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string
          currency: string
          id: string
          payment_status: string
          payment_transaction_id: string | null
          price_per_traveler: number
          state: Database["public"]["Enums"]["booking_state"] | null
          total_amount_paid: number
          total_travelers: number
          updated_at: string
          user_id: string
          visa_type: string
        }
        Insert: {
          created_at?: string
          currency: string
          id?: string
          payment_status?: string
          payment_transaction_id?: string | null
          price_per_traveler?: number
          state?: Database["public"]["Enums"]["booking_state"] | null
          total_amount_paid: number
          total_travelers?: number
          updated_at?: string
          user_id: string
          visa_type?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          payment_status?: string
          payment_transaction_id?: string | null
          price_per_traveler?: number
          state?: Database["public"]["Enums"]["booking_state"] | null
          total_amount_paid?: number
          total_travelers?: number
          updated_at?: string
          user_id?: string
          visa_type?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          isd_code: string | null
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          isd_code?: string | null
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          isd_code?: string | null
          name?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_active: boolean | null
          subject: string
          template_key: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          subject: string
          template_key: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          subject?: string
          template_key?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          converted: boolean | null
          converted_at: string | null
          country: string | null
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          page_url: string | null
          source: string
        }
        Insert: {
          converted?: boolean | null
          converted_at?: string | null
          country?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          notes?: string | null
          page_url?: string | null
          source?: string
        }
        Update: {
          converted?: boolean | null
          converted_at?: string | null
          country?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          page_url?: string | null
          source?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          application_id: string
          created_at: string | null
          id: string
          is_admin_message: boolean | null
          message: string
          read_at: string | null
          recipient_id: string | null
          sender_id: string
        }
        Insert: {
          application_id: string
          created_at?: string | null
          id?: string
          is_admin_message?: boolean | null
          message: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id: string
        }
        Update: {
          application_id?: string
          created_at?: string | null
          id?: string
          is_admin_message?: boolean | null
          message?: string
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "visa_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          application_id: string | null
          captured_at: string | null
          convenience_fee: number | null
          country: string | null
          created_at: string | null
          currency: string
          id: string
          payer_email: string | null
          payer_name: string | null
          paypal_capture_id: string | null
          paypal_order_id: string
          refunded_at: string | null
          service_name: string
          status: Database["public"]["Enums"]["payment_status"] | null
          tax_amount: number | null
          thank_you_email_sent: boolean | null
          total_amount: number
          user_id: string
          visa_duration: string | null
        }
        Insert: {
          amount: number
          application_id?: string | null
          captured_at?: string | null
          convenience_fee?: number | null
          country?: string | null
          created_at?: string | null
          currency: string
          id?: string
          payer_email?: string | null
          payer_name?: string | null
          paypal_capture_id?: string | null
          paypal_order_id: string
          refunded_at?: string | null
          service_name: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          tax_amount?: number | null
          thank_you_email_sent?: boolean | null
          total_amount: number
          user_id: string
          visa_duration?: string | null
        }
        Update: {
          amount?: number
          application_id?: string | null
          captured_at?: string | null
          convenience_fee?: number | null
          country?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          payer_email?: string | null
          payer_name?: string | null
          paypal_capture_id?: string | null
          paypal_order_id?: string
          refunded_at?: string | null
          service_name?: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          tax_amount?: number | null
          thank_you_email_sent?: boolean | null
          total_amount?: number
          user_id?: string
          visa_duration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "visa_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_config: {
        Row: {
          base_amount: number
          convenience_fee: number | null
          country_code: string | null
          created_at: string | null
          currency: string
          duration: string
          id: string
          is_active: boolean | null
          tax_rate: number | null
          updated_at: string | null
          visa_type: Database["public"]["Enums"]["visa_type"]
        }
        Insert: {
          base_amount: number
          convenience_fee?: number | null
          country_code?: string | null
          created_at?: string | null
          currency?: string
          duration: string
          id?: string
          is_active?: boolean | null
          tax_rate?: number | null
          updated_at?: string | null
          visa_type: Database["public"]["Enums"]["visa_type"]
        }
        Update: {
          base_amount?: number
          convenience_fee?: number | null
          country_code?: string | null
          created_at?: string | null
          currency?: string
          duration?: string
          id?: string
          is_active?: boolean | null
          tax_rate?: number | null
          updated_at?: string | null
          visa_type?: Database["public"]["Enums"]["visa_type"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country: string
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          country: string
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          country?: string
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      travelers: {
        Row: {
          application_status: string
          booking_id: string
          created_at: string
          date_of_birth: string
          email: string | null
          full_name: string
          gender: string
          id: string
          nationality: string
          passport_number: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          application_status?: string
          booking_id: string
          created_at?: string
          date_of_birth: string
          email?: string | null
          full_name: string
          gender: string
          id?: string
          nationality: string
          passport_number: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          application_status?: string
          booking_id?: string
          created_at?: string
          date_of_birth?: string
          email?: string | null
          full_name?: string
          gender?: string
          id?: string
          nationality?: string
          passport_number?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "travelers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visa_applications: {
        Row: {
          admin_notes: string | null
          arrival_point_id: string | null
          changed_name: boolean | null
          changed_name_details: string | null
          citizenship_id: string | null
          city: string
          completed_at: string | null
          countries_visited_last_10_years: string[] | null
          country: string
          country_of_birth: string
          created_at: string | null
          date_of_birth: string
          declaration_accepted: boolean | null
          duration_of_stay: string
          educational_qualification: string | null
          email: string
          expected_port_of_exit: string | null
          father_country_of_birth: string | null
          father_name: string | null
          father_nationality: string | null
          father_place_of_birth: string | null
          father_prev_nationality: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender"]
          given_name: string | null
          hotel_address: string | null
          hotel_booked_through_operator: boolean | null
          hotel_name: string | null
          id: string
          indian_contact_address: string
          indian_contact_person: string | null
          indian_contact_phone: string | null
          intended_arrival_date: string
          is_locked: boolean | null
          last_autosave_at: string | null
          lived_in_applying_country_2_years: boolean | null
          marital_status: string | null
          mobile_isd: string
          mobile_number: string
          mother_country_of_birth: string | null
          mother_name: string | null
          mother_nationality: string | null
          mother_place_of_birth: string | null
          mother_prev_nationality: string | null
          nationality: string
          nationality_by_birth: boolean | null
          other_passport_country: string | null
          other_passport_held: boolean | null
          other_passport_issue_date: string | null
          other_passport_nationality: string | null
          other_passport_number: string | null
          other_passport_place_of_issue: string | null
          pakistan_heritage: boolean | null
          pakistan_heritage_details: string | null
          passport_expiry_date: string
          passport_issue_date: string
          passport_number: string
          passport_place_of_issue: string | null
          permanent_address_house_street: string | null
          permanent_address_same_as_present: boolean | null
          permanent_address_state: string | null
          permanent_address_village_town: string | null
          permission_refused_before: boolean | null
          permission_refused_details: string | null
          place_of_birth: string
          places_to_visit_1: string | null
          places_to_visit_2: string | null
          present_address_country: string | null
          present_address_house_street: string | null
          present_address_phone: string | null
          present_address_postal_code: string | null
          present_address_state: string | null
          present_address_village_town: string | null
          previous_india_address: string | null
          previous_india_cities: string | null
          previous_visa_details: string | null
          previous_visa_issue_date: string | null
          previous_visa_number: string | null
          previous_visa_place_of_issue: string | null
          previous_visa_type: string | null
          purpose_of_visit: string | null
          reference_home_address: string | null
          reference_home_name: string | null
          reference_home_phone: string | null
          reference_india_address: string | null
          reference_india_name: string | null
          reference_india_phone: string | null
          religion: string | null
          residential_address: string
          reviewed_at: string | null
          saarc_countries_details: string | null
          security_arrested_convicted: boolean | null
          security_arrested_details: string | null
          security_asylum_details: string | null
          security_asylum_sought: boolean | null
          security_criminal_activities: boolean | null
          security_criminal_details: string | null
          security_refused_entry_deported: boolean | null
          security_refused_entry_details: string | null
          security_terrorist_activities: boolean | null
          security_terrorist_details: string | null
          security_terrorist_views: boolean | null
          security_terrorist_views_details: string | null
          spouse_country_of_birth: string | null
          spouse_name: string | null
          spouse_nationality: string | null
          spouse_place_of_birth: string | null
          spouse_prev_nationality: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          submitted_at: string | null
          surname: string | null
          updated_at: string | null
          user_id: string
          visa_refusal_details: string | null
          visa_refused_before: boolean | null
          visa_type: Database["public"]["Enums"]["visa_type"]
          visa_type_other: string | null
          visible_identification_marks: string | null
          visited_india_before: boolean | null
          visited_saarc_countries: boolean | null
        }
        Insert: {
          admin_notes?: string | null
          arrival_point_id?: string | null
          changed_name?: boolean | null
          changed_name_details?: string | null
          citizenship_id?: string | null
          city: string
          completed_at?: string | null
          countries_visited_last_10_years?: string[] | null
          country: string
          country_of_birth: string
          created_at?: string | null
          date_of_birth: string
          declaration_accepted?: boolean | null
          duration_of_stay: string
          educational_qualification?: string | null
          email: string
          expected_port_of_exit?: string | null
          father_country_of_birth?: string | null
          father_name?: string | null
          father_nationality?: string | null
          father_place_of_birth?: string | null
          father_prev_nationality?: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender"]
          given_name?: string | null
          hotel_address?: string | null
          hotel_booked_through_operator?: boolean | null
          hotel_name?: string | null
          id?: string
          indian_contact_address: string
          indian_contact_person?: string | null
          indian_contact_phone?: string | null
          intended_arrival_date: string
          is_locked?: boolean | null
          last_autosave_at?: string | null
          lived_in_applying_country_2_years?: boolean | null
          marital_status?: string | null
          mobile_isd: string
          mobile_number: string
          mother_country_of_birth?: string | null
          mother_name?: string | null
          mother_nationality?: string | null
          mother_place_of_birth?: string | null
          mother_prev_nationality?: string | null
          nationality: string
          nationality_by_birth?: boolean | null
          other_passport_country?: string | null
          other_passport_held?: boolean | null
          other_passport_issue_date?: string | null
          other_passport_nationality?: string | null
          other_passport_number?: string | null
          other_passport_place_of_issue?: string | null
          pakistan_heritage?: boolean | null
          pakistan_heritage_details?: string | null
          passport_expiry_date: string
          passport_issue_date: string
          passport_number: string
          passport_place_of_issue?: string | null
          permanent_address_house_street?: string | null
          permanent_address_same_as_present?: boolean | null
          permanent_address_state?: string | null
          permanent_address_village_town?: string | null
          permission_refused_before?: boolean | null
          permission_refused_details?: string | null
          place_of_birth: string
          places_to_visit_1?: string | null
          places_to_visit_2?: string | null
          present_address_country?: string | null
          present_address_house_street?: string | null
          present_address_phone?: string | null
          present_address_postal_code?: string | null
          present_address_state?: string | null
          present_address_village_town?: string | null
          previous_india_address?: string | null
          previous_india_cities?: string | null
          previous_visa_details?: string | null
          previous_visa_issue_date?: string | null
          previous_visa_number?: string | null
          previous_visa_place_of_issue?: string | null
          previous_visa_type?: string | null
          purpose_of_visit?: string | null
          reference_home_address?: string | null
          reference_home_name?: string | null
          reference_home_phone?: string | null
          reference_india_address?: string | null
          reference_india_name?: string | null
          reference_india_phone?: string | null
          religion?: string | null
          residential_address: string
          reviewed_at?: string | null
          saarc_countries_details?: string | null
          security_arrested_convicted?: boolean | null
          security_arrested_details?: string | null
          security_asylum_details?: string | null
          security_asylum_sought?: boolean | null
          security_criminal_activities?: boolean | null
          security_criminal_details?: string | null
          security_refused_entry_deported?: boolean | null
          security_refused_entry_details?: string | null
          security_terrorist_activities?: boolean | null
          security_terrorist_details?: string | null
          security_terrorist_views?: boolean | null
          security_terrorist_views_details?: string | null
          spouse_country_of_birth?: string | null
          spouse_name?: string | null
          spouse_nationality?: string | null
          spouse_place_of_birth?: string | null
          spouse_prev_nationality?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          submitted_at?: string | null
          surname?: string | null
          updated_at?: string | null
          user_id: string
          visa_refusal_details?: string | null
          visa_refused_before?: boolean | null
          visa_type: Database["public"]["Enums"]["visa_type"]
          visa_type_other?: string | null
          visible_identification_marks?: string | null
          visited_india_before?: boolean | null
          visited_saarc_countries?: boolean | null
        }
        Update: {
          admin_notes?: string | null
          arrival_point_id?: string | null
          changed_name?: boolean | null
          changed_name_details?: string | null
          citizenship_id?: string | null
          city?: string
          completed_at?: string | null
          countries_visited_last_10_years?: string[] | null
          country?: string
          country_of_birth?: string
          created_at?: string | null
          date_of_birth?: string
          declaration_accepted?: boolean | null
          duration_of_stay?: string
          educational_qualification?: string | null
          email?: string
          expected_port_of_exit?: string | null
          father_country_of_birth?: string | null
          father_name?: string | null
          father_nationality?: string | null
          father_place_of_birth?: string | null
          father_prev_nationality?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          given_name?: string | null
          hotel_address?: string | null
          hotel_booked_through_operator?: boolean | null
          hotel_name?: string | null
          id?: string
          indian_contact_address?: string
          indian_contact_person?: string | null
          indian_contact_phone?: string | null
          intended_arrival_date?: string
          is_locked?: boolean | null
          last_autosave_at?: string | null
          lived_in_applying_country_2_years?: boolean | null
          marital_status?: string | null
          mobile_isd?: string
          mobile_number?: string
          mother_country_of_birth?: string | null
          mother_name?: string | null
          mother_nationality?: string | null
          mother_place_of_birth?: string | null
          mother_prev_nationality?: string | null
          nationality?: string
          nationality_by_birth?: boolean | null
          other_passport_country?: string | null
          other_passport_held?: boolean | null
          other_passport_issue_date?: string | null
          other_passport_nationality?: string | null
          other_passport_number?: string | null
          other_passport_place_of_issue?: string | null
          pakistan_heritage?: boolean | null
          pakistan_heritage_details?: string | null
          passport_expiry_date?: string
          passport_issue_date?: string
          passport_number?: string
          passport_place_of_issue?: string | null
          permanent_address_house_street?: string | null
          permanent_address_same_as_present?: boolean | null
          permanent_address_state?: string | null
          permanent_address_village_town?: string | null
          permission_refused_before?: boolean | null
          permission_refused_details?: string | null
          place_of_birth?: string
          places_to_visit_1?: string | null
          places_to_visit_2?: string | null
          present_address_country?: string | null
          present_address_house_street?: string | null
          present_address_phone?: string | null
          present_address_postal_code?: string | null
          present_address_state?: string | null
          present_address_village_town?: string | null
          previous_india_address?: string | null
          previous_india_cities?: string | null
          previous_visa_details?: string | null
          previous_visa_issue_date?: string | null
          previous_visa_number?: string | null
          previous_visa_place_of_issue?: string | null
          previous_visa_type?: string | null
          purpose_of_visit?: string | null
          reference_home_address?: string | null
          reference_home_name?: string | null
          reference_home_phone?: string | null
          reference_india_address?: string | null
          reference_india_name?: string | null
          reference_india_phone?: string | null
          religion?: string | null
          residential_address?: string
          reviewed_at?: string | null
          saarc_countries_details?: string | null
          security_arrested_convicted?: boolean | null
          security_arrested_details?: string | null
          security_asylum_details?: string | null
          security_asylum_sought?: boolean | null
          security_criminal_activities?: boolean | null
          security_criminal_details?: string | null
          security_refused_entry_deported?: boolean | null
          security_refused_entry_details?: string | null
          security_terrorist_activities?: boolean | null
          security_terrorist_details?: string | null
          security_terrorist_views?: boolean | null
          security_terrorist_views_details?: string | null
          spouse_country_of_birth?: string | null
          spouse_name?: string | null
          spouse_nationality?: string | null
          spouse_place_of_birth?: string | null
          spouse_prev_nationality?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          submitted_at?: string | null
          surname?: string | null
          updated_at?: string | null
          user_id?: string
          visa_refusal_details?: string | null
          visa_refused_before?: boolean | null
          visa_type?: Database["public"]["Enums"]["visa_type"]
          visa_type_other?: string | null
          visible_identification_marks?: string | null
          visited_india_before?: boolean | null
          visited_saarc_countries?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "visa_applications_arrival_point_id_fkey"
            columns: ["arrival_point_id"]
            isOneToOne: false
            referencedRelation: "arrival_points"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      application_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "in_review"
        | "completed"
        | "rejected"
      booking_state:
        | "paid_not_submitted"
        | "paid_submitted"
        | "under_review"
        | "completed"
      document_type:
        | "photo"
        | "passport"
        | "business_card"
        | "invitation_letter"
        | "hospital_letter"
        | "conference_docs"
        | "other"
      gender: "male" | "female" | "other"
      payment_status:
        | "initiated"
        | "pending"
        | "completed"
        | "failed"
        | "refunded"
      visa_type:
        | "tourist"
        | "business"
        | "medical"
        | "conference"
        | "student"
        | "other"
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
      app_role: ["admin", "moderator", "user"],
      application_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "in_review",
        "completed",
        "rejected",
      ],
      booking_state: [
        "paid_not_submitted",
        "paid_submitted",
        "under_review",
        "completed",
      ],
      document_type: [
        "photo",
        "passport",
        "business_card",
        "invitation_letter",
        "hospital_letter",
        "conference_docs",
        "other",
      ],
      gender: ["male", "female", "other"],
      payment_status: [
        "initiated",
        "pending",
        "completed",
        "failed",
        "refunded",
      ],
      visa_type: [
        "tourist",
        "business",
        "medical",
        "conference",
        "student",
        "other",
      ],
    },
  },
} as const
