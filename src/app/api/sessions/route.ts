// Sessions API - GET (list) and POST (create)

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

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

    // Fetch sessions with mistakes (explicit user filter + RLS for double security)
    const { data: sessions, error } = await supabase
      .from("sessions")
      .select(
        `
        *,
        mistakes (
          id,
          error_category,
          error_subcategory,
          severity_level,
          location,
          additional_notes
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
    const { session, mistakes } = body;

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

    // Create mistakes if provided
    if (mistakes && mistakes.length > 0) {
      console.log("🔍 Creating mistakes:", JSON.stringify(mistakes, null, 2));

      const mistakesWithSessionId = mistakes.map((mistake: any) => ({
        ...mistake,
        session_id: newSession.id,
      }));

      console.log(
        "🔍 Mistakes with session ID:",
        JSON.stringify(mistakesWithSessionId, null, 2)
      );

      const { data: createdMistakes, error: mistakesError } = await supabase
        .from("mistakes")
        .insert(mistakesWithSessionId)
        .select();

      if (mistakesError) {
        console.error("❌ Mistakes creation error:", mistakesError);
        console.error(
          "❌ Mistakes error details:",
          JSON.stringify(mistakesError, null, 2)
        );
        // Session was created but mistakes failed - could handle rollback here
        return NextResponse.json(
          { error: "Session created but failed to add mistakes" },
          { status: 207 } // Partial success
        );
      }

      console.log(
        "✅ Created mistakes:",
        JSON.stringify(createdMistakes, null, 2)
      );
    } else {
      console.log("🔍 No mistakes provided");
    }

    // Fetch the complete session with mistakes
    const { data: completeSession, error: fetchError } = await supabase
      .from("sessions")
      .select(
        `
        *,
        mistakes (
          id,
          error_category,
          error_subcategory,
          severity_level,
          location,
          additional_notes
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
