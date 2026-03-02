import type { Browser } from "playwright";
import { chromium } from "playwright";
import type { PdfRenderContract, PdfRenderOutput } from "./contracts";
import { buildHtmlDocument } from "./templates/document.html";
import { estimateOverflowWarnings } from "./overflowDetector";
import { hardcopyPdfTargetConfig } from "./targets/hardcopy";
import { digitalPdfTargetConfig } from "./targets/digital";
import type { PdfDebugOverlayOptions } from "../../pdf/debug/debugOverlays";

let browserPromise: Promise<Browser> | null = null;

function shouldUseServerlessChromium() {
  return process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined || process.env.AWS_REGION !== undefined;
}

async function launchBrowser() {
  if (!shouldUseServerlessChromium()) {
    return chromium.launch({ headless: true });
  }

  try {
    const chromiumModule = (await import("@sparticuz/chromium")) as {
      default: {
        args: string[];
        executablePath: (input?: string) => Promise<string>;
        headless?: boolean | "shell";
      };
    };
    const serverlessChromium = chromiumModule.default;
    const executablePath = await serverlessChromium.executablePath();

    return chromium.launch({
      headless: true,
      executablePath,
      args: serverlessChromium.args
    });
  } catch (error) {
    // Fall back to Playwright-managed browser locally or if serverless chromium is unavailable.
    if (process.env.NODE_ENV !== "production") {
      return chromium.launch({ headless: true });
    }
    throw error;
  }
}

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = launchBrowser();
  }
  return browserPromise;
}

const PRESET_SIZES_IN: Record<string, { width: string; height: string }> = {
  A4:          { width: "8.27in", height: "11.69in" },
  US_LETTER:   { width: "8.5in",  height: "11in" },
  BOOK_6X9:    { width: "6in",    height: "9in" },
  BOOK_8_5X11: { width: "8.5in",  height: "11in" }
};

function getPageFormat(
  sizePreset: PdfRenderContract["pages"][number]["sizePreset"],
  isLandscape: boolean
): { width: string; height: string } {
  const size = PRESET_SIZES_IN[sizePreset] ?? PRESET_SIZES_IN.US_LETTER;
  return isLandscape
    ? { width: size.height, height: size.width }
    : size;
}

export async function renderWithPlaywright(
  contract: PdfRenderContract,
  exportHash: string,
  options?: {
    debug?: PdfDebugOverlayOptions;
  }
): Promise<PdfRenderOutput> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    const doc = buildHtmlDocument(contract, { debug: options?.debug });
    const overflowWarnings = estimateOverflowWarnings(contract);
    const targetConfig =
      contract.exportTarget === "HARDCOPY_PRINT_PDF" ? hardcopyPdfTargetConfig : digitalPdfTargetConfig;

    await page.setContent(doc.html, { waitUntil: "networkidle" });
    const firstPage = contract.pages.slice().sort((a, b) => a.orderIndex - b.orderIndex)[0];
    const isLandscape = firstPage ? firstPage.widthPx > firstPage.heightPx : false;
    const pageFormat = getPageFormat(firstPage?.sizePreset ?? "US_LETTER", isLandscape);
    const pdf = await page.pdf({
      width: pageFormat.width,
      height: pageFormat.height,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      printBackground: targetConfig.printBackground,
      preferCSSPageSize: false,
      scale: targetConfig.pdfScale
    });

    return {
      pdf,
      meta: {
        pageCount: contract.pages.length,
        exportHash,
        warnings: [...doc.warnings, ...overflowWarnings]
      }
    };
  } finally {
    await page.close();
  }
}
