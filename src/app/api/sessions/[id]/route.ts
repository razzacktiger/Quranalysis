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
    console.log("🔍 PUT /api/sessions/[id] - Request data:", {
      sessionId: id,
      session: session,
      portionsCount: session_portions?.length || 0,
      mistakesCount: mistakes?.length || 0,
    });

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

    // Handle session_portions update (UPSERT - insert or update)
    let createdPortions: any[] = [];
    if (session_portions !== undefined && session_portions.length > 0) {
      // Use UPSERT logic - update existing, insert new
      const portionsWithSessionId = session_portions.map((portion: any) => {
        // Remove frontend-only fields before database insert
        const { tempId, databaseId, ...cleanPortion } = portion;

        return {
          ...cleanPortion,
          session_id: id,
          // Keep existing ID if present, remove if it's a new UUID without matching DB record
        };
      });

      console.log("🔍 About to upsert portions:", portionsWithSessionId);

      const { data: upsertedPortions, error: upsertPortionsError } =
        await supabase
          .from("session_portions")
          .upsert(portionsWithSessionId, {
            onConflict: "id",
            ignoreDuplicates: false,
          })
          .select();

      if (upsertPortionsError) {
        console.error("Upsert session portions error:", upsertPortionsError);
        return NextResponse.json(
          { error: "Failed to update session portions" },
          { status: 500 }
        );
      }

      createdPortions = upsertedPortions || [];
    }

    // Handle mistakes update (UPSERT - insert, update, and delete)
    if (session_portions !== undefined && mistakes && mistakes.length >= 0) {
      // First, get all existing mistakes for this session to handle deletions
      const { data: existingMistakes } = await supabase
        .from("mistakes")
        .select("id")
        .eq("session_id", id);

      // Use UPSERT logic for mistakes - update/insert new ones
      const mistakesWithIds = mistakes
        .map((mistake: any) => {
          // Find corresponding portion by session_portion_id
          const correspondingPortion =
            createdPortions.find(
              (portion) => portion.id === mistake.session_portion_id
            ) || createdPortions[0]; // Fallback to first portion

          if (!correspondingPortion) {
            console.warn(
              "No corresponding portion found for mistake:",
              mistake
            );
            return null;
          }

          // Remove frontend-only fields before database insert
          const { tempId, portionTempId, ...cleanMistake } = mistake;

          return {
            ...cleanMistake,
            session_id: id,
            session_portion_id: correspondingPortion.id,
          };
        })
        .filter((mistake) => mistake && mistake.session_portion_id);

      if (mistakesWithIds.length > 0) {
        console.log("🔍 About to upsert mistakes:", mistakesWithIds);

        const { error: upsertMistakesError } = await supabase
          .from("mistakes")
          .upsert(mistakesWithIds, {
            onConflict: "id",
            ignoreDuplicates: false,
          });

        if (upsertMistakesError) {
          console.error("Upsert mistakes error:", upsertMistakesError);
          return NextResponse.json(
            {
              error:
                "Session and portions updated but failed to update mistakes",
            },
            { status: 207 }
          );
        }
      }

      // Delete mistakes that are no longer in the frontend list
      if (existingMistakes && existingMistakes.length > 0) {
        const frontendMistakeIds = mistakes
          .map((m: any) => m.id)
          .filter((id: string) => id && !id.includes("uuid")); // Only real DB IDs, not generated UUIDs

        const mistakesToDelete = existingMistakes
          .filter((existing: any) => !frontendMistakeIds.includes(existing.id))
          .map((m: any) => m.id);

        if (mistakesToDelete.length > 0) {
          console.log("🔍 Deleting removed mistakes:", mistakesToDelete);
          const { error: deleteMistakesError } = await supabase
            .from("mistakes")
            .delete()
            .in("id", mistakesToDelete);

          if (deleteMistakesError) {
            console.error("Delete mistakes error:", deleteMistakesError);
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
