"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Server actions for authentication
 */

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const practiceId = formData.get("practiceId") as string;

  const supabase = await createClient();

  // Create the auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Update the profile with practice_id
  // The profile is created automatically by the database trigger
  // We just need to update it with the practice_id
  if (data.user) {
    const { error: profileError } = await supabase
      .from("profiles")
      // @ts-expect-error - Supabase client types are not properly inferred in server actions
      .update({ practice_id: practiceId })
      .eq("id", data.user.id);

    if (profileError) {
      return { error: "Failed to link practice to user profile" };
    }
  }

  redirect("/dashboard");
}

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function getPractices() {
  // Use service role key to bypass RLS since unauthenticated users
  // need to see all practices during registration
  const { createClient: createServiceClient } = await import("@supabase/supabase-js");

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const { data, error } = await supabase
    .from("practices")
    .select("id, name")
    .order("name");

  if (error) {
    console.error("Error fetching practices:", error);
    return [];
  }

  return data || [];
}
