/**
 * Multi-Surah Session Types
 * Updated for normalized database schema with session_portions
 */

// ===========================
// CORE SESSION TYPES
// ===========================

export interface SessionData {
  id: string;
  user_id: string;
  session_date: string; // ISO string
  session_type: SessionType;
  duration_minutes: number;
  performance_score: number; // 0-10, allows decimals
  session_goal?: string;
  additional_notes?: string;
  created_at: string;
  updated_at: string;
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
  recency_category: RecencyCategory;
  created_at: string;
}

export interface MistakeData {
  id: string;
  session_id: string;
  session_portion_id: string;
  error_category: ErrorCategory;
  error_subcategory?: ErrorSubcategory;
  severity_level: number; // 1-5
  ayah_number: number; // Just the ayah number (surah known from portion)
  additional_notes?: string;
  created_at: string;
}

// ===========================
// ENUMS (matching database)
// ===========================

export type SessionType =
  | "reading_practice"
  | "memorization"
  | "audit"
  | "mistake_session"
  | "practice_test"
  | "study_session";

export type RecencyCategory = "new" | "recent" | "reviewing" | "maintenance";

export type ErrorCategory =
  | "pronunciation"
  | "tajweed"
  | "memorization"
  | "translation"
  | "fluency"
  | "waqf"
  | "other";

export type ErrorSubcategory =
  | "makhraj"
  | "sifat"
  | "ghunna"
  | "qalqalah"
  | "madd"
  | "idgham"
  | "ikhfa"
  | "iqlab"
  | "word_order"
  | "verse_skip"
  | "word_substitution"
  | "mutashabih"
  | "forgotten_word"
  | "forgotten_verse_start"
  | "forgotten_verse_end"
  | "forgotten_verse_middle"
  | "forgotten_verse_all"
  | "forgotten_verse_middle_end"
  | "forgotten_verse_start_middle"
  | "verse_slipping"
  | "hesitation"
  | "repetition"
  | "rhythm"
  | "wrong_stop"
  | "missed_stop"
  | "disencouraged_stop"
  | "disencouraged_continue";

// ===========================
// FRONTEND FORM TYPES
// ===========================

// For creating new sessions
export interface SessionFormData {
  // Session-level fields
  session_date: string;
  session_type: SessionType;
  duration_minutes: number;
  performance_score: number;
  session_goal?: string;
  additional_notes?: string;

  // Multiple portions
  portions: PortionFormData[];

  // Mistakes (will be linked to portions after creation)
  mistakes: MistakeFormData[];
}

// For creating new portions (frontend)
export interface PortionFormData {
  tempId: string; // Temporary ID for frontend management
  surah_name: string;
  ayah_start?: number; // Optional for form state
  ayah_end?: number; // Optional for form state
  repetition_count: number;
  recency_category: RecencyCategory;
  // Auto-calculated fields
  juz_number?: number;
  pages_read?: number;
}

// For creating new mistakes (frontend)
export interface MistakeFormData {
  tempId: string; // Temporary ID for frontend management
  portionTempId: string; // Links to PortionFormData.tempId
  error_category: ErrorCategory;
  error_subcategory?: ErrorSubcategory;
  severity_level: number;
  ayah_number: number;
  additional_notes?: string;
}

// ===========================
// API REQUEST/RESPONSE TYPES
// ===========================

// For API requests
export interface CreateSessionRequest {
  session: Omit<SessionData, "id" | "user_id" | "created_at" | "updated_at">;
  session_portions: Omit<SessionPortion, "id" | "session_id" | "created_at">[];
  mistakes: Omit<
    MistakeData,
    "id" | "session_id" | "session_portion_id" | "created_at"
  >[];
}

export interface UpdateSessionRequest {
  session: Partial<Omit<SessionData, "id" | "user_id" | "created_at">>;
  session_portions: Omit<SessionPortion, "session_id" | "created_at">[];
  mistakes: Omit<MistakeData, "session_id" | "created_at">[];
}

// For API responses
export interface FullSessionData {
  session: SessionData;
  session_portions: SessionPortion[];
  mistakes: MistakeData[];
}

// ===========================
// UTILITY TYPES
// ===========================

// For session statistics
export interface SessionStats {
  portion_count: number;
  mistake_count: number;
  avg_mistake_severity: number;
  surahs_practiced: string[];
  total_ayahs: number;
  total_pages: number;
  total_repetitions: number;
}

// For session summaries in lists
export interface SessionSummary extends SessionData {
  stats: SessionStats;
}

// ===========================
// FORM VALIDATION TYPES
// ===========================

export interface ValidationErrors {
  session?: Record<string, string>;
  portions?: Record<string, Record<string, string>>; // [tempId][field] = error
  mistakes?: Record<string, Record<string, string>>; // [tempId][field] = error
}

// ===========================
// CONSTANTS
// ===========================

export const SESSION_TYPES: SessionType[] = [
  "reading_practice",
  "memorization",
  "audit",
  "mistake_session",
  "practice_test",
  "study_session",
];

export const RECENCY_CATEGORIES: RecencyCategory[] = [
  "new",
  "recent",
  "reviewing",
  "maintenance",
];

export const ERROR_CATEGORIES: ErrorCategory[] = [
  "pronunciation",
  "tajweed",
  "memorization",
  "translation",
  "fluency",
  "waqf",
  "other",
];

export const ERROR_SUBCATEGORIES: ErrorSubcategory[] = [
  "makhraj",
  "sifat",
  "ghunna",
  "qalqalah",
  "madd",
  "idgham",
  "ikhfa",
  "iqlab",
  "word_order",
  "verse_skip",
  "word_substitution",
  "mutashabih",
  "forgotten_word",
  "forgotten_verse_start",
  "forgotten_verse_end",
  "forgotten_verse_middle",
  "forgotten_verse_all",
  "forgotten_verse_middle_end",
  "forgotten_verse_start_middle",
  "verse_slipping",
  "hesitation",
  "repetition",
  "rhythm",
  "wrong_stop",
  "missed_stop",
  "disencouraged_stop",
  "disencouraged_continue",
];
