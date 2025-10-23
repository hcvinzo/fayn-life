"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth-api";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/auth";

/**
 * Custom hook for authentication management
 * Provides user state, profile data, and auth methods
 *
 * Following clean architecture:
 * - Uses API client for all backend communication
 * - Uses Supabase client ONLY for auth state listening (client-side)
 * - No direct service or repository access from client code
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session via API
    const getInitialSession = async () => {
      try {
        const response = await authApi.getSession();
        setUser(response.user);
        setProfile(response.profile);
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes using Supabase client (client-side only)
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        // Refresh session data via API to get updated profile
        try {
          const response = await authApi.getSession();
          setProfile(response.profile);
        } catch (error) {
          console.error("Error fetching profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const signIn = async (email: string, password: string) => {
    await authApi.signIn(email, password);
    router.push("/dashboard");
    router.refresh();
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    await authApi.signUp({
      email,
      password,
      confirmPassword: password, // For hook usage, assume password is confirmed
      fullName,
      practiceId: null,
      role: "practitioner",
    });
    router.push("/dashboard");
    router.refresh();
  };

  const signOut = async () => {
    await authApi.signOut();
    router.push("/login");
    router.refresh();
  };

  return {
    user,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
  };
}
