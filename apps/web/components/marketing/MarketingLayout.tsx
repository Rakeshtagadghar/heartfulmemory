import type { ReactNode } from "react";
import { BackgroundOrbs } from "../landing/primitives";
import { NavBar } from "./NavBar";

export function MarketingLayout({
  children,
  navLinks
}: {
  children: ReactNode;
  navLinks: Array<{ label: string; href: string }>;
}) {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_15%_10%,rgba(213,179,106,0.08),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(17,59,52,0.16),transparent_42%),radial-gradient(circle_at_50%_100%,rgba(198,109,99,0.1),transparent_45%),linear-gradient(180deg,#0a1321_0%,#0b1423_40%,#09111d_100%)] text-white">
      <BackgroundOrbs />
      <NavBar links={navLinks} />
      <div id="main-content" className="relative">
        {children}
      </div>
    </main>
  );
}

