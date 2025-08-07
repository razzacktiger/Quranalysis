import { NextRequest, NextResponse } from "next/server";
import { createClient, User } from "@supabase/supabase-js";
import {
  GoogleGenAI,
  FunctionDeclaration,
  FunctionCallingConfigMode,
} from "@google/genai";

interface ChatRequest {
  message: string;
  context?: any; // Can be string or array of conversation history
  session_type?: string;
  system_prompt?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Get authentication token
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user authentication
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ChatRequest = await req.json();
    const { message, context, session_type, system_prompt } = body;

    const aiResponse = await generateAIResponse(
      message,
      token,
      user,
      req,
      context,
      system_prompt
    );

    return NextResponse.json({
      response: aiResponse,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI Chat API Error:", error);
    return NextResponse.json(
      { error: "Failed to process AI chat request" },
      { status: 500 }
    );
  }
}

async function generateAIResponse(
  message: string,
  token: string,
  user: User,
  request: NextRequest,
  context?: string,
  systemPrompt?: string
): Promise<string> {
  try {
    // Helper function to build API URLs
    const buildApiUrl = (path: string) => {
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      const host = request.headers.get("host") || "localhost:3000";
      return `${protocol}://${host}${path}`;
    };

    // Initialize Gemini AI with correct 2025 syntax
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    // Define functions for Gemini (UPDATED FOR MULTI-PORTION SCHEMA)
    const createSessionFunction: FunctionDeclaration = {
      name: "create_quran_session",
      description:
        "Create a new Quran practice session with multiple portions and extracted details. Use for NEW sessions only - for editing existing sessions, guide users to manual editing.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          duration_minutes: {
            type: "number",
            description: "Total duration of practice session in minutes",
          },
          session_type: {
            type: "string",
            enum: [
              "reading_practice",
              "memorization",
              "audit",
              "mistake_session",
              "practice_test",
              "study_session",
            ],
            description: "Type of practice session",
          },
          performance_score: {
            type: "number",
            minimum: 1.0,
            maximum: 10.0,
            description: "Overall performance score for the session (1-10)",
          },
          session_goal: {
            type: "string",
            description: "Goal or focus of this session (optional)",
          },
          portions: {
            type: "array",
            description: "Array of Quran portions practiced in this session",
            items: {
              type: "object",
              properties: {
                surah_name: {
                  type: "string",
                  description:
                    "EXACT Surah name from database (e.g., 'Al-Baqarah', 'Ali Imran', 'Al-Falaq', 'Al-Ikhlas'). NEVER use shortened forms like 'Fatiha', 'Falaq', 'Ikhlas'.",
                },
                ayah_start: {
                  type: "number",
                  description: "Starting ayah number for this portion",
                },
                ayah_end: {
                  type: "number",
                  description: "Ending ayah number for this portion",
                },
                recency_category: {
                  type: "string",
                  enum: ["new", "recent", "reviewing", "maintenance"],
                  description: "How recently this portion was practiced",
                },
                repetition_count: {
                  type: "number",
                  description:
                    "Number of times this portion was repeated (default: 1)",
                  default: 1,
                },
              },
              required: [
                "surah_name",
                "ayah_start",
                "ayah_end",
                "recency_category",
              ],
            },
          },
          mistakes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                ayah_number: {
                  type: "number",
                  description: "Ayah number where mistake occurred",
                },
                error_category: {
                  type: "string",
                  enum: [
                    "pronunciation",
                    "tajweed",
                    "memorization",
                    "rhythm",
                    "pause",
                    "breath",
                  ],
                  description: "Category of mistake",
                },
                description: {
                  type: "string",
                  description: "Description of the specific mistake",
                },
              },
              required: ["error_category", "description"],
            },
          },
          notes: {
            type: "string",
            description: "Additional notes or areas to focus on",
          },
        },
        required: [
          "portions",
          "duration_minutes",
          "session_type",
          "performance_score",
        ],
      },
    };

    // Define the session lookup function
    const findRecentSessionsFunction: FunctionDeclaration = {
      name: "find_recent_sessions",
      description:
        "Find recent sessions to help user identify which session to edit. Use when user wants to edit but doesn't specify which session.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          days_back: {
            type: "number",
            description: "Number of days to look back (default: 7)",
            default: 7,
          },
        },
        required: [],
      },
    };

    // Define the session editing function for adding mistakes
    const editSessionFunction: FunctionDeclaration = {
      name: "edit_session_mistakes",
      description:
        "Add mistakes to an existing session. Use when user wants to add mistakes to a session they've already created. If no session_id provided, use find_recent_sessions first.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          session_number: {
            type: "number",
            description:
              "The session number from the recent sessions list (e.g., 1, 2, 3). User will say 'edit session 1' and you use the number.",
          },
          mistakes_to_add: {
            type: "array",
            items: {
              type: "object",
              properties: {
                surah_name: {
                  type: "string",
                  description:
                    "EXACT Surah name from database (e.g., 'Al-Falaq', not 'Falaq'). Use full names with proper prefixes.",
                },
                ayah_number: {
                  type: "number",
                  description: "Ayah number where the mistake occurred",
                },
                error_category: {
                  type: "string",
                  enum: [
                    "pronunciation",
                    "tajweed",
                    "memorization",
                    "translation",
                    "fluency",
                    "waqf",
                    "other",
                  ],
                  description: "Category of the mistake",
                },
                error_subcategory: {
                  type: "string",
                  enum: [
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
                  ],
                  description:
                    "Optional subcategory - use exact values from database enum only",
                },
                severity_level: {
                  type: "number",
                  minimum: 1,
                  maximum: 5,
                  description: "Severity of the mistake (1-5)",
                },
                additional_notes: {
                  type: "string",
                  description: "Optional additional notes about the mistake",
                },
              },
              required: [
                "surah_name",
                "ayah_number",
                "error_category",
                "severity_level",
              ],
            },
          },
        },
        required: ["session_number", "mistakes_to_add"],
      },
    };

    // Build the system prompt for Quran coaching
    const fullSystemPrompt =
      systemPrompt ||
      `You are a focused AI Quran Coach assistant. Your role is to help users log Quran practice sessions efficiently.

CORE BEHAVIOR:
- Log sessions after confirmation of summary of details when complete details are provided
- Only ask for missing information when necessary
- Only show recent sessions when explicitly requested
- Stay focused on the immediate task

SESSION LOGGING:
- When user provides complete session details → Log after atleast 1 final confirmation of summary of details
- When user provides partial details → Ask only for missing information
- When user asks to edit → Use find_recent_sessions first, then edit_session_mistakes
- When user asks to see sessions → Use find_recent_sessions


SURAH NAMES (EXACT database names):
Al-Fatiha, Al-Baqarah, Ali Imran, An-Nisa, Al-Maidah, Al-Anam, Al-Araf, Al-Anfal, At-Tawbah, Yunus, Hud, Yusuf, Ar-Rad, Ibrahim, Al-Hijr, An-Nahl, Al-Isra, Al-Kahf, Maryam, Ta-Ha, Al-Anbiya, Al-Hajj, Al-Muminun, An-Nur, Al-Furqan, Ash-Shuara, An-Naml, Al-Qasas, Al-Ankabut, Ar-Rum, Luqman, As-Sajdah, Al-Ahzab, Saba, Fatir, Ya-Sin, As-Saffat, Sad, Az-Zumar, Ghafir, Fussilat, Ash-Shura, Az-Zukhruf, Ad-Dukhan, Al-Jathiyah, Al-Ahqaf, Muhammad, Al-Fath, Al-Hujurat, Qaf, Adh-Dhariyat, At-Tur, An-Najm, Al-Qamar, Ar-Rahman, Al-Waqiah, Al-Hadid, Al-Mujadila, Al-Hashr, Al-Mumtahanah, As-Saff, Al-Jumuah, Al-Munafiqun, At-Taghabun, At-Talaq, At-Tahrim, Al-Mulk, Al-Qalam, Al-Haqqah, Al-Maarij, Nuh, Al-Jinn, Al-Muzzammil, Al-Muddathir, Al-Qiyamah, Al-Insan, Al-Mursalat, An-Naba, An-Naziat, Abasa, At-Takwir, Al-Infitar, Al-Mutaffifin, Al-Inshiqaq, Al-Buruj, At-Tariq, Al-Ala, Al-Ghashiyah, Al-Fajr, Al-Balad, Ash-Shams, Al-Layl, Ad-Duha, Ash-Sharh, At-Tin, Al-Alaq, Al-Qadr, Al-Bayyinah, Az-Zalzalah, Al-Adiyat, Al-Qariah, At-Takathur, Al-Asr, Al-Humazah, Al-Fil, Quraysh, Al-Maun, Al-Kawthar, Al-Kafirun, An-Nasr, Al-Masad, Al-Ikhlas, Al-Falaq, An-Nas

CRITICAL: Use EXACT surah names with proper prefixes (e.g., "Al-Baqarah", "Ali Imran", "Yusuf"). NEVER use shortened forms.

PRIMARY INFORMATION TO EXTRACT:
- Multiple Quran portions: Each portion needs surah name and specific ayah numbers (e.g., "Al-Baqarah ayahs 1-111, Ali Imran ayahs 1-50")
- Total practice duration in minutes (can ask for breakdown per portion if helpful)
- Recency Category: 
  * "new" (within the last 1-2 days)
  * "recent" (within 1-4 weeks or less than 20 pages from new portion)  
  * "reviewing" (more than 20 pages from the new portion)
  * "maintenance" (practicing surahs already solid in memory)
- Session type:
  * "reading_practice" (reading from the mushaf)
  * "memorization" (reciting from memory to check mistakes)
  * "audit" (reciting from memory without review beforehand)
  * "mistake_session" (focusing on fixing marked mistakes)
  * "practice_test" (recalling after practice, usually to a teacher)
  * "study_session" (studying meaning, tafseer, or related information)
- Mistake Categories:
  * "pronunciation" (incorrect pronunciation of Arabic letters)
  * "tajweed" (incorrect application of tajweed rules)
  * "memorization" (incorrect memorization)
  * "translation" (incorrect translation)
  * "fluency" (incorrect fluency)
  * "waqf" (incorrect waqf)
  * "other" (other mistakes)
- Mistake Subcategories (Optional):
    - makhraj, sifat, ghunna, qalqalah, madd, idgham, ikhfa, iqlab, word_order, verse_skip, word_substitution, mutashabih, forgotten_word, forgotten_verse_start, forgotten_verse_end, forgotten_verse_middle, forgotten_verse_all, forgotten_verse_middle_end, forgotten_verse_start_middle, verse_slipping, hesitation, repetition, rhythm, wrong_stop, missed_stop, disencouraged_stop, disencouraged_continue
    - Pronounciation: makhraj, sifat
    - Tajweed: ghunna, qalqalah, madd, idgham, ikhfa, iqlab
    - Memorization: word_order, word_substitution, mutashabih, forgotten_word, forgotten_verse_start, forgotten_verse_end, forgotten_verse_middle, forgotten_verse_all,
      forgotten_verse_middle_end, forgotten_verse_start_middle, verse_slipping
    - Fluency: hesitation, repetition, rhythm
    - Waqf (Pause): wrong_stop, missed_stop, disencouraged_stop, disencouraged_continue
- Self-rated performance (1-10 scale)

RESPONSE STYLE:
- Be direct and efficient - no unnecessary confirmations except for asking for essential missing information and confirming details before saving
- Only show recent sessions when explicitly requested
- Keep responses concise (under 80 words unless showing session list)
- Use Islamic greetings naturally: "Assalam Alaikum", "Wa Alaikum Salam", "MashaAllah", "JazakAllah Khair"

FUNCTION USAGE:
- create_quran_session: For NEW sessions only - prompt for all detail first and answer questions about details when promoted, then confirm in a clear list of details before saving, then use function to save
- find_recent_sessions: Only when user asks to see/edit sessions, then use function to show recent sessions
- edit_session_mistakes: Only when user confirms to edit existing specified sessions, then use function to edit session mistakes

SECURITY: 
- NEVER expose session UUIDs - always use session numbers (1,2,3...)
- Becareful abotu exposing sensitive information like session UUIDs and any other sensitive information

Stay focused on the immediate task. Don't provide information unless directly relevant to the task or specifically requested.
Keep in mind the context of the conversation and the task at hand. Ensure you retain all of the important session details and information that the user has provided.

Context: ${context || "No additional context provided"}`;

    // Build conversation history for context
    let conversationContext = "";
    if (context) {
      if (Array.isArray(context)) {
        const contextArray = context as any[];
        conversationContext =
          "\n\nConversation History:\n" +
          contextArray
            .slice(-6)
            .map((msg: any) => `${msg.role}: ${msg.content}`)
            .join("\n");
      } else if (typeof context === "string") {
        conversationContext = `\n\nContext: ${context}`;
      }
    }

    // Generate response using Gemini with function calling (STABLE MODEL)
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-001", // STABLE VERSION
      contents: `${fullSystemPrompt}
${conversationContext}

Current User Message: ${message}`,
      config: {
        tools: [
          {
            functionDeclarations: [
              createSessionFunction,
              findRecentSessionsFunction,
              editSessionFunction,
            ],
          },
        ],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.AUTO,
          },
        },
      },
    });

    // Check if function was called
    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0];

      if (functionCall.name === "create_quran_session" && functionCall.args) {
        // Actually save the session to the database
        const sessionData = functionCall.args as any;

        try {
          // Create the session using the new multi-portion format
          const timestamp = Date.now(); // Use same timestamp for all tempIds
          const sessionRequest: any = {
            session: {
              session_date: new Date().toISOString(),
              session_type: sessionData.session_type || "reading_practice",
              duration_minutes: Math.max(1, sessionData.duration_minutes || 15), // Ensure > 0
              performance_score: Math.max(
                1,
                Math.min(10, sessionData.performance_score || 7)
              ), // Ensure 1-10
              session_goal:
                sessionData.session_goal || "Session logged via AI Assistant",
              additional_notes: sessionData.notes || "Created via AI Assistant",
            },
            session_portions:
              sessionData.portions?.map((portion: any, index: number) => ({
                tempId: `ai-portion-${timestamp}-${index}`,
                surah_name: portion.surah_name,
                ayah_start: portion.ayah_start,
                ayah_end: portion.ayah_end,
                juz_number: 1, // Default, could be calculated based on surah/ayah
                pages_read: Math.ceil(
                  (portion.ayah_end - portion.ayah_start + 1) / 20
                ), // Rough estimate
                repetition_count: portion.repetition_count || 1,
                recency_category: portion.recency_category,
              })) || [],
            mistakes:
              sessionData.mistakes?.map((m: any, index: number) => ({
                tempId: `ai-mistake-${timestamp}-${index}`,
                portionTempId: `ai-portion-${timestamp}-0`, // Link to first portion for now
                error_category: m.error_category,
                error_subcategory: undefined,
                severity_level: Math.round(m.severity_level) || 2,
                ayah_number: m.ayah_number || 1,
                additional_notes: m.description || "",
              })) || [],
          };

          // Create a properly authenticated Supabase client for this user
          const userSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              global: {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            }
          );

          // Use the internal sessions API to create the session with proper multi-portion support
          const apiUrl = buildApiUrl("/api/sessions");

          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(sessionRequest),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Session API error:", errorText);
            throw new Error(`API Error: ${response.status} - ${errorText}`);
          }

          const result = await response.json();

          // Success case
          const sessionSummary =
            sessionData.portions
              ?.map(
                (p: any) => `${p.surah_name} (${p.ayah_start}-${p.ayah_end})`
              )
              .join(", ") || "session";

          return `✅ **Session Saved Successfully!**

📖 **Saved to Your Progress Log:**
**Portions**: ${sessionSummary}
**Duration**: ${sessionData.duration_minutes} minutes
**Type**: ${sessionData.session_type}
**Performance**: ${sessionData.performance_score}/10
${
  sessionData.mistakes?.length > 0
    ? `**Mistakes**: ${sessionData.mistakes.length} recorded`
    : ""
}

May Allah reward your efforts in studying the Quran! Your session has been added to your dashboard.`;
        } catch (error) {
          console.error("Error saving session:", error);
          const errorSessionSummary =
            sessionData.portions
              ?.map(
                (p: any) => `${p.surah_name} (${p.ayah_start}-${p.ayah_end})`
              )
              .join(", ") || "session";

          return `❌ **Error Saving Session**

I extracted your session details correctly but encountered an error saving to the database. Please try using the manual "Create Session" button in your dashboard.

**Extracted Details:**
**Portions**: ${errorSessionSummary}
**Duration**: ${sessionData.duration_minutes} minutes  
**Type**: ${sessionData.session_type}
**Performance**: ${sessionData.performance_score}/10

**Error**: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
      } else if (
        functionCall.name === "find_recent_sessions" &&
        functionCall.args
      ) {
        // Find recent sessions to help user identify which to edit
        const findData = functionCall.args as any;

        try {
          // Use the token passed to this function
          const daysBack = findData.days_back || 7;

          // Fetch recent sessions
          const getApiUrl = buildApiUrl("/api/sessions");

          const getResponse = await fetch(getApiUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (!getResponse.ok) {
            throw new Error(`Failed to fetch sessions: ${getResponse.status}`);
          }

          const sessionsResult = await getResponse.json();
          const allSessions = sessionsResult.sessions || [];

          // Filter to recent sessions (within specified days)
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - daysBack);

          const recentSessions = allSessions
            .filter(
              (session: any) => new Date(session.session_date) >= cutoffDate
            )
            .sort(
              (a: any, b: any) =>
                new Date(b.session_date).getTime() -
                new Date(a.session_date).getTime()
            )
            .slice(0, 10); // Limit to 10 most recent

          if (recentSessions.length === 0) {
            return `📅 **No Recent Sessions Found**

I couldn't find any sessions from the last ${daysBack} days. You can:

1. **Create a new session** if you haven't logged one yet
2. **Use the manual Edit button** in your dashboard
3. **Check if you have older sessions** in your dashboard

Would you like to create a new session instead?`;
          }

          // Format the sessions for user selection
          let sessionsList = "📋 **Your Recent Sessions:**\n\n";

          recentSessions.forEach((session: any, index: number) => {
            const date = new Date(session.session_date).toLocaleDateString();
            const time = new Date(session.session_date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            // Get portion summary
            const portions = session.session_portions || [];
            const portionSummary =
              portions.length > 0
                ? portions
                    .map(
                      (p: any) =>
                        `${p.surah_name} (${p.ayah_start}-${p.ayah_end})`
                    )
                    .join(", ")
                : "No portions";

            const mistakeCount = session.mistakes?.length || 0;

            sessionsList += `**${index + 1}.** ${date} ${time} - ${
              session.duration_minutes
            }min\n`;
            sessionsList += `   📖 ${portionSummary}\n`;
            sessionsList += `   🎯 ${session.session_type} (${session.performance_score}/10)\n`;
            sessionsList += `   ❌ ${mistakeCount} mistakes recorded\n\n`;
          });

          sessionsList += `**To edit a session:** Just tell me which number you want to edit and what mistakes to add!\n\n`;
          sessionsList += `*Example: "Edit session 1, add memorization mistakes in Ali Imran ayah 4"*`;

          return sessionsList;
        } catch (error) {
          console.error("Error finding sessions:", error);

          return `❌ **Error Finding Sessions**

I encountered an error while looking up your recent sessions. Please try using the manual Edit button in your dashboard.

**Error**: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
      } else if (
        functionCall.name === "edit_session_mistakes" &&
        functionCall.args
      ) {
        // Handle adding mistakes to an existing session
        const editData = functionCall.args as any;

        try {
          // If no session_number provided, guide them to use find_recent_sessions
          if (!editData.session_number) {
            return `📝 **Need to Find Your Session First**

I need to know which session to edit. Let me show you your recent sessions so you can pick which one to add mistakes to!`;
          }

          // First, fetch recent sessions to get the session ID from the number
          const getSessionsApiUrl = buildApiUrl("/api/sessions");

          const getSessionsResponse = await fetch(getSessionsApiUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (!getSessionsResponse.ok) {
            throw new Error(
              `Failed to fetch sessions: ${getSessionsResponse.status}`
            );
          }

          const sessionsResult = await getSessionsResponse.json();
          const allSessions = sessionsResult.sessions || [];

          // Filter to recent sessions (last 7 days) and sort
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - 7);

          const recentSessions = allSessions
            .filter(
              (session: any) => new Date(session.session_date) >= cutoffDate
            )
            .sort(
              (a: any, b: any) =>
                new Date(b.session_date).getTime() -
                new Date(a.session_date).getTime()
            )
            .slice(0, 10);

          // Get the session ID from the session number (1-based index)
          const sessionIndex = editData.session_number - 1;
          if (sessionIndex < 0 || sessionIndex >= recentSessions.length) {
            return `❌ **Invalid Session Number**

Session ${editData.session_number} doesn't exist in your recent sessions. Please use a number from 1 to ${recentSessions.length}.

To see your sessions again, just ask me to "show my recent sessions".`;
          }

          const selectedSession = recentSessions[sessionIndex];
          const sessionId = selectedSession.id;

          // Now fetch the full session details
          const getApiUrl = buildApiUrl(`/api/sessions/${sessionId}`);

          const getResponse = await fetch(getApiUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          if (!getResponse.ok) {
            if (getResponse.status === 404) {
              return `❌ **Session Not Found**

I couldn't find a session with that ID. Let me help you find your recent sessions instead! Please tell me to "show my recent sessions" and I'll list them for you to choose from.`;
            }
            throw new Error(`Failed to fetch session: ${getResponse.status}`);
          }

          const sessionResult = await getResponse.json();
          const existingSession = sessionResult.session;

          // Build new mistakes array
          const newMistakes = editData.mistakes_to_add || [];

          // For AI editing, we only add mistakes directly without touching portions
          // This avoids the complex PUT logic that recreates everything

          // Prepare new mistakes for direct insertion
          const mistakesToInsert = newMistakes
            .map((mistake: any) => {
              // Find the portion that matches the surah
              const matchingPortion = existingSession.session_portions.find(
                (portion: any) =>
                  portion.surah_name.toLowerCase() ===
                  mistake.surah_name.toLowerCase()
              );

              if (!matchingPortion) {
                console.warn(
                  `⚠️ No portion found for surah: ${mistake.surah_name}`
                );
                return null;
              }

              return {
                session_id: sessionId,
                session_portion_id: matchingPortion.id,
                error_category: mistake.error_category,
                error_subcategory: mistake.error_subcategory,
                severity_level: mistake.severity_level,
                ayah_number: mistake.ayah_number,
                additional_notes: mistake.additional_notes || "",
              };
            })
            .filter((mistake: any) => mistake !== null);

          if (mistakesToInsert.length === 0) {
            return `❌ **No Valid Mistakes to Add**

None of the mistakes could be matched to existing portions in your session. Please check the surah names and try again.`;
          }

          // Use Supabase client to insert mistakes directly
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

          const insertResponse = await fetch(
            `${supabaseUrl}/rest/v1/mistakes`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: supabaseKey,
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(mistakesToInsert),
            }
          );

          if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            console.error("❌ Mistake insert error:", errorText);
            throw new Error(
              `API Error: ${insertResponse.status} - ${errorText}`
            );
          }

          // Success message
          const mistakeSummary = editData.mistakes_to_add
            .map(
              (m: any) =>
                `${m.surah_name} ayah ${m.ayah_number} (${m.error_category})`
            )
            .join(", ");

          // Calculate total mistakes count safely
          const existingCount = existingSession.mistakes?.length || 0;
          const newCount = editData.mistakes_to_add?.length || 0;
          const totalMistakes = existingCount + newCount;

          return `✅ **Mistakes Added Successfully!**

📝 **Added to Session ${editData.session_number}:**
${mistakeSummary}

Your session now has ${totalMistakes} total mistakes recorded (${existingCount} existing + ${newCount} new). May Allah make your practice easier!

You can view and edit more details in your dashboard.`;
        } catch (error) {
          console.error("Error editing session:", error);

          return `❌ **Error Adding Mistakes**

I encountered an error while adding mistakes to your session. Please try using the manual Edit button in your dashboard for more precise control.

**Error**: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
      }
    }

    return response.text || "Sorry, I could not generate a response.";
  } catch (error) {
    console.error("Gemini AI Error:", error);

    // Fallback to pattern matching if Gemini fails
    return generateFallbackResponse(message);
  }
}

// Fallback response function (our original pattern matching)
function generateFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("practice") || lowerMessage.includes("session")) {
    return `Assalam Alaikum! I'm excited to hear about your Quran practice. 

To help you track this session effectively, could you share:
- Which Surah or verses did you practice?
- How long was your session?
- How did you feel about your performance (1-10)?
- Any specific challenges you noticed?

I'll help you log this and provide personalized guidance! 🌟`;
  }

  return `Assalam Alaikum! I'm here to help you with your Quran practice journey. 

You can tell me about:
- Your recent practice sessions
- Specific verses or Surahs you're working on
- Any challenges you're facing
- Questions about Tajweed or pronunciation

How can I assist you today? 📚✨`;
}
