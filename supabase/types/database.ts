export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: Database['public']['Enums']['audit_action'];
          actor_user_id: string | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          ip_hash: string | null;
          metadata: Json;
          request_id: string | null;
        };
        Insert: {
          action: Database['public']['Enums']['audit_action'];
          actor_user_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          ip_hash?: string | null;
          metadata?: Json;
          request_id?: string | null;
        };
        Update: {
          action?: Database['public']['Enums']['audit_action'];
          actor_user_id?: string | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          ip_hash?: string | null;
          metadata?: Json;
          request_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'audit_events_actor_user_id_fkey';
            columns: ['actor_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      conversation_summaries: {
        Row: {
          created_at: string;
          critical_fields: Json;
          id: string;
          session_id: string;
          source_segment_count: number;
          summary_text: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          critical_fields?: Json;
          id?: string;
          session_id: string;
          source_segment_count: number;
          summary_text: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          critical_fields?: Json;
          id?: string;
          session_id?: string;
          source_segment_count?: number;
          summary_text?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'conversation_summaries_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: true;
            referencedRelation: 'translator_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      languages: {
        Row: {
          code: string;
          created_at: string;
          direction: string;
          id: string;
          is_active: boolean;
          is_learning_language: boolean;
          is_translation_source: boolean;
          is_translation_target: boolean;
          name: string;
          native_name: string;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          direction?: string;
          id?: string;
          is_active?: boolean;
          is_learning_language?: boolean;
          is_translation_source?: boolean;
          is_translation_target?: boolean;
          name: string;
          native_name: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          direction?: string;
          id?: string;
          is_active?: boolean;
          is_learning_language?: boolean;
          is_translation_source?: boolean;
          is_translation_target?: boolean;
          name?: string;
          native_name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      learning_categories: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          language_id: string;
          sequence: number;
          slug: string;
          status: Database['public']['Enums']['content_status'];
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          language_id: string;
          sequence: number;
          slug: string;
          status?: Database['public']['Enums']['content_status'];
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          language_id?: string;
          sequence?: number;
          slug?: string;
          status?: Database['public']['Enums']['content_status'];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'learning_categories_language_id_fkey';
            columns: ['language_id'];
            isOneToOne: false;
            referencedRelation: 'languages';
            referencedColumns: ['id'];
          },
        ];
      };
      learning_chapters: {
        Row: {
          category_id: string;
          created_at: string;
          description: string | null;
          id: string;
          sequence: number;
          slug: string;
          status: Database['public']['Enums']['content_status'];
          title: string;
          updated_at: string;
        };
        Insert: {
          category_id: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          sequence: number;
          slug: string;
          status?: Database['public']['Enums']['content_status'];
          title: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          sequence?: number;
          slug?: string;
          status?: Database['public']['Enums']['content_status'];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'learning_chapters_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'learning_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      lesson_items: {
        Row: {
          audio_asset_path: string | null;
          created_at: string;
          explanation: string | null;
          id: string;
          image_asset_path: string | null;
          item_type: Database['public']['Enums']['lesson_item_type'];
          lesson_id: string;
          metadata: Json;
          norwegian_translation: string | null;
          sequence: number;
          source_text: string | null;
          status: Database['public']['Enums']['content_status'];
          transliteration: string | null;
          updated_at: string;
        };
        Insert: {
          audio_asset_path?: string | null;
          created_at?: string;
          explanation?: string | null;
          id?: string;
          image_asset_path?: string | null;
          item_type: Database['public']['Enums']['lesson_item_type'];
          lesson_id: string;
          metadata?: Json;
          norwegian_translation?: string | null;
          sequence: number;
          source_text?: string | null;
          status?: Database['public']['Enums']['content_status'];
          transliteration?: string | null;
          updated_at?: string;
        };
        Update: {
          audio_asset_path?: string | null;
          created_at?: string;
          explanation?: string | null;
          id?: string;
          image_asset_path?: string | null;
          item_type?: Database['public']['Enums']['lesson_item_type'];
          lesson_id?: string;
          metadata?: Json;
          norwegian_translation?: string | null;
          sequence?: number;
          source_text?: string | null;
          status?: Database['public']['Enums']['content_status'];
          transliteration?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lesson_items_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'lessons';
            referencedColumns: ['id'];
          },
        ];
      };
      lessons: {
        Row: {
          chapter_id: string;
          created_at: string;
          description: string | null;
          difficulty: number | null;
          estimated_minutes: number | null;
          id: string;
          sequence: number;
          slug: string;
          status: Database['public']['Enums']['content_status'];
          title: string;
          updated_at: string;
        };
        Insert: {
          chapter_id: string;
          created_at?: string;
          description?: string | null;
          difficulty?: number | null;
          estimated_minutes?: number | null;
          id?: string;
          sequence: number;
          slug: string;
          status?: Database['public']['Enums']['content_status'];
          title: string;
          updated_at?: string;
        };
        Update: {
          chapter_id?: string;
          created_at?: string;
          description?: string | null;
          difficulty?: number | null;
          estimated_minutes?: number | null;
          id?: string;
          sequence?: number;
          slug?: string;
          status?: Database['public']['Enums']['content_status'];
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'lessons_chapter_id_fkey';
            columns: ['chapter_id'];
            isOneToOne: false;
            referencedRelation: 'learning_chapters';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          native_language_code: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          native_language_code?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          native_language_code?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_native_language_code_fkey';
            columns: ['native_language_code'];
            isOneToOne: false;
            referencedRelation: 'languages';
            referencedColumns: ['code'];
          },
        ];
      };
      pronunciation_attempts: {
        Row: {
          audio_retained: boolean;
          audio_storage_path: string | null;
          confidence: number | null;
          created_at: string;
          feedback: Json;
          id: string;
          lesson_item_id: string;
          provider: string | null;
          provider_model: string | null;
          score: number | null;
          user_id: string;
        };
        Insert: {
          audio_retained?: boolean;
          audio_storage_path?: string | null;
          confidence?: number | null;
          created_at?: string;
          feedback?: Json;
          id?: string;
          lesson_item_id: string;
          provider?: string | null;
          provider_model?: string | null;
          score?: number | null;
          user_id?: string;
        };
        Update: {
          audio_retained?: boolean;
          audio_storage_path?: string | null;
          confidence?: number | null;
          created_at?: string;
          feedback?: Json;
          id?: string;
          lesson_item_id?: string;
          provider?: string | null;
          provider_model?: string | null;
          score?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'pronunciation_attempts_lesson_item_id_fkey';
            columns: ['lesson_item_id'];
            isOneToOne: false;
            referencedRelation: 'lesson_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'pronunciation_attempts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      provider_usage: {
        Row: {
          cost_amount: number;
          cost_currency: string;
          created_at: string;
          error_category: string | null;
          id: string;
          input_units: number;
          latency_ms: number | null;
          model: string;
          operation: Database['public']['Enums']['provider_operation'];
          output_units: number;
          provider: string;
          request_id: string | null;
          session_id: string | null;
          succeeded: boolean;
          user_id: string | null;
        };
        Insert: {
          cost_amount?: number;
          cost_currency?: string;
          created_at?: string;
          error_category?: string | null;
          id?: string;
          input_units?: number;
          latency_ms?: number | null;
          model: string;
          operation: Database['public']['Enums']['provider_operation'];
          output_units?: number;
          provider: string;
          request_id?: string | null;
          session_id?: string | null;
          succeeded: boolean;
          user_id?: string | null;
        };
        Update: {
          cost_amount?: number;
          cost_currency?: string;
          created_at?: string;
          error_category?: string | null;
          id?: string;
          input_units?: number;
          latency_ms?: number | null;
          model?: string;
          operation?: Database['public']['Enums']['provider_operation'];
          output_units?: number;
          provider?: string;
          request_id?: string | null;
          session_id?: string | null;
          succeeded?: boolean;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'provider_usage_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'translator_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'provider_usage_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      review_items: {
        Row: {
          created_at: string;
          due_at: string;
          ease_factor: number;
          id: string;
          interval_days: number;
          last_reviewed_at: string | null;
          lesson_item_id: string;
          repetitions: number;
          state: Database['public']['Enums']['review_state'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          due_at?: string;
          ease_factor?: number;
          id?: string;
          interval_days?: number;
          last_reviewed_at?: string | null;
          lesson_item_id: string;
          repetitions?: number;
          state?: Database['public']['Enums']['review_state'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          due_at?: string;
          ease_factor?: number;
          id?: string;
          interval_days?: number;
          last_reviewed_at?: string | null;
          lesson_item_id?: string;
          repetitions?: number;
          state?: Database['public']['Enums']['review_state'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'review_items_lesson_item_id_fkey';
            columns: ['lesson_item_id'];
            isOneToOne: false;
            referencedRelation: 'lesson_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'review_items_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      transcript_segments: {
        Row: {
          confidence: number | null;
          created_at: string;
          critical_fields: Json;
          end_ms: number | null;
          id: string;
          revision: number;
          sequence: number;
          session_id: string;
          source_dialect_code: string | null;
          source_language_code: string | null;
          speaker_id: string;
          start_ms: number;
          state: Database['public']['Enums']['segment_state'];
          transcript_text: string;
        };
        Insert: {
          confidence?: number | null;
          created_at?: string;
          critical_fields?: Json;
          end_ms?: number | null;
          id?: string;
          revision?: number;
          sequence: number;
          session_id: string;
          source_dialect_code?: string | null;
          source_language_code?: string | null;
          speaker_id: string;
          start_ms: number;
          state?: Database['public']['Enums']['segment_state'];
          transcript_text: string;
        };
        Update: {
          confidence?: number | null;
          created_at?: string;
          critical_fields?: Json;
          end_ms?: number | null;
          id?: string;
          revision?: number;
          sequence?: number;
          session_id?: string;
          source_dialect_code?: string | null;
          source_language_code?: string | null;
          speaker_id?: string;
          start_ms?: number;
          state?: Database['public']['Enums']['segment_state'];
          transcript_text?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transcript_segments_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'translator_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transcript_segments_speaker_id_fkey';
            columns: ['speaker_id'];
            isOneToOne: false;
            referencedRelation: 'translator_speakers';
            referencedColumns: ['id'];
          },
        ];
      };
      translation_segments: {
        Row: {
          confidence: number | null;
          correction_reason: string | null;
          created_at: string;
          critical_fields_verified: boolean;
          id: string;
          revision: number;
          sequence: number;
          session_id: string;
          state: Database['public']['Enums']['segment_state'];
          target_language_code: string;
          transcript_segment_id: string;
          translated_text: string;
        };
        Insert: {
          confidence?: number | null;
          correction_reason?: string | null;
          created_at?: string;
          critical_fields_verified?: boolean;
          id?: string;
          revision?: number;
          sequence: number;
          session_id: string;
          state?: Database['public']['Enums']['segment_state'];
          target_language_code?: string;
          transcript_segment_id: string;
          translated_text: string;
        };
        Update: {
          confidence?: number | null;
          correction_reason?: string | null;
          created_at?: string;
          critical_fields_verified?: boolean;
          id?: string;
          revision?: number;
          sequence?: number;
          session_id?: string;
          state?: Database['public']['Enums']['segment_state'];
          target_language_code?: string;
          transcript_segment_id?: string;
          translated_text?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'translation_segments_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'translator_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'translation_segments_target_language_code_fkey';
            columns: ['target_language_code'];
            isOneToOne: false;
            referencedRelation: 'languages';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'translation_segments_transcript_segment_id_fkey';
            columns: ['transcript_segment_id'];
            isOneToOne: false;
            referencedRelation: 'transcript_segments';
            referencedColumns: ['id'];
          },
        ];
      };
      translator_session_metrics: {
        Row: {
          average_confidence: number | null;
          created_at: string;
          degraded_duration_ms: number;
          dropped_segment_count: number;
          first_partial_latency_ms: number | null;
          first_translation_latency_ms: number | null;
          id: string;
          metadata: Json;
          reconnect_count: number;
          session_id: string;
          updated_at: string;
        };
        Insert: {
          average_confidence?: number | null;
          created_at?: string;
          degraded_duration_ms?: number;
          dropped_segment_count?: number;
          first_partial_latency_ms?: number | null;
          first_translation_latency_ms?: number | null;
          id?: string;
          metadata?: Json;
          reconnect_count?: number;
          session_id: string;
          updated_at?: string;
        };
        Update: {
          average_confidence?: number | null;
          created_at?: string;
          degraded_duration_ms?: number;
          dropped_segment_count?: number;
          first_partial_latency_ms?: number | null;
          first_translation_latency_ms?: number | null;
          id?: string;
          metadata?: Json;
          reconnect_count?: number;
          session_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'translator_session_metrics_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: true;
            referencedRelation: 'translator_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      translator_sessions: {
        Row: {
          created_at: string;
          ended_at: string | null;
          environment: Database['public']['Enums']['app_environment'];
          id: string;
          retention_mode: Database['public']['Enums']['retention_mode'];
          started_at: string;
          status: Database['public']['Enums']['translator_session_status'];
          target_language_code: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          ended_at?: string | null;
          environment?: Database['public']['Enums']['app_environment'];
          id?: string;
          retention_mode?: Database['public']['Enums']['retention_mode'];
          started_at?: string;
          status?: Database['public']['Enums']['translator_session_status'];
          target_language_code?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          ended_at?: string | null;
          environment?: Database['public']['Enums']['app_environment'];
          id?: string;
          retention_mode?: Database['public']['Enums']['retention_mode'];
          started_at?: string;
          status?: Database['public']['Enums']['translator_session_status'];
          target_language_code?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'translator_sessions_target_language_code_fkey';
            columns: ['target_language_code'];
            isOneToOne: false;
            referencedRelation: 'languages';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'translator_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      translator_speakers: {
        Row: {
          created_at: string;
          detected_language_codes: string[];
          first_seen_at: string;
          id: string;
          last_seen_at: string | null;
          session_id: string;
          stable_label: Database['public']['Enums']['speaker_label'];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          detected_language_codes?: string[];
          first_seen_at?: string;
          id?: string;
          last_seen_at?: string | null;
          session_id: string;
          stable_label: Database['public']['Enums']['speaker_label'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          detected_language_codes?: string[];
          first_seen_at?: string;
          id?: string;
          last_seen_at?: string | null;
          session_id?: string;
          stable_label?: Database['public']['Enums']['speaker_label'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'translator_speakers_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'translator_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      user_course_enrollments: {
        Row: {
          created_at: string;
          enrolled_at: string;
          id: string;
          language_id: string;
          last_active_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          enrolled_at?: string;
          id?: string;
          language_id: string;
          last_active_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          enrolled_at?: string;
          id?: string;
          language_id?: string;
          last_active_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_course_enrollments_language_id_fkey';
            columns: ['language_id'];
            isOneToOne: false;
            referencedRelation: 'languages';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_course_enrollments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_lesson_progress: {
        Row: {
          attempts: number;
          completed_at: string | null;
          created_at: string;
          id: string;
          last_activity_at: string | null;
          lesson_id: string;
          mastery: number;
          started_at: string | null;
          status: Database['public']['Enums']['progress_status'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          attempts?: number;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          last_activity_at?: string | null;
          lesson_id: string;
          mastery?: number;
          started_at?: string | null;
          status?: Database['public']['Enums']['progress_status'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          attempts?: number;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          last_activity_at?: string | null;
          lesson_id?: string;
          mastery?: number;
          started_at?: string | null;
          status?: Database['public']['Enums']['progress_status'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_lesson_progress_lesson_id_fkey';
            columns: ['lesson_id'];
            isOneToOne: false;
            referencedRelation: 'lessons';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_lesson_progress_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_preferences: {
        Row: {
          analytics_opt_in: boolean;
          created_at: string;
          haptics_enabled: boolean;
          preferred_voice_id: string | null;
          translation_history_retention: Database['public']['Enums']['retention_mode'];
          translation_target_language_code: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          analytics_opt_in?: boolean;
          created_at?: string;
          haptics_enabled?: boolean;
          preferred_voice_id?: string | null;
          translation_history_retention?: Database['public']['Enums']['retention_mode'];
          translation_target_language_code?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          analytics_opt_in?: boolean;
          created_at?: string;
          haptics_enabled?: boolean;
          preferred_voice_id?: string | null;
          translation_history_retention?: Database['public']['Enums']['retention_mode'];
          translation_target_language_code?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_preferences_translation_target_language_code_fkey';
            columns: ['translation_target_language_code'];
            isOneToOne: false;
            referencedRelation: 'languages';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'user_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      app_environment: 'development' | 'staging' | 'production';
      audit_action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish' | 'auth' | 'export';
      content_status: 'draft' | 'published' | 'archived';
      lesson_item_type:
        | 'text'
        | 'listening'
        | 'pronunciation'
        | 'translation'
        | 'recall'
        | 'grammar'
        | 'vocabulary';
      progress_status: 'not_started' | 'in_progress' | 'completed';
      provider_operation:
        | 'speech_to_text'
        | 'language_identification'
        | 'speaker_diarization'
        | 'translation'
        | 'text_to_speech'
        | 'speech_enhancement'
        | 'summary';
      retention_mode: 'none' | 'session' | 'until_deleted';
      review_state: 'pending' | 'completed' | 'suspended';
      segment_state: 'partial' | 'stabilized' | 'final' | 'corrected';
      speaker_label: 'Person 1' | 'Person 2' | 'Person 3';
      translator_session_status: 'starting' | 'active' | 'paused' | 'ended' | 'failed';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_environment: ['development', 'staging', 'production'],
      audit_action: ['create', 'update', 'delete', 'publish', 'unpublish', 'auth', 'export'],
      content_status: ['draft', 'published', 'archived'],
      lesson_item_type: [
        'text',
        'listening',
        'pronunciation',
        'translation',
        'recall',
        'grammar',
        'vocabulary',
      ],
      progress_status: ['not_started', 'in_progress', 'completed'],
      provider_operation: [
        'speech_to_text',
        'language_identification',
        'speaker_diarization',
        'translation',
        'text_to_speech',
        'speech_enhancement',
        'summary',
      ],
      retention_mode: ['none', 'session', 'until_deleted'],
      review_state: ['pending', 'completed', 'suspended'],
      segment_state: ['partial', 'stabilized', 'final', 'corrected'],
      speaker_label: ['Person 1', 'Person 2', 'Person 3'],
      translator_session_status: ['starting', 'active', 'paused', 'ended', 'failed'],
    },
  },
} as const;
