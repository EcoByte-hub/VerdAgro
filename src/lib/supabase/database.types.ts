export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      diagnostics: {
        Row: {
          climate: Json | null;
          created_at: string;
          id: string;
          model: string | null;
          ndvi: Json | null;
          property_id: string;
          result: NonNullable<Json>;
          sources: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          climate?: Json | null;
          created_at?: string;
          id?: string;
          model?: string | null;
          ndvi?: Json | null;
          property_id: string;
          result: NonNullable<Json>;
          sources: NonNullable<Json>;
        };
        Update: {
          climate?: Json | null;
          created_at?: string;
          id?: string;
          model?: string | null;
          ndvi?: Json | null;
          property_id?: string;
          result?: NonNullable<Json>;
          sources?: NonNullable<Json>;
        };
        Relationships: [
          {
            foreignKeyName: "diagnostics_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "diagnostics_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "propriedades_app";
            referencedColumns: ["id"];
          },
        ];
      };
      interest_messages: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          interest_id: string;
        };
        ComputedFields: never;
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          interest_id: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          interest_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interest_messages_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interest_messages_interest_id_fkey";
            columns: ["interest_id"];
            isOneToOne: false;
            referencedRelation: "interests";
            referencedColumns: ["id"];
          },
        ];
      };
      interests: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          message: string;
          project_id: string;
          proposed_volume: number | null;
          status: Database["public"]["Enums"]["interest_status"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          message: string;
          project_id: string;
          proposed_volume?: number | null;
          status?: Database["public"]["Enums"]["interest_status"];
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          message?: string;
          project_id?: string;
          proposed_volume?: number | null;
          status?: Database["public"]["Enums"]["interest_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interests_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interests_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "marketplace_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interests_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          city: string | null;
          created_at: string;
          full_name: string;
          id: string;
          organization_name: string | null;
          role: Database["public"]["Enums"]["user_role"];
          state: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          city?: string | null;
          created_at?: string;
          full_name: string;
          id: string;
          organization_name?: string | null;
          role: Database["public"]["Enums"]["user_role"];
          state?: string | null;
          updated_at?: string;
        };
        Update: {
          city?: string | null;
          created_at?: string;
          full_name?: string;
          id?: string;
          organization_name?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          state?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_documents: {
        Row: {
          created_at: string;
          file_name: string;
          id: string;
          kind: string;
          project_id: string;
          storage_path: string;
          uploaded_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          file_name: string;
          id?: string;
          kind?: string;
          project_id: string;
          storage_path: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          file_name?: string;
          id?: string;
          kind?: string;
          project_id?: string;
          storage_path?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "project_documents_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "marketplace_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_documents_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_documents_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      project_stage_events: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          note: string | null;
          project_id: string;
          stage: Database["public"]["Enums"]["project_stage"];
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          project_id: string;
          stage: Database["public"]["Enums"]["project_stage"];
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          project_id?: string;
          stage?: Database["public"]["Enums"]["project_stage"];
        };
        Relationships: [
          {
            foreignKeyName: "project_stage_events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_stage_events_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "marketplace_projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_stage_events_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          area_ha: number;
          commercial_info: string | null;
          created_at: string;
          current_stage: Database["public"]["Enums"]["project_stage"];
          description: string | null;
          end_date: string | null;
          id: string;
          is_published: boolean;
          issued_credits: number | null;
          methodology: string | null;
          objective: string | null;
          owner_id: string;
          practice: Database["public"]["Enums"]["practice_type"];
          property_id: string;
          start_date: string | null;
          title: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          area_ha: number;
          commercial_info?: string | null;
          created_at?: string;
          current_stage?: Database["public"]["Enums"]["project_stage"];
          description?: string | null;
          end_date?: string | null;
          id?: string;
          is_published?: boolean;
          issued_credits?: number | null;
          methodology?: string | null;
          objective?: string | null;
          owner_id: string;
          practice: Database["public"]["Enums"]["practice_type"];
          property_id: string;
          start_date?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          area_ha?: number;
          commercial_info?: string | null;
          created_at?: string;
          current_stage?: Database["public"]["Enums"]["project_stage"];
          description?: string | null;
          end_date?: string | null;
          id?: string;
          is_published?: boolean;
          issued_credits?: number | null;
          methodology?: string | null;
          objective?: string | null;
          owner_id?: string;
          practice?: Database["public"]["Enums"]["practice_type"];
          property_id?: string;
          start_date?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "propriedades_app";
            referencedColumns: ["id"];
          },
        ];
      };
      properties: {
        Row: {
          area_ha: number;
          boundary: unknown;
          centroid: unknown;
          city: string;
          created_at: string;
          crops: string[];
          id: string;
          is_demo: boolean;
          land_use_history: string | null;
          name: string;
          owner_id: string;
          production_type: string | null;
          state: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          area_ha?: number;
          boundary: unknown;
          centroid?: unknown;
          city: string;
          created_at?: string;
          crops?: string[];
          id?: string;
          is_demo?: boolean;
          land_use_history?: string | null;
          name: string;
          owner_id: string;
          production_type?: string | null;
          state: string;
          updated_at?: string;
        };
        Update: {
          area_ha?: number;
          boundary?: unknown;
          centroid?: unknown;
          city?: string;
          created_at?: string;
          crops?: string[];
          id?: string;
          is_demo?: boolean;
          land_use_history?: string | null;
          name?: string;
          owner_id?: string;
          production_type?: string | null;
          state?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      property_practices: {
        Row: {
          created_at: string;
          id: string;
          notes: string | null;
          practice: Database["public"]["Enums"]["practice_type"];
          property_id: string;
          since_year: number | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          practice: Database["public"]["Enums"]["practice_type"];
          property_id: string;
          since_year?: number | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          practice?: Database["public"]["Enums"]["practice_type"];
          property_id?: string;
          since_year?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "property_practices_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "property_practices_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "propriedades_app";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      marketplace_projects: {
        Row: {
          approx_lat: number | null;
          approx_lng: number | null;
          area_ha: number;
          city: string;
          commercial_info: string | null;
          created_at: string;
          crops: string[];
          current_stage: Database["public"]["Enums"]["project_stage"];
          description: string | null;
          id: string;
          is_demo: boolean;
          issued_credits: number | null;
          methodology: string | null;
          practice: Database["public"]["Enums"]["practice_type"];
          state: string;
          title: string;
        };
        ComputedFields: never;
        Relationships: [];
      };
      propriedades_app: {
        Row: {
          area_ha: number;
          city: string;
          created_at: string;
          crops: string[];
          id: string;
          is_demo: boolean;
          land_use_history: string | null;
          latitude: number | null;
          longitude: number | null;
          name: string;
          owner_id: string;
          poligono: Json | null;
          production_type: string | null;
          state: string;
        };
        ComputedFields: never;
        Insert: {
          area_ha?: number | null;
          city?: string | null;
          created_at?: string | null;
          crops?: string[] | null;
          id?: string | null;
          is_demo?: boolean | null;
          land_use_history?: string | null;
          latitude?: never;
          longitude?: never;
          name?: string | null;
          owner_id?: string | null;
          poligono?: never;
          production_type?: string | null;
          state?: string | null;
        };
        Update: {
          area_ha?: number | null;
          city?: string | null;
          created_at?: string | null;
          crops?: string[] | null;
          id?: string | null;
          is_demo?: boolean | null;
          land_use_history?: string | null;
          latitude?: never;
          longitude?: never;
          name?: string | null;
          owner_id?: string | null;
          poligono?: never;
          production_type?: string | null;
          state?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      current_role_is: { Args: { target: Database["public"]["Enums"]["user_role"] }; Returns: boolean };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      owns_project: { Args: { target: string }; Returns: boolean };
      owns_property: { Args: { target: string }; Returns: boolean };
      participates_in_interest: { Args: { target: string }; Returns: boolean };
      project_is_published: { Args: { target: string }; Returns: boolean };
    };
    Enums: {
      interest_status: "enviada" | "em_negociacao" | "aceita" | "recusada" | "encerrada";
      practice_type:
        | "plantio_direto"
        | "rotacao_culturas"
        | "recuperacao_pastagens"
        | "culturas_cobertura"
        | "integracao_lavoura_pecuaria"
        | "manejo_solo"
        | "outra";
      project_stage:
        | "cadastro"
        | "analise_inicial"
        | "desenvolvimento"
        | "validacao"
        | "monitoramento"
        | "verificacao_independente"
        | "emissao_creditos"
        | "comercializacao";
      user_role: "produtor" | "empresa" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      interest_status: ["enviada", "em_negociacao", "aceita", "recusada", "encerrada"],
      practice_type: [
        "plantio_direto",
        "rotacao_culturas",
        "recuperacao_pastagens",
        "culturas_cobertura",
        "integracao_lavoura_pecuaria",
        "manejo_solo",
        "outra",
      ],
      project_stage: [
        "cadastro",
        "analise_inicial",
        "desenvolvimento",
        "validacao",
        "monitoramento",
        "verificacao_independente",
        "emissao_creditos",
        "comercializacao",
      ],
      user_role: ["produtor", "empresa", "admin"],
    },
  },
} as const;
