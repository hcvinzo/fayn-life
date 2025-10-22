"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clientAuthService } from "@/lib/services/auth-service";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/auth";

/**
 * Custom hook for authentication management
 * Provides user state, profile data, and auth methods
 *
 * Now using clean architecture with auth service layer.
 * Direct Supabase calls have been abstracted away.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { session } = await clientAuthService.getSession();
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch user profile
          const profileData = await clientAuthService.getProfile(session.user.id);
          setProfile(profileData);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const unsubscribe = clientAuthService.onAuthStateChange(async (authUser, session) => {
      setUser(authUser);

      if (authUser) {
        const profileData = await clientAuthService.getProfile(authUser.id);
        setProfile(profileData);
      } else {
        setProfile(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router]);

  const signIn = async (email: string, password: string) => {
    const result = await clientAuthService.signIn({
      email,
      password,
    });

    if (!result.success) {
      throw new Error(result.error || "Sign in failed");
    }

    router.push("/dashboard");
    router.refresh();
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const result = await clientAuthService.signUp({
      email,
      password,
      confirmPassword: password, // For hook usage, assume password is confirmed
      fullName,
      practiceId: null,
      role: "practitioner",
    });

    if (!result.success) {
      throw new Error(result.error || "Sign up failed");
    }

    router.push("/dashboard");
    router.refresh();
  };

  const signOut = async () => {
    await clientAuthService.signOut();
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
