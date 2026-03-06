describe("Featurebase loader", () => {
  beforeEach(async () => {
    vi.resetModules();
    document.head.innerHTML = "";
    document.body.innerHTML = "";

    const { __featurebaseLoaderTestUtils } = await import("../../lib/featurebase/loader");
    __featurebaseLoaderTestUtils.reset();
  });

  it("injects the Featurebase SDK script only once", async () => {
    const { getFeaturebaseScriptId, loadFeaturebaseSdk } = await import("../../lib/featurebase/loader");

    const firstLoad = loadFeaturebaseSdk();
    const secondLoad = loadFeaturebaseSdk();

    const scriptId = getFeaturebaseScriptId();
    const script = document.getElementById(scriptId) as HTMLScriptElement | null;
    expect(script).not.toBeNull();
    expect(script?.src).toBe("https://do.featurebase.app/js/sdk.js");
    expect(document.querySelectorAll(`#${scriptId}`)).toHaveLength(1);

    script?.dispatchEvent(new Event("load"));

    const [firstSdk, secondSdk] = await Promise.all([firstLoad, secondLoad]);
    expect(firstSdk).toBe(secondSdk);
    expect(typeof window.Featurebase).toBe("function");
  });
});
