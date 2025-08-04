// Supabase Client Configuration
// This will be used when implementing real Google OAuth

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase environment variables missing. Auth features will be disabled."
  );
}

// Create client with fallback values for build time
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

// Google OAuth Sign In Function
export const signInWithGoogle = async () => {
  // Check if Supabase is properly configured
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase configuration missing. Please check environment variables."
    );
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }

  return data;
};

// Sign Out Function
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Get Current User
export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};
