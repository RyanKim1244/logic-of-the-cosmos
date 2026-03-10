export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          bio: string;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          bio?: string;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: {
          name?: string;
          bio?: string;
          is_admin?: boolean;
        };
      };
      problems: {
        Row: {
          id: string;
          problem_number: number;
          title: string;
          source: string;
          year: number;
          tags: string[];
          content: string;
          official_solution: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          problem_number?: number;
          title: string;
          source: string;
          year: number;
          tags?: string[];
          content: string;
          official_solution: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          problem_number?: number;
          title?: string;
          source?: string;
          year?: number;
          tags?: string[];
          content?: string;
          official_solution?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      discussions: {
        Row: {
          id: string;
          problem_id: string;
          author_id: string | null;
          author_name: string;
          content: string;
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          problem_id: string;
          author_id?: string | null;
          author_name: string;
          content: string;
          parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          content?: string;
        };
      };
      topics: {
        Row: {
          id: string;
          title: string;
          content: string;
          author_id: string | null;
          author_name: string;
          tags: string[];
          upvotes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          author_id?: string | null;
          author_name: string;
          tags?: string[];
          upvotes?: number;
          created_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          tags?: string[];
          upvotes?: number;
        };
      };
      topic_comments: {
        Row: {
          id: string;
          topic_id: string;
          author_id: string | null;
          author_name: string;
          content: string;
          parent_id: string | null;
          upvotes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          topic_id: string;
          author_id?: string | null;
          author_name: string;
          content: string;
          parent_id?: string | null;
          upvotes?: number;
          created_at?: string;
        };
        Update: {
          content?: string;
          upvotes?: number;
        };
      };
      contests: {
        Row: {
          id: string;
          name: string;
          short_name: string;
          description: string;
          website: string | null;
          years: number[];
        };
        Insert: {
          id?: string;
          name: string;
          short_name: string;
          description: string;
          website?: string | null;
          years?: number[];
        };
        Update: {
          name?: string;
          short_name?: string;
          description?: string;
          website?: string | null;
          years?: number[];
        };
      };
      user_solved_problems: {
        Row: {
          user_id: string;
          problem_id: string;
        };
        Insert: {
          user_id: string;
          problem_id: string;
        };
        Update: never;
      };
      user_bookmarked_problems: {
        Row: {
          user_id: string;
          problem_id: string;
        };
        Insert: {
          user_id: string;
          problem_id: string;
        };
        Update: never;
      };
      topic_upvotes: {
        Row: {
          user_id: string;
          topic_id: string;
        };
        Insert: {
          user_id: string;
          topic_id: string;
        };
        Update: never;
      };
      comment_upvotes: {
        Row: {
          user_id: string;
          comment_id: string;
        };
        Insert: {
          user_id: string;
          comment_id: string;
        };
        Update: never;
      };
      solution_upvotes: {
        Row: {
          user_id: string;
          solution_id: string;
        };
        Insert: {
          user_id: string;
          solution_id: string;
        };
        Update: never;
      };
    };
  };
}
