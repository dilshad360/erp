import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ERP — dilshadcodes.com",
    template: "%s | dilshadcodes.com ERP",
  },
  description:
    "Multi-tenant ERP for small Indian startups. Attendance, clients, projects, and tasks — in one place.",
  robots: {
    index: false, // tenant pages are private; marketing pages override this
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-[var(--color-bg)] text-[var(--color-text-primary)] antialiased">
        {children}
      </body>
    </html>
  );
}

