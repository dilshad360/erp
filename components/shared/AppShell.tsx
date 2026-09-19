"use client";

import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import MobileHeader from "./MobileHeader";
import InstallPrompt from "@/components/pwa/InstallPrompt";

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps): React.JSX.Element {
  return (
    <div className="flex h-screen h-[100dvh] overflow-hidden bg-[var(--color-bg)] relative">
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex md:flex-col md:w-60 md:shrink-0">
        <Sidebar />
      </aside>

      {/* Main content area with MobileHeader */}
      <div className="flex flex-col flex-1 overflow-hidden min-h-0">
        {/* Mobile top header with logo — hidden on desktop */}
        <MobileHeader />

        <main
          className="flex-1 overflow-y-auto overscroll-y-contain"
          id="main-content"
        >
          {/* Inner wrapper guaranteeing full bottom nav clearance in scroll calculation */}
          <div className="min-h-full flex flex-col safe-bottom-clearance">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav — hidden on desktop */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        aria-label="Main navigation"
      >
        <BottomNav />
      </nav>

      {/* PWA Install Banner */}
      <InstallPrompt />
    </div>
  );
}
