export type Database = {
  public: {
    Tables: {
      users: {
        Row: { id: string; name: string; email: string; created_at: string };
        Insert: { id?: string; name: string; email: string; created_at?: string };
        Update: { id?: string; name?: string; email?: string; created_at?: string };
        Relationships: [];
      };
      todos: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          text: string;
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          text?: string;
          completed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
