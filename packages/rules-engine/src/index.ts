import type { PdfRenderContract } from "../../pdf-renderer/src/contracts";
import { validateDigitalExport } from "./targets/digital";
import { validateHardcopyExport } from "./targets/hardcopy";

export * from "./types";
export { validateDigitalExport, validateHardcopyExport };

export function validateExportContract(contract: PdfRenderContract) {
  return contract.exportTarget === "HARDCOPY_PRINT_PDF"
    ? validateHardcopyExport(contract)
    : validateDigitalExport(contract);
}

