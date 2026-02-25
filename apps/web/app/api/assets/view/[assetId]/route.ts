import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../../lib/auth/server";
import { getAssetForUser } from "../../../../../lib/data/assets";
import { anyApi, convexMutation, getConvexUrl } from "../../../../../lib/convex/ops";
import { signR2GetObject } from "../../../../../lib/r2/server";
import { getR2FreeTierCaps } from "../../../../../lib/uploads/r2Quota";

export const runtime = "nodejs";

function jsonError(status: number, error: string) {
  return NextResponse.json({ ok: false, error }, { status });
}

type Props = {
  params: Promise<{ assetId: string }>;
};

export async function GET(request: Request, { params }: Props) {
  const { assetId } = await params;
  const user = await requireAuthenticatedUser("/app");
  const asset = await getAssetForUser(user.id, assetId);
  if (!asset.ok) {
    return jsonError(404, "Asset not found.");
  }

  const caps = getR2FreeTierCaps();
  if (caps.hardStopEnabled && asset.data.storage_provider === "R2") {
    if (!getConvexUrl()) return jsonError(500, "Convex is required for R2 quota enforcement.");
    const reserve = await convexMutation<unknown>(anyApi.assets.reserveR2ClassBQuota, {
      viewerSubject: user.id,
      readOps: 1,
      caps: {
        monthlyStorageBytesCap: caps.monthlyStorageBytesCap,
        monthlyClassAOpsCap: caps.monthlyClassAOpsCap,
        monthlyClassBOpsCap: caps.monthlyClassBOpsCap
      }
    });
    if (!reserve.ok) {
      if (reserve.error.includes("R2_FREE_TIER_LIMIT_CLASS_B_MONTHLY")) {
        return jsonError(429, "R2 free-tier Class B operation cap reached for this month.");
      }
      return jsonError(500, "Could not reserve R2 read quota.");
    }
  }

  if (asset.data.storage_provider === "R2" && asset.data.storage_key) {
    try {
      const signedUrl = await signR2GetObject({
        key: asset.data.storage_key,
        expiresInSeconds: 300
      });
      return NextResponse.redirect(signedUrl, { status: 307 });
    } catch (error) {
      return jsonError(500, error instanceof Error ? error.message : "Could not sign asset URL.");
    }
  }

  if (typeof asset.data.source_url === "string" && /^https?:\/\//.test(asset.data.source_url)) {
    return NextResponse.redirect(asset.data.source_url, { status: 307 });
  }

  return jsonError(400, "Asset is not available as a signed/redirectable URL.");
}
