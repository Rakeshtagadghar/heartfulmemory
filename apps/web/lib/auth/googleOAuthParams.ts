export const googleAuthorizationParams = {
  prompt: "select_account",
  include_granted_scopes: "true"
} as const;

export function buildGoogleChooserPath(returnTo: string) {
  const params = new URLSearchParams();
  params.set("returnTo", returnTo);
  return `/auth/choose-google-account?${params.toString()}`;
}

export function buildPostLoginPath(returnTo: string) {
  const params = new URLSearchParams();
  params.set("returnTo", returnTo);
  return `/auth/post-login?${params.toString()}`;
}

