import { describe, expect, it } from "vitest";
import {
  buildGoogleChooserPath,
  buildPostLoginPath,
  googleAuthorizationParams
} from "../../lib/auth/googleOAuthParams";

describe("google OAuth chooser routing", () => {
  it("builds chooser path with encoded returnTo", () => {
    const path = buildGoogleChooserPath("/app/storybooks/abc?tab=cover");
    expect(path).toBe("/auth/choose-google-account?returnTo=%2Fapp%2Fstorybooks%2Fabc%3Ftab%3Dcover");
  });

  it("builds post-login callback path with returnTo", () => {
    const path = buildPostLoginPath("/app");
    expect(path).toBe("/auth/post-login?returnTo=%2Fapp");
  });

  it("uses select_account prompt for chooser behavior", () => {
    expect(googleAuthorizationParams.prompt).toBe("select_account");
  });
});

