// Sessions API - GET (list) and POST (create)
// Updated for multi-surah session support

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { CreateSessionRequest, FullSessionData } from "@/types/session";

// GET /api/sessions - List sessions for authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized - No auth header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Create properly authenticated Supabase client for this user
    const supabase = createClient(
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

    // Verify token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Fetch sessions with portions and mistakes (new multi-surah structure)
    const { data: sessions, error } = await supabase
      .from("sessions")
      .select(
        `
        *,
        session_portions (
          id,
          surah_name,
          ayah_start,
          ayah_end,
          juz_number,
          pages_read,
          repetition_count,
          recency_category,
          created_at
        ),
        mistakes (
          id,
          session_portion_id,
          error_category,
          error_subcategory,
          severity_level,
          ayah_number,
          additional_notes,
          created_at
        )
      `
      )
      .eq("user_id", user.id) // EXPLICIT user filter for security
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create new session
export async function POST(request: NextRequest) {
  try {
    // Get auth token from request headers
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    // Create properly authenticated Supabase client for this user (same as AI fix)
    const supabase = createClient(
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

    // Verify token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { session, session_portions, mistakes }: CreateSessionRequest = body;

    // Keep reference to original body for tempId mapping
    const originalSessionPortions = body.session_portions;

    // Creating session for authenticated user
    const sessionData = {
      ...session,
      user_id: user.id,
    };

    // Start transaction: create session first
    const { data: newSession, error: sessionError } = await supabase
      .from("sessions")
      .insert(sessionData)
      .select()
      .single();

    if (sessionError) {
      console.error("❌ Session creation error:", sessionError);
      console.error("❌ Error details:", JSON.stringify(sessionError, null, 2));
      return NextResponse.json(
        {
          error: "Failed to create session",
          debug: sessionError.message,
          details: sessionError.details,
          hint: sessionError.hint,
          code: sessionError.code,
        },
        { status: 500 }
      );
    }

    // Create session portions
    let createdPortions: any[] = [];
    if (session_portions && session_portions.length > 0) {
      console.log(
        "🔍 Creating session portions:",
        JSON.stringify(session_portions, null, 2)
      );

      const portionsWithSessionId = session_portions.map((portion: any) => {
        const { tempId, ...portionData } = portion; // Remove tempId before inserting
        return {
          ...portionData,
          session_id: newSession.id,
        };
      });

      const { data: newPortions, error: portionsError } = await supabase
        .from("session_portions")
        .insert(portionsWithSessionId)
        .select();

      if (portionsError) {
        console.error("❌ Session portions creation error:", portionsError);
        return NextResponse.json(
          {
            error: "Failed to create session portions",
            debug: portionsError.message,
            details: portionsError.details,
          },
          { status: 500 }
        );
      }

      createdPortions = newPortions || [];
      console.log(
        "✅ Created session portions:",
        JSON.stringify(createdPortions, null, 2)
      );
    }

    // Create mistakes if provided (linked to specific portions)
    if (mistakes && mistakes.length > 0) {
      console.log("🔍 Creating mistakes:", JSON.stringify(mistakes, null, 2));

      // Map mistakes to include session_id and session_portion_id
      // We need to match frontend tempIds to backend portion IDs
      // Create mapping from tempId to index using original body
      const tempIdToIndex = new Map();

      // Create mapping from tempId to index
      if (originalSessionPortions) {
        originalSessionPortions.forEach((portion: any, index: number) => {
          if (portion.tempId) {
            tempIdToIndex.set(portion.tempId, index);
          }
        });
      }

      const mistakesWithIds = mistakes
        .map((mistake: any) => {
          // Find the portion index using the tempId
          const portionIndex = tempIdToIndex.get(mistake.portionTempId);

          if (portionIndex === undefined || !createdPortions[portionIndex]) {
            console.error(
              `❌ Could not find portion for mistake with portionTempId: ${mistake.portionTempId}, portionIndex: ${portionIndex}`
            );
            console.error(
              `❌ Available tempIds:`,
              Array.from(tempIdToIndex.keys())
            );
            console.error(
              `❌ Created portions:`,
              createdPortions.map((p) => p.id)
            );
            return null;
          }

          const correspondingPortionId = createdPortions[portionIndex].id;

          return {
            session_id: newSession.id,
            session_portion_id: correspondingPortionId,
            error_category: mistake.error_category,
            error_subcategory: mistake.error_subcategory,
            severity_level: mistake.severity_level,
            ayah_number: mistake.ayah_number,
            additional_notes: mistake.additional_notes,
          };
        })
        .filter((mistake) => mistake !== null); // Only include valid mistakes

      if (mistakesWithIds.length > 0) {
        const { data: createdMistakes, error: mistakesError } = await supabase
          .from("mistakes")
          .insert(mistakesWithIds)
          .select();

        if (mistakesError) {
          console.error("❌ Mistakes creation error:", mistakesError);
          return NextResponse.json(
            {
              error: "Session and portions created but failed to add mistakes",
            },
            { status: 207 } // Partial success
          );
        }

        console.log(
          "✅ Created mistakes:",
          JSON.stringify(createdMistakes, null, 2)
        );
      }
    } else {
      console.log("🔍 No mistakes provided");
    }

    // Fetch the complete session with portions and mistakes
    const { data: completeSession, error: fetchError } = await supabase
      .from("sessions")
      .select(
        `
        *,
        session_portions (
          id,
          surah_name,
          ayah_start,
          ayah_end,
          juz_number,
          pages_read,
          repetition_count,
          recency_category,
          created_at
        ),
        mistakes (
          id,
          session_portion_id,
          error_category,
          error_subcategory,
          severity_level,
          ayah_number,
          additional_notes,
          created_at
        )
      `
      )
      .eq("id", newSession.id)
      .single();

    if (fetchError) {
      console.error("Fetch complete session error:", fetchError);
      return NextResponse.json(
        { error: "Session created but failed to fetch complete data" },
        { status: 207 }
      );
    }

    return NextResponse.json({ session: completeSession }, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
