import type { Metadata } from "next";
import type { ReactNode } from "react";
import { noindexMetadata } from "../../lib/seo/metadata";

export const metadata: Metadata = noindexMetadata;

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
