export type TechStackStatus = "core" | "optional" | "planned";

export type TechStackCategory =
  | "Frontend"
  | "Backend"
  | "AI"
  | "Storage & Media"
  | "Observability"
  | "Payments"
  | "Email"
  | "Integrations"
  | "Testing"
  | "Hosting";

export type TechStackItem = {
  id: string;
  name: string;
  /** Filename in /public/tech/ without extension, e.g. "nextjs" → /public/tech/nextjs.svg */
  iconKey: string;
  category: TechStackCategory;
  websiteUrl: string;
  docsUrl: string;
  /** Short phrase: what it does in this project */
  role: string;
  /** One-line rationale for choosing it */
  why: string;
  /** Which part of the product uses it */
  usedIn: string[];
  status: TechStackStatus;
};
