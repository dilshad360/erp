import { redirect } from "next/navigation";

export default function MarketingForgotPasswordPage(): void {
  // If hitting root domain forgot-password, redirect to login or home
  redirect("/workspace-not-found");
}
