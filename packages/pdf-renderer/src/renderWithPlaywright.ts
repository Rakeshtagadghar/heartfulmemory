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

function getPageFormat(sizePreset: PdfRenderContract["pages"][number]["sizePreset"]) {
  switch (sizePreset) {
    case "A4":
      return "A4";
    case "US_LETTER":
      return "Letter";
    case "BOOK_6X9":
      return { width: "6in", height: "9in" };
    case "BOOK_8_5X11":
      return { width: "8.5in", height: "11in" };
    default:
      return "Letter";
  }
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
    const pdf = await page.pdf({
      format: typeof getPageFormat(firstPage?.sizePreset ?? "US_LETTER") === "string"
        ? (getPageFormat(firstPage?.sizePreset ?? "US_LETTER") as "A4" | "Letter")
        : undefined,
      width: typeof getPageFormat(firstPage?.sizePreset ?? "US_LETTER") === "object"
        ? (getPageFormat(firstPage?.sizePreset ?? "US_LETTER") as { width: string; height: string }).width
        : undefined,
      height: typeof getPageFormat(firstPage?.sizePreset ?? "US_LETTER") === "object"
        ? (getPageFormat(firstPage?.sizePreset ?? "US_LETTER") as { width: string; height: string }).height
        : undefined,
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
