import { redirect } from "next/navigation";

/**
 * Root page - redirects to login
 * In the future, this could be a landing page
 */
export default function Home() {
  redirect("/login");
}
