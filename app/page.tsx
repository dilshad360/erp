// Root page: visitors at dilshadcodes.com see the marketing landing page.
// The actual marketing page lives in app/(marketing)/page.tsx.
// This file is needed because Next.js requires app/page.tsx.
import { redirect } from "next/navigation";

export default function RootPage(): never {
  redirect("/signup");
}
