// Individual Session API - GET, PUT, DELETE
// Updated for multi-surah session support

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";
import { UpdateSessionRequest, FullSessionData } from "@/types/session";

interface RouteParams {
  params: {
    id: string;
  };
}

// Helper function to create authenticated Supabase client
async function createAuthenticatedClient(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    throw new Error("No authorization header");
  }

  const token = authHeader.replace("Bearer ", "");

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

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    throw new Error("Invalid token");
  }

  return { supabase, user };
}

// GET /api/sessions/[id] - Get specific session
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Await params for Next.js 15 compatibility
    const { id } = await params;

    const { supabase, user } = await createAuthenticatedClient(request);

    // Fetch specific session with portions and mistakes (new multi-surah structure)
    const { data: session, error } = await supabase
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
      .eq("id", id)
      .eq("user_id", user.id) // EXPLICIT user filter for security
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("API error:", error);
    if (
      error instanceof Error &&
      (error.message.includes("authorization") ||
        error.message.includes("token"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/sessions/[id] - Update session
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Await params for Next.js 15 compatibility
    const { id } = await params;

    const { supabase, user } = await createAuthenticatedClient(request);

    const body = await request.json();
    const { session, session_portions, mistakes }: UpdateSessionRequest = body;

    // Update session (explicit user filter + RLS for double security)
    const { data: updatedSession, error: sessionError } = await supabase
      .from("sessions")
      .update(session)
      .eq("id", id)
      .eq("user_id", user.id) // EXPLICIT user filter for security
      .select()
      .single();

    if (sessionError) {
      if (sessionError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }
      console.error("Session update error:", sessionError);
      return NextResponse.json(
        { error: "Failed to update session" },
        { status: 500 }
      );
    }

    // Handle session_portions update (replace all)
    let createdPortions: any[] = [];
    if (session_portions) {
      // Delete existing session portions for this session (CASCADE will handle mistakes)
      const { error: deletePortionsError } = await supabase
        .from("session_portions")
        .delete()
        .eq("session_id", id);

      if (deletePortionsError) {
        console.error("Delete session portions error:", deletePortionsError);
        return NextResponse.json(
          { error: "Failed to update session portions" },
          { status: 500 }
        );
      }

      // Insert new session portions if provided
      if (session_portions.length > 0) {
        const portionsWithSessionId = session_portions.map((portion: any) => ({
          ...portion,
          session_id: id,
          id: undefined, // Remove frontend ID, let DB generate new ones
        }));

        const { data: newPortions, error: insertPortionsError } = await supabase
          .from("session_portions")
          .insert(portionsWithSessionId)
          .select();

        if (insertPortionsError) {
          console.error("Insert session portions error:", insertPortionsError);
          return NextResponse.json(
            { error: "Session updated but failed to update portions" },
            { status: 207 }
          );
        }

        createdPortions = newPortions || [];
      }
    }

    // Handle mistakes update (linked to new portions)
    if (mistakes) {
      // Delete existing mistakes for this session (if not already deleted by CASCADE)
      const { error: deleteMistakesError } = await supabase
        .from("mistakes")
        .delete()
        .eq("session_id", id);

      if (deleteMistakesError) {
        console.error("Delete mistakes error:", deleteMistakesError);
        return NextResponse.json(
          { error: "Failed to update mistakes" },
          { status: 500 }
        );
      }

      // Insert new mistakes if provided (linked to new portions)
      if (mistakes.length > 0) {
        const mistakesWithIds = mistakes
          .map((mistake: any) => {
            // Find corresponding portion by matching portionIndex
            const correspondingPortion = createdPortions.find(
              (portion, index) => index === mistake.portionIndex
            );

            return {
              ...mistake,
              session_id: id,
              session_portion_id: correspondingPortion?.id,
              // Remove frontend-only fields
              portionIndex: undefined,
              portionTempId: undefined,
              tempId: undefined,
            };
          })
          .filter((mistake) => mistake.session_portion_id); // Only include mistakes with valid portion IDs

        if (mistakesWithIds.length > 0) {
          const { error: insertMistakesError } = await supabase
            .from("mistakes")
            .insert(mistakesWithIds);

          if (insertMistakesError) {
            console.error("Insert mistakes error:", insertMistakesError);
            return NextResponse.json(
              {
                error:
                  "Session and portions updated but failed to update mistakes",
              },
              { status: 207 }
            );
          }
        }
      }
    }

    // Fetch the complete updated session with portions and mistakes
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
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Fetch complete session error:", fetchError);
      return NextResponse.json(
        { error: "Session updated but failed to fetch complete data" },
        { status: 207 }
      );
    }

    return NextResponse.json({ session: completeSession });
  } catch (error) {
    console.error("API error:", error);
    if (
      error instanceof Error &&
      (error.message.includes("authorization") ||
        error.message.includes("token"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/sessions/[id] - Delete session
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Await params for Next.js 15 compatibility
    const { id } = await params;

    const { supabase, user } = await createAuthenticatedClient(request);

    // Delete session (explicit user filter + RLS for double security)
    // Mistakes will be deleted automatically due to CASCADE foreign key
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id); // EXPLICIT user filter for security

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }
      console.error("Delete session error:", error);
      return NextResponse.json(
        { error: "Failed to delete session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("API error:", error);
    if (
      error instanceof Error &&
      (error.message.includes("authorization") ||
        error.message.includes("token"))
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
