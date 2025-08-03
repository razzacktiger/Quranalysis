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
  context?: string,
  systemPrompt?: string
): Promise<string> {
  try {
    // Initialize Gemini AI with correct 2025 syntax
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    // Define the session creation function for Gemini (CORRECT 2025 SYNTAX)
    const createSessionFunction: FunctionDeclaration = {
      name: "create_quran_session",
      description: "Create a new Quran practice session with extracted details",
      parametersJsonSchema: {
        type: "object",
        properties: {
          surah_name: {
            type: "string",
            description:
              "Name of the Surah practiced (e.g., 'Al-Fatiha', 'Maryam')",
          },
          ayah_start: {
            type: "number",
            description: "Starting ayah number",
          },
          ayah_end: {
            type: "number",
            description: "Ending ayah number",
          },
          duration_minutes: {
            type: "number",
            description: "Duration of practice in minutes",
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
          recency_category: {
            type: "string",
            enum: ["new", "near", "far", "maintenance"],
            description: "How recently this portion was practiced",
          },
          performance_score: {
            type: "number",
            minimum: 1.0,
            maximum: 10.0,
            description:
              "Self-rated performance score from 1.0-10.0 (decimals allowed, e.g., 8.5, 9.2)",
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
          "surah_name",
          "duration_minutes",
          "session_type",
          "performance_score",
        ],
      },
    };

    // Build the system prompt for Quran coaching
    const fullSystemPrompt =
      systemPrompt ||
      `You are an AI Quran Coach that helps extract and log practice session details. When a user describes their practice session, IMMEDIATELY extract the information and use the create_quran_session function to save it.

CRITICAL RULES:
- AUTOMATICALLY save sessions when you have enough information - DO NOT ask for permission or confirmation
- REQUIRED fields: surah_name, duration_minutes, session_type, performance_score
- EXTRACT and SAVE immediately upon receiving these details
- If user says "yes" or "save it" after you show a summary, that means SAVE IMMEDIATELY
- Never ask "Would you like me to save this?" - just save it automatically

Your role:
- EXTRACT session details from user messages (don't ask unnecessary questions)
- Use the create_quran_session function IMMEDIATELY when you have enough details
- Be encouraging and provide brief coaching tips
- Use appropriate Islamic greetings

EXTRACTION PRIORITY:
1. If user provides session details → EXTRACT and CREATE session immediately
2. If user confirms to save → CREATE session immediately  
3. Only ask clarifying questions if critical info is missing
4. Make reasonable assumptions when possible

Guidelines:
- Be decisive about extraction, not chatty
- Use "Assalam Alaikum", "MashaAllah", "JazakAllah Khair" naturally
- Keep responses under 100 words after creating sessions
- Focus on encouragement and next steps

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
        tools: [{ functionDeclarations: [createSessionFunction] }],
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
          // Create the session via the internal API
          const sessionPayload: any = {
            session_date: new Date().toISOString(),
            session_type: sessionData.session_type,
            duration_minutes: sessionData.duration_minutes,
            surah_name: sessionData.surah_name,
            ayah_start: sessionData.ayah_start,
            ayah_end: sessionData.ayah_end,
            recency_category: sessionData.recency_category,
            performance_score: sessionData.performance_score, // Allow decimals like 8.5, 9.2
            additional_notes: sessionData.notes || "Created via AI Assistant",
          };

          // Create mistakes array
          const mistakes =
            sessionData.mistakes?.map((m: any) => ({
              error_category: m.error_category,
              severity_level: Math.round(m.severity_level) || 2, // Convert to integer, default medium severity
              location: `Ayah ${m.ayah_number || "?"}`,
              additional_notes: m.description || "",
            })) || [];

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

          // Add user_id to session payload
          sessionPayload.user_id = user.id;

          // Direct database insert with user-authenticated client
          const { data: newSession, error: sessionError } = await userSupabase
            .from("sessions")
            .insert(sessionPayload)
            .select()
            .single();

          if (sessionError) {
            console.error("❌ Session creation error:", sessionError);
            throw new Error(`Database Error: ${sessionError.message}`);
          }

          // Create mistakes if provided
          if (mistakes && mistakes.length > 0) {
            const mistakesWithSessionId = mistakes.map((mistake: any) => ({
              ...mistake,
              session_id: newSession.id,
            }));

            const { error: mistakesError } = await userSupabase
              .from("mistakes")
              .insert(mistakesWithSessionId);

            if (mistakesError) {
              console.error("❌ Mistakes creation error:", mistakesError);
              // Don't fail the entire operation for mistakes
            }
          }

          // Success case
          if (true) {
            return `✅ **Session Saved Successfully!**

📖 **Saved to Your Progress Log:**
**Surah**: ${sessionData.surah_name} (Ayahs ${sessionData.ayah_start}-${
              sessionData.ayah_end
            })
**Duration**: ${sessionData.duration_minutes} minutes
**Type**: ${sessionData.session_type}
**Performance**: ${sessionData.performance_score}/10
${
  sessionData.mistakes?.length > 0
    ? `**Mistakes**: ${sessionData.mistakes.length} recorded`
    : ""
}

May Allah reward your efforts in studying the Quran! Your session has been added to your dashboard.`;
          }
        } catch (error) {
          console.error("Error saving session:", error);
          return `❌ **Error Saving Session**

I extracted your session details correctly but encountered an error saving to the database. Please try using the manual "Create Session" button in your dashboard.

**Extracted Details:**
**Surah**: ${sessionData.surah_name} (Ayahs ${sessionData.ayah_start}-${
            sessionData.ayah_end
          })
**Duration**: ${sessionData.duration_minutes} minutes  
**Type**: ${sessionData.session_type}
**Performance**: ${sessionData.performance_score}/10

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
