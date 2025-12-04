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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      alerts: {
        Row: {
          assessment_id: string | null
          created_at: string
          id: string
          payload: Json
          type: string
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string
          id?: string
          payload: Json
          type: string
        }
        Update: {
          assessment_id?: string | null
          created_at?: string
          id?: string
          payload?: Json
          type?: string
        }
        Relationships: []
      }
      assessment_progress: {
        Row: {
          answer: string | null
          answered_at: string | null
          assessment_id: string | null
          created_at: string | null
          id: string
          question_id: string
          question_number: number
          question_text: string
          session_id: string
          updated_at: string | null
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          assessment_id?: string | null
          created_at?: string | null
          id?: string
          question_id: string
          question_number: number
          question_text: string
          session_id: string
          updated_at?: string | null
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          assessment_id?: string | null
          created_at?: string | null
          id?: string
          question_id?: string
          question_number?: number
          question_text?: string
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_progress_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_sessions: {
        Row: {
          assessment_id: string | null
          completed_at: string | null
          created_at: string | null
          drop_off_question_id: string | null
          drop_off_question_number: number | null
          id: string
          last_active_at: string | null
          questions_answered: number | null
          referrer_source: string | null
          session_id: string
          started_at: string | null
          time_spent_seconds: number | null
          total_questions: number | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          assessment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          drop_off_question_id?: string | null
          drop_off_question_number?: number | null
          id?: string
          last_active_at?: string | null
          questions_answered?: number | null
          referrer_source?: string | null
          session_id: string
          started_at?: string | null
          time_spent_seconds?: number | null
          total_questions?: number | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          assessment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          drop_off_question_id?: string | null
          drop_off_question_number?: number | null
          id?: string
          last_active_at?: string | null
          questions_answered?: number | null
          referrer_source?: string | null
          session_id?: string
          started_at?: string | null
          time_spent_seconds?: number | null
          total_questions?: number | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_sessions_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          contact_consent: boolean | null
          created_at: string | null
          delivery_method: 'sms' | 'email' | 'both' | null
          disclosures: string[] | null
          email: string | null
          enrolled_in_paincrowdsource: boolean | null
          guide_delivered_at: string | null
          guide_opened_at: string | null
          guide_type: Database["public"]["Enums"]["guide_type"] | null
          has_red_flags: boolean | null
          id: string
          initial_pain_score: number | null
          marketing_opted_out: boolean | null
          name: string | null
          paincrowdsource_id: string | null
          payment_completed: boolean | null
          payment_tier: Database["public"]["Enums"]["payment_tier"] | null
          phone_number: string | null
          referrer_source: string | null
          research_id: string | null
          responses: Json
          session_id: string
          sms_consent_timestamp: string | null
          sms_opt_in: boolean | null
          sms_opted_out: boolean | null
          stripe_session_id: string | null
          telehealth_provider_notes: string | null
          telehealth_requested: boolean | null
          telehealth_scheduled_at: string | null
          updated_at: string | null
        }
        Insert: {
          contact_consent?: boolean | null
          created_at?: string | null
          delivery_method?: 'sms' | 'email' | 'both' | null
          disclosures?: string[] | null
          email?: string | null
          enrolled_in_paincrowdsource?: boolean | null
          guide_delivered_at?: string | null
          guide_opened_at?: string | null
          guide_type?: Database["public"]["Enums"]["guide_type"] | null
          has_red_flags?: boolean | null
          id?: string
          initial_pain_score?: number | null
          marketing_opted_out?: boolean | null
          name?: string | null
          paincrowdsource_id?: string | null
          payment_completed?: boolean | null
          payment_tier?: Database["public"]["Enums"]["payment_tier"] | null
          phone_number?: string | null
          referrer_source?: string | null
          research_id?: string | null
          responses?: Json
          session_id?: string
          sms_consent_timestamp?: string | null
          sms_opt_in?: boolean | null
          sms_opted_out?: boolean | null
          stripe_session_id?: string | null
          telehealth_provider_notes?: string | null
          telehealth_requested?: boolean | null
          telehealth_scheduled_at?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_consent?: boolean | null
          created_at?: string | null
          delivery_method?: 'sms' | 'email' | 'both' | null
          disclosures?: string[] | null
          email?: string | null
          enrolled_in_paincrowdsource?: boolean | null
          guide_delivered_at?: string | null
          guide_opened_at?: string | null
          guide_type?: Database["public"]["Enums"]["guide_type"] | null
          has_red_flags?: boolean | null
          id?: string
          initial_pain_score?: number | null
          marketing_opted_out?: boolean | null
          name?: string | null
          paincrowdsource_id?: string | null
          payment_completed?: boolean | null
          payment_tier?: Database["public"]["Enums"]["payment_tier"] | null
          phone_number?: string | null
          referrer_source?: string | null
          research_id?: string | null
          responses?: Json
          session_id?: string
          sms_consent_timestamp?: string | null
          sms_opt_in?: boolean | null
          sms_opted_out?: boolean | null
          stripe_session_id?: string | null
          telehealth_provider_notes?: string | null
          telehealth_requested?: boolean | null
          telehealth_scheduled_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      check_in_queue: {
        Row: {
          assessment_id: string
          channel: string
          day: number
          due_at: string
          id: string
          last_error: string | null
          sent_at: string | null
          status: string
          template_key: string
        }
        Insert: {
          assessment_id: string
          channel?: string
          day: number
          due_at: string
          id?: string
          last_error?: string | null
          sent_at?: string | null
          status?: string
          template_key: string
        }
        Update: {
          assessment_id?: string
          channel?: string
          day?: number
          due_at?: string
          id?: string
          last_error?: string | null
          sent_at?: string | null
          status?: string
          template_key?: string
        }
        Relationships: []
      }
      check_in_responses: {
        Row: {
          assessment_id: string
          created_at: string
          day: number
          id: string
          note: string | null
          value: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          day: number
          id?: string
          note?: string | null
          value: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          day?: number
          id?: string
          note?: string | null
          value?: string
        }
        Relationships: []
      }
      communication_logs: {
        Row: {
          assessment_id: string | null
          channel: string | null
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          message: string | null
          metadata: Json | null
          opened_at: string | null
          provider: string | null
          provider_message_id: string | null
          recipient: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          template_key: string | null
          type: string
        }
        Insert: {
          assessment_id?: string | null
          channel?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          opened_at?: string | null
          provider?: string | null
          provider_message_id?: string | null
          recipient?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_key?: string | null
          type: string
        }
        Update: {
          assessment_id?: string | null
          channel?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          opened_at?: string | null
          provider?: string | null
          provider_message_id?: string | null
          recipient?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          template_key?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_logs_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_audit_log: {
        Row: {
          additional_notes: string | null
          assessment_id: string
          data_summary: Json | null
          deleted_at: string
          deleted_by: string
          deletion_reason: string
          id: string
          user_email: string
        }
        Insert: {
          additional_notes?: string | null
          assessment_id: string
          data_summary?: Json | null
          deleted_at?: string
          deleted_by: string
          deletion_reason: string
          id?: string
          user_email: string
        }
        Update: {
          additional_notes?: string | null
          assessment_id?: string
          data_summary?: Json | null
          deleted_at?: string
          deleted_by?: string
          deletion_reason?: string
          id?: string
          user_email?: string
        }
        Relationships: []
      }
      deletion_requests: {
        Row: {
          completed_at: string | null
          id: string
          identifier: string
          requested_at: string | null
          verification_code: string
          verified: boolean | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          identifier: string
          requested_at?: string | null
          verification_code: string
          verified?: boolean | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          identifier?: string
          requested_at?: string | null
          verification_code?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      diagnosis_inserts: {
        Row: {
          branch: string
          day: number
          diagnosis_code: string
          id: string
          insert_text: string
        }
        Insert: {
          branch: string
          day: number
          diagnosis_code: string
          id?: string
          insert_text: string
        }
        Update: {
          branch?: string
          day?: number
          diagnosis_code?: string
          id?: string
          insert_text?: string
        }
        Relationships: []
      }
      email_events: {
        Row: {
          assessment_id: string | null
          created_at: string | null
          dedupe_key: string | null
          email_type: string
          id: string
          sent: boolean | null
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string | null
          dedupe_key?: string | null
          email_type: string
          id?: string
          sent?: boolean | null
        }
        Update: {
          assessment_id?: string | null
          created_at?: string | null
          dedupe_key?: string | null
          email_type?: string
          id?: string
          sent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      encouragements: {
        Row: {
          id: string
          text: string
        }
        Insert: {
          id?: string
          text: string
        }
        Update: {
          id?: string
          text?: string
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          assessment_id: string | null
          emailed_at: string | null
          id: string
          incentive_claimed: boolean | null
          outcome_data: Json | null
          response_received_at: string | null
          run_at: string | null
          scheduled_for: string
          sent: boolean | null
          sent_at: string | null
          type: string | null
        }
        Insert: {
          assessment_id?: string | null
          emailed_at?: string | null
          id?: string
          incentive_claimed?: boolean | null
          outcome_data?: Json | null
          response_received_at?: string | null
          run_at?: string | null
          scheduled_for: string
          sent?: boolean | null
          sent_at?: string | null
          type?: string | null
        }
        Update: {
          assessment_id?: string | null
          emailed_at?: string | null
          id?: string
          incentive_claimed?: boolean | null
          outcome_data?: Json | null
          response_received_at?: string | null
          run_at?: string | null
          scheduled_for?: string
          sent?: boolean | null
          sent_at?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_deliveries: {
        Row: {
          assessment_id: string | null
          delivered_at: string | null
          delivery_method: string | null
          delivery_status: string | null
          error_message: string | null
          id: string
          opened_at: string | null
        }
        Insert: {
          assessment_id?: string | null
          delivered_at?: string | null
          delivery_method?: string | null
          delivery_status?: string | null
          error_message?: string | null
          id?: string
          opened_at?: string | null
        }
        Update: {
          assessment_id?: string | null
          delivered_at?: string | null
          delivery_method?: string | null
          delivery_status?: string | null
          error_message?: string | null
          id?: string
          opened_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guide_deliveries_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      kv_health: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          channel: string
          created_at: string
          cta_url: string | null
          disclaimer_text: string
          id: string
          key: string
          shell_text: string
          subject: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          cta_url?: string | null
          disclaimer_text: string
          id?: string
          key: string
          shell_text: string
          subject?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          cta_url?: string | null
          disclaimer_text?: string
          id?: string
          key?: string
          shell_text?: string
          subject?: string | null
        }
        Relationships: []
      }
      paincrowdsource_sync_queue: {
        Row: {
          anon_id: string
          assessment_id: string | null
          created_at: string | null
          error_message: string | null
          guide_type: string
          id: string
          initial_pain_score: number | null
          last_attempt_at: string | null
          status: string | null
          sync_attempts: number | null
          synced_at: string | null
        }
        Insert: {
          anon_id: string
          assessment_id?: string | null
          created_at?: string | null
          error_message?: string | null
          guide_type: string
          id?: string
          initial_pain_score?: number | null
          last_attempt_at?: string | null
          status?: string | null
          sync_attempts?: number | null
          synced_at?: string | null
        }
        Update: {
          anon_id?: string
          assessment_id?: string | null
          created_at?: string | null
          error_message?: string | null
          guide_type?: string
          id?: string
          initial_pain_score?: number | null
          last_attempt_at?: string | null
          status?: string | null
          sync_attempts?: number | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paincrowdsource_sync_queue_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_logs: {
        Row: {
          amount_cents: number | null
          assessment_id: string | null
          created_at: string | null
          currency: string | null
          customer_email: string | null
          customer_id: string | null
          id: string
          metadata: Json | null
          status: string | null
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          tier: string | null
        }
        Insert: {
          amount_cents?: number | null
          assessment_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          tier?: string | null
        }
        Update: {
          amount_cents?: number | null
          assessment_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_id?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_generation_logs: {
        Row: {
          assessment_id: string | null
          completed_at: string | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          file_size_bytes: number | null
          id: string
          ip_address: unknown | null
          page_count: number | null
          requested_by: string | null
          retry_count: number | null
          started_at: string | null
          status: string | null
          tier: string
        }
        Insert: {
          assessment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          file_size_bytes?: number | null
          id?: string
          ip_address?: unknown | null
          page_count?: number | null
          requested_by?: string | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          tier: string
        }
        Update: {
          assessment_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          file_size_bytes?: number | null
          id?: string
          ip_address?: unknown | null
          page_count?: number | null
          requested_by?: string | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_generation_logs_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          created_at: string | null
          id: string
          metric_name: string
          metric_unit: string | null
          metric_value: number
          request_id: string | null
          tags: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          request_id?: string | null
          tags?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          request_id?: string | null
          tags?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          updated_at: string | null
          user_role: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          updated_at?: string | null
          user_role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      revenue_events: {
        Row: {
          amount_cents: number | null
          assessment_id: string
          created_at: string
          id: string
          source: string
          stripe_id: string | null
        }
        Insert: {
          amount_cents?: number | null
          assessment_id: string
          created_at?: string
          id?: string
          source: string
          stripe_id?: string | null
        }
        Update: {
          amount_cents?: number | null
          assessment_id?: string
          created_at?: string
          id?: string
          source?: string
          stripe_id?: string | null
        }
        Relationships: []
      }
      sms_opt_outs: {
        Row: {
          created_at: string | null
          id: string
          opt_out_source: string | null
          opted_out_at: string | null
          phone_number: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          opt_out_source?: string | null
          opted_out_at?: string | null
          phone_number: string
        }
        Update: {
          created_at?: string | null
          id?: string
          opt_out_source?: string | null
          opted_out_at?: string | null
          phone_number?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          anon_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          not_helpful: string | null
          outcome_narrative: string | null
          pain_type: string
          status: string
          story_narrative: string | null
          submitter_ip_hash: string | null
          summary: Json | null
          thread_root_id: string | null
          timeframe: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          anon_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          not_helpful?: string | null
          outcome_narrative?: string | null
          pain_type: string
          status?: string
          story_narrative?: string | null
          submitter_ip_hash?: string | null
          summary?: Json | null
          thread_root_id?: string | null
          timeframe?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          anon_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          not_helpful?: string | null
          outcome_narrative?: string | null
          pain_type?: string
          status?: string
          story_narrative?: string | null
          submitter_ip_hash?: string | null
          summary?: Json | null
          thread_root_id?: string | null
          timeframe?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_thread_root_id_fkey"
            columns: ["thread_root_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          created_at: string | null
          error_stack: string | null
          id: string
          level: string
          message: string
          metadata: Json | null
          request_id: string | null
          service: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_stack?: string | null
          id?: string
          level: string
          message: string
          metadata?: Json | null
          request_id?: string | null
          service?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_stack?: string | null
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
          request_id?: string | null
          service?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      telehealth_appointments: {
        Row: {
          assessment_id: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          meeting_link: string | null
          provider_notes: string | null
          scheduled_for: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assessment_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          provider_notes?: string | null
          scheduled_for: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assessment_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          meeting_link?: string | null
          provider_notes?: string | null
          scheduled_for?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "telehealth_appointments_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_access_logs: {
        Row: {
          action: string
          assessment_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_identifier: string
        }
        Insert: {
          action: string
          assessment_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_identifier: string
        }
        Update: {
          action?: string
          assessment_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_identifier?: string
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          attempts: number | null
          code: string
          created_at: string | null
          expires_at: string
          id: string
          identifier: string
          identifier_type: string
          ip_address: string | null
          verified: boolean | null
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          identifier: string
          identifier_type: string
          ip_address?: string | null
          verified?: boolean | null
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          identifier?: string
          identifier_type?: string
          ip_address?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      verification_rate_limits: {
        Row: {
          action: string
          attempts: number | null
          created_at: string | null
          id: string
          identifier: string | null
          identifier_type: string
          window_start: string | null
        }
        Insert: {
          action: string
          attempts?: number | null
          created_at?: string | null
          id?: string
          identifier?: string | null
          identifier_type: string
          window_start?: string | null
        }
        Update: {
          action?: string
          attempts?: number | null
          created_at?: string | null
          id?: string
          identifier?: string | null
          identifier_type?: string
          window_start?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      daily_log_summary: {
        Row: {
          affected_users: number | null
          date: string | null
          level: string | null
          log_count: number | null
          unique_requests: number | null
        }
        Relationships: []
      }
      recent_activity: {
        Row: {
          assessment_id: string | null
          created_at: string | null
          status: string | null
          subtype: string | null
          target: string | null
          type: string | null
        }
        Relationships: []
      }
      recent_errors: {
        Row: {
          created_at: string | null
          error_stack: string | null
          id: string | null
          level: string | null
          message: string | null
          metadata: Json | null
          request_id: string | null
          service: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_stack?: string | null
          id?: string | null
          level?: string | null
          message?: string | null
          metadata?: Json | null
          request_id?: string | null
          service?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_stack?: string | null
          id?: string | null
          level?: string | null
          message?: string | null
          metadata?: Json | null
          request_id?: string | null
          service?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cancel_pending_followups: {
        Args: { p_assessment_id: string; p_types: string[] }
        Returns: number
      }
      claim_email_send: {
        Args: { dedupe_key: string }
        Returns: undefined
      }
      cleanup_old_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_error_stats: {
        Args: { time_range?: unknown }
        Returns: {
          affected_users: number
          error_count: number
          error_rate: number
          most_common_error: string
          unique_errors: number
        }[]
      }
      get_submission_thread: {
        Args: { submission_id: string }
        Returns: {
          anon_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          not_helpful: string | null
          outcome_narrative: string | null
          pain_type: string
          status: string
          story_narrative: string | null
          submitter_ip_hash: string | null
          summary: Json | null
          thread_root_id: string | null
          timeframe: string | null
          updated_at: string
          user_id: string | null
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      has_email_engagement: {
        Args: { p_assessment_id: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_communication: {
        Args: {
          p_assessment_id?: string
          p_message: string
          p_recipient: string
          p_status?: string
          p_subject: string
          p_type: string
        }
        Returns: string
      }
      log_system_event: {
        Args: { p_level: string; p_message: string; p_metadata?: Json }
        Returns: string
      }
      search_submissions_fuzzy: {
        Args: { search_term: string; similarity_threshold?: number }
        Returns: {
          anon_id: string
          created_at: string
          deleted_at: string
          id: string
          not_helpful: string
          outcome_narrative: string
          pain_type: string
          similarity: number
          status: string
          story_narrative: string
          submitter_ip_hash: string
          summary: Json
          thread_root_id: string
          timeframe: string
          updated_at: string
          user_id: string
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      update_health_status: {
        Args: { p_key: string; p_timestamp?: string }
        Returns: undefined
      }
    }
    Enums: {
      guide_type:
        | "sciatica"
        | "upper_lumbar_radiculopathy"
        | "si_joint_dysfunction"
        | "canal_stenosis"
        | "central_disc_bulge"
        | "facet_arthropathy"
        | "muscular_nslbp"
        | "lumbar_instability"
        | "urgent_symptoms"
      payment_tier: "free" | "enhanced" | "comprehensive"
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
      guide_type: [
        "sciatica",
        "upper_lumbar_radiculopathy",
        "si_joint_dysfunction",
        "canal_stenosis",
        "central_disc_bulge",
        "facet_arthropathy",
        "muscular_nslbp",
        "lumbar_instability",
        "urgent_symptoms",
      ],
      payment_tier: ["free", "enhanced", "comprehensive"],
    },
  },
} as const
