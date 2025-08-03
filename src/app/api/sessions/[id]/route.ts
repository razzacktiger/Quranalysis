// Individual Session API - GET, PUT, DELETE

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createClient } from "@supabase/supabase-js";

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
    const { supabase, user } = await createAuthenticatedClient(request);

    // Fetch specific session with mistakes (explicit user filter + RLS for double security)
    const { data: session, error } = await supabase
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
      .eq("id", params.id)
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
    const { supabase, user } = await createAuthenticatedClient(request);

    const body = await request.json();
    const { session, mistakes } = body;

    // Update session (explicit user filter + RLS for double security)
    const { data: updatedSession, error: sessionError } = await supabase
      .from("sessions")
      .update(session)
      .eq("id", params.id)
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

    // Handle mistakes update
    if (mistakes) {
      // Delete existing mistakes for this session
      const { error: deleteError } = await supabase
        .from("mistakes")
        .delete()
        .eq("session_id", params.id);

      if (deleteError) {
        console.error("Delete mistakes error:", deleteError);
        return NextResponse.json(
          { error: "Failed to update mistakes" },
          { status: 500 }
        );
      }

      // Insert new mistakes if provided
      if (mistakes.length > 0) {
        const mistakesWithSessionId = mistakes.map((mistake: any) => ({
          ...mistake,
          session_id: params.id,
        }));

        const { error: insertError } = await supabase
          .from("mistakes")
          .insert(mistakesWithSessionId);

        if (insertError) {
          console.error("Insert mistakes error:", insertError);
          return NextResponse.json(
            { error: "Session updated but failed to update mistakes" },
            { status: 207 }
          );
        }
      }
    }

    // Fetch the complete updated session with mistakes
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
      .eq("id", params.id)
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
    const { supabase, user } = await createAuthenticatedClient(request);

    // Delete session (explicit user filter + RLS for double security)
    // Mistakes will be deleted automatically due to CASCADE foreign key
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", params.id)
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
