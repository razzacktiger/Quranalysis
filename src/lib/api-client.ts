// API Client for Frontend
// Handles authenticated requests to our Next.js API routes

import { supabase } from "./supabase";

// Types for API responses - Match database schema exactly
export interface SessionData {
  id: string;
  user_id: string;
  session_date: string; // timestamp with time zone
  session_type: string;
  duration_minutes: number;
  surah_name: string;
  ayah_start?: number;
  ayah_end?: number;
  juz_number?: number;
  pages_read?: number;
  recency_category?: string;
  session_goal?: string;
  performance_score: number; // Fixed field name
  additional_notes?: string;
  mistakes?: MistakeData[];
  created_at: string;
  updated_at: string;
}

export interface MistakeData {
  id?: string;
  session_id?: string;
  error_category: string;
  error_subcategory?: string;
  severity_level: number;
  location: string;
  additional_notes?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Get auth token for API requests
const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
};

// Sessions API Client
export class SessionsApi {
  // Get all sessions for authenticated user
  static async getSessions(): Promise<ApiResponse<SessionData[]>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/sessions", {
        method: "GET",
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Failed to fetch sessions" };
      }

      return { data: data.sessions };
    } catch (error) {
      console.error("Get sessions error:", error);
      return { error: "Network error" };
    }
  }

  // Get specific session by ID
  static async getSession(id: string): Promise<ApiResponse<SessionData>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/sessions/${id}`, {
        method: "GET",
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Failed to fetch session" };
      }

      return { data: data.session };
    } catch (error) {
      console.error("Get session error:", error);
      return { error: "Network error" };
    }
  }

  // Create new session
  static async createSession(
    session: Omit<SessionData, "id" | "user_id" | "created_at" | "updated_at">,
    mistakes: Omit<MistakeData, "id" | "session_id">[] = []
  ): Promise<ApiResponse<SessionData>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          session,
          mistakes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Failed to create session" };
      }

      return { data: data.session };
    } catch (error) {
      console.error("Create session error:", error);
      return { error: "Network error" };
    }
  }

  // Update existing session
  static async updateSession(
    id: string,
    session: Partial<
      Omit<SessionData, "id" | "user_id" | "created_at" | "updated_at">
    >,
    mistakes?: Omit<MistakeData, "id" | "session_id">[]
  ): Promise<ApiResponse<SessionData>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/sessions/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          session,
          mistakes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Failed to update session" };
      }

      return { data: data.session };
    } catch (error) {
      console.error("Update session error:", error);
      return { error: "Network error" };
    }
  }

  // Delete session
  static async deleteSession(id: string): Promise<ApiResponse<void>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/sessions/${id}`, {
        method: "DELETE",
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Failed to delete session" };
      }

      return {};
    } catch (error) {
      console.error("Delete session error:", error);
      return { error: "Network error" };
    }
  }
}
