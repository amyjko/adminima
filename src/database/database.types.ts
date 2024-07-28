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
        Relationships: [
          {
            foreignKeyName: "people_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
          repeat: string | null
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
          repeat?: string | null
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
          repeat?: string | null
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
          team: string | null
          title: string
          when: string
        }
        Insert: {
          comments?: string[]
          description?: string
          id?: string
          orgid: string
          team?: string | null
          title: string
          when?: string
        }
        Update: {
          comments?: string[]
          description?: string
          id?: string
          orgid?: string
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
            referencedRelation: "people"
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
        Args: {
          _orgid: string
        }
        Returns: string
      }
      getvisibility: {
        Args: {
          _orgid: string
        }
        Returns: Database["public"]["Enums"]["visibility"]
      }
      isadmin: {
        Args: {
          _orgid: string
        }
        Returns: boolean
      }
      iseditablehow: {
        Args: {
          _orgid: string
          _processid: string
        }
        Returns: boolean
      }
      ismember: {
        Args: {
          _orgid: string
        }
        Returns: boolean
      }
      path_available: {
        Args: {
          _path: string
        }
        Returns: boolean
      }
    }
    Enums: {
      completion: "no" | "pending" | "yes"
      status: "triage" | "backlog" | "active" | "done"
      visibility: "public" | "org" | "people" | "teams" | "roles" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
        }
        Returns: {
          key: string
          id: string
          created_at: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          start_after?: string
          next_token?: string
        }
        Returns: {
          name: string
          id: string
          metadata: Json
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

