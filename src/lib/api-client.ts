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
  performance_score: number; // 0-10, allows decimals
  session_goal?: string;
  additional_notes?: string;
  created_at: string;
  updated_at: string;
  // New multi-surah fields
  session_portions?: SessionPortion[];
  mistakes?: MistakeData[];
}

export interface SessionPortion {
  id: string;
  session_id: string;
  surah_name: string;
  ayah_start: number;
  ayah_end: number;
  juz_number: number;
  pages_read: number;
  repetition_count: number;
  recency_category: string;
  created_at: string;
}

export interface MistakeData {
  id?: string;
  session_id?: string;
  session_portion_id?: string;
  error_category: string;
  error_subcategory?: string;
  severity_level: number;
  ayah_number: number; // Just the ayah number (surah known from portion)
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
      // Add cache-busting timestamp to ensure fresh data
      const url = `/api/sessions?t=${Date.now()}`;
      const response = await fetch(url, {
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
    createRequest: any // CreateSessionRequest with session, session_portions, mistakes
  ): Promise<ApiResponse<SessionData>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers,
        body: JSON.stringify(createRequest),
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

  // Update existing session with full request
  static async updateSession(
    id: string,
    updateRequest: {
      session: Partial<
        Omit<SessionData, "id" | "user_id" | "created_at" | "updated_at">
      >;
      session_portions?: any[];
      mistakes?: any[];
    }
  ): Promise<ApiResponse<SessionData>> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/sessions/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updateRequest),
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
