export const SUPPORT_EMAIL = "hello@memorioso.co.uk";
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`;
export const SUPPORT_CONTACT_PATH = "/contact";

export function getSupportContactUrl(baseUrl: string) {
  return `${baseUrl.replace(/\/$/, "")}${SUPPORT_CONTACT_PATH}`;
}
