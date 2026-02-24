import { brand } from "../../content/landingContent";
import { MemoriosoLogo } from "../memorioso-logo";
import { TrackedLink } from "../tracked-link";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-6 w-full max-w-7xl px-6 pb-10 pt-2 sm:px-8">
      <div className="flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <MemoriosoLogo compact />
          <p className="text-sm text-white/45">{`© ${brand.name}`}</p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm text-white/65">
          {[
            ["/pricing", "Pricing"],
            ["/gift", "Gift"],
            ["/templates", "Templates"],
            ["/privacy", "Privacy"],
            ["/terms", "Terms"],
            ["/contact", "Contact"]
          ].map(([href, label]) => (
            <TrackedLink
              key={href}
              href={href}
              className="rounded-lg px-2 py-1 transition hover:text-parchment"
            >
              {label}
            </TrackedLink>
          ))}
        </nav>
      </div>
    </footer>
  );
}
