/**
 * Sprint 34 – Effective orientation resolution.
 *
 * A page's effective orientation is either its own override or the project's
 * orientation (when the page uses "inherit").
 */

export type OrientationValue = "portrait" | "landscape";
export type PageOrientationField = "inherit" | "portrait" | "landscape";

/**
 * Resolves the effective orientation for a page.
 *
 * @param pageOrientation – the per-page override (`"inherit"` | `"portrait"` | `"landscape"`).
 *                          If absent/null/undefined, treated as `"inherit"`.
 * @param projectOrientation – the storybook-level orientation (`"portrait"` | `"landscape"`).
 *                             Falls back to `"portrait"` if missing.
 * @returns the resolved `"portrait"` or `"landscape"`.
 */
export function resolveEffectiveOrientation(
    pageOrientation: PageOrientationField | null | undefined,
    projectOrientation: OrientationValue | null | undefined
): OrientationValue {
    const project: OrientationValue = projectOrientation === "landscape" ? "landscape" : "portrait";

    if (!pageOrientation || pageOrientation === "inherit") {
        return project;
    }

    return pageOrientation;
}
