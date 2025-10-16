import type { User } from "@supabase/supabase-js";
import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface AuthUser extends User {
  profile?: Profile;
}

export interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
}
