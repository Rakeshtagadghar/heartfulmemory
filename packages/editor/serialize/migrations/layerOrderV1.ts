import { normalizeDrawOrder } from "../../layers/layerModel";

export function migrateLayerOrderV1(input: {
  nodeIds: string[];
  drawOrder?: string[] | null;
}) {
  return normalizeDrawOrder(input.nodeIds, input.drawOrder);
}
