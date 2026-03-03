const DEFAULT_EMAIL_SITE_URL = "https://memorioso.com";

function normalizeBaseUrl(value: string | undefined) {
  const source = value?.trim() || DEFAULT_EMAIL_SITE_URL;
  return source.replace(/\/$/, "");
}

function getRuntimeEnv(name: string) {
  const maybeProcess = globalThis as {
    process?: { env?: Record<string, string | undefined> };
  };
  return maybeProcess.process?.env?.[name];
}

export const emailSiteUrl = normalizeBaseUrl(
  getRuntimeEnv("EMAIL_SITE_URL") || getRuntimeEnv("NEXT_PUBLIC_SITE_URL"),
);

export function emailAbsoluteUrl(path: string) {
  if (!path.startsWith("/")) return `${emailSiteUrl}/${path}`;
  return `${emailSiteUrl}${path}`;
}

export const emailDefaultSupportUrl = emailAbsoluteUrl("/contact");
export const emailDefaultLogoUrl = emailAbsoluteUrl(
  "/branding/memorioso-email-logo.png",
);
