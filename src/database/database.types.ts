export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          orgid: string
          profileid: string
          roleid: string
        }
        Insert: {
          orgid: string
          profileid: string
          roleid: string
        }
        Update: {
          orgid?: string
          profileid?: string
          roleid?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_orgid_fkey"
            columns: ["orgid"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_profileid_fkey"
            columns: ["profileid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_roleid_fkey"
            columns: ["roleid"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          id: string
          orgid: string
          what: string
          when: string
          who: string
        }
        Insert: {
          id?: string
          orgid: string
          what: string
          when?: string
          who: string
        }
        Update: {
          id?: string
          orgid?: string
          what?: string
          when?: string
          who?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_orgid_fkey"
            columns: ["orgid"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_who_fkey"
            columns: ["who"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      hows: {
        Row: {
          authorized: string[]
          consulted: string[]
          done: Database["public"]["Enums"]["completion"]
          how: string[]
          id: string
          informed: string[]
          orgid: string
          processid: string
          responsible: string[]
          visibility: Database["public"]["Enums"]["visibility"]
          what: string
          when: string
        }
        Insert: {
          authorized?: string[]
          consulted?: string[]
          done?: Database["public"]["Enums"]["completion"]
          how?: string[]
          id?: string
          informed?: string[]
          orgid: string
          processid: string
          responsible?: string[]
          visibility?: Database["public"]["Enums"]["visibility"]
          what?: string
          when?: string
        }
        Update: {
          authorized?: string[]
          consulted?: string[]
          done?: Database["public"]["Enums"]["completion"]
          how?: string[]
          id?: string
          informed?: string[]
          orgid?: string
          processid?: string
          responsible?: string[]
          visibility?: Database["public"]["Enums"]["visibility"]
          what?: string
          when?: string
        }
        Relationships: [
          {
            foreignKeyName: "hows_orgid_fkey"
            columns: ["orgid"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_hows_orgid_fkey"
            columns: ["orgid"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_hows_proceses_fkey"
            columns: ["processid"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_hows_processes_fkey"
            columns: ["processid"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          id: string
          used: boolean
          when: string
          who: string | null
        }
        Insert: {
          id?: string
          used?: boolean
          when?: string
          who?: string | null
        }
        Update: {
          id?: string
          used?: boolean
          when?: string
          who?: string | null
        }
        Relationships: []
      }
      orgs: {
        Row: {
          authorized: string[]
          comments: string[]
          description: string
          id: string
          name: string
          paths: string[]
          prompt: string
          visibility: Database["public"]["Enums"]["visibility"]
          when: string
        }
        Insert: {
          authorized?: string[]
          comments?: string[]
          description?: string
          id?: string
          name?: string
          paths?: string[]
          prompt?: string
          visibility?: Database["public"]["Enums"]["visibility"]
          when?: string
        }
        Update: {
          authorized?: string[]
          comments?: string[]
          description?: string
          id?: string
          name?: string
          paths?: string[]
          prompt?: string
          visibility?: Database["public"]["Enums"]["visibility"]
          when?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          email: string
          id: string
          when: string
        }
        Insert: {
          email: string
          id: string
          when?: string
        }
        Update: {
          email?: string
          id?: string
          when?: string
        }
        Relationships: []
      }
      processes: {
        Row: {
          accountable: string | null
          comments: string[]
          concern: string
          howid: string | null
          icon: string
          id: string
          orgid: string
          repeat: Json
          short: string[]
          state: Database["public"]["Enums"]["state"]
          title: string
          when: string
        }
        Insert: {
          accountable?: string | null
          comments?: string[]
          concern?: string
          howid?: string | null
          icon?: string
          id?: string
          orgid: string
          repeat?: Json
          short?: string[]
          state?: Database["public"]["Enums"]["state"]
          title?: string
          when?: string
        }
        Update: {
          accountable?: string | null
          comments?: string[]
          concern?: string
          howid?: string | null
          icon?: string
          id?: string
          orgid?: string
          repeat?: Json
          short?: string[]
          state?: Database["public"]["Enums"]["state"]
          title?: string
          when?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_accountable_fkey"
            columns: ["accountable"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_howid_fkey"
            columns: ["howid"]
            isOneToOne: false
            referencedRelation: "hows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_orgid_fkey"
            columns: ["orgid"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_processes_orgid_fkey"
            columns: ["orgid"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin: boolean
          bio: string
          email: string
          id: string
          name: string
          orgid: string
          personid: string | null
          supervisor: string | null
        }
        Insert: {
          admin: boolean
          bio?: string
          email?: string
          id?: string
          name?: string
          orgid: string
          personid?: string | null
          supervisor?: string | null
        }
        Update: {
          admin?: boolean
          bio?: string
          email?: string
          id?: string
          name?: string
          orgid?: string
          personid?: string | null
          supervisor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_orgid_fkey"
            columns: ["orgid"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_personid_fkey"
            columns: ["personid"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_supervisor_fkey"
            columns: ["supervisor"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          comments: string[]
          description: string
          id: string
          orgid: string
          short: string[]
          team: string | null
          title: string
          when: string
        }
        Insert: {
          comments?: string[]
          description?: string
          id?: string
          orgid: string
          short?: string[]
          team?: string | null
          title: string
          when?: string
        }
        Update: {
          comments?: string[]
          description?: string
          id?: string
          orgid?: string
          short?: string[]
          team?: string | null
          title?: string
          when?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_roles_orgid_fkey"
            columns: ["orgid"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roles_orgid_fkey"
            columns: ["orgid"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roles_team_fkey"
            columns: ["team"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestions: {
        Row: {
          authorized: string[]
          comments: string[]
          description: string
          id: string
          lead: string | null
          orgid: string
          processes: string[]
          proposal: string
          review: string | null
          roles: string[]
          status: Database["public"]["Enums"]["status"]
          visibility: Database["public"]["Enums"]["visibility"]
          watchers: string[]
          what: string
          when: string
          who: string
        }
        Insert: {
          authorized?: string[]
          comments?: string[]
          description?: string
          id?: string
          lead?: string | null
          orgid: string
          processes?: string[]
          proposal?: string
          review?: string | null
          roles?: string[]
          status?: Database["public"]["Enums"]["status"]
          visibility?: Database["public"]["Enums"]["visibility"]
          watchers?: string[]
          what?: string
          when?: string
          who: string
        }
        Update: {
          authorized?: string[]
          comments?: string[]
          description?: string
          id?: string
          lead?: string | null
          orgid?: string
          processes?: string[]
          proposal?: string
          review?: string | null
          roles?: string[]
          status?: Database["public"]["Enums"]["status"]
          visibility?: Database["public"]["Enums"]["visibility"]
          watchers?: string[]
          what?: string
          when?: string
          who?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_lead_fkey"
            columns: ["lead"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_orgid_fkey"
            columns: ["orgid"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_who_fkey"
            columns: ["who"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          comments: string[]
          description: string
          id: string
          name: string
          orgid: string
          when: string
        }
        Insert: {
          comments?: string[]
          description?: string
          id?: string
          name?: string
          orgid: string
          when?: string
        }
        Update: {
          comments?: string[]
          description?: string
          id?: string
          name?: string
          orgid?: string
          when?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_orgid_fkey"
            columns: ["orgid"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_org: {
        Args: {
          adminname: string
          orgname: string
          invite: string
          uid: string
          email: string
        }
        Returns: string
      }
      getprofileid: {
        Args: { _orgid: string }
        Returns: string
      }
      getvisibility: {
        Args: { _orgid: string }
        Returns: Database["public"]["Enums"]["visibility"]
      }
      isadmin: {
        Args: { _orgid: string }
        Returns: boolean
      }
      iseditablehow: {
        Args: { _orgid: string; _processid: string }
        Returns: boolean
      }
      ismember: {
        Args: { _orgid: string }
        Returns: boolean
      }
      path_available: {
        Args: { _path: string }
        Returns: boolean
      }
    }
    Enums: {
      completion: "no" | "pending" | "yes"
      state: "draft" | "active" | "archived"
      status: "triage" | "backlog" | "active" | "done" | "blocked" | "declined"
      visibility: "public" | "org" | "people" | "teams" | "roles" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      completion: ["no", "pending", "yes"],
      state: ["draft", "active", "archived"],
      status: ["triage", "backlog", "active", "done", "blocked", "declined"],
      visibility: ["public", "org", "people", "teams", "roles", "admin"],
    },
  },
} as const

