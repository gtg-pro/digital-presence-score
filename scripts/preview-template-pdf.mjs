import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const pdfPath = path.resolve("docs/examples/audit_header_footer_template.pdf");
const outDir = path.resolve("docs/examples/pdf-template-preview");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 1270 } });
const fileUrl = pathToFileURL(pdfPath).href;
await page.goto(fileUrl, { waitUntil: "load", timeout: 30_000 });
await page.waitForTimeout(2500);
await page.screenshot({
  path: path.join(outDir, "template-page.png"),
  fullPage: true,
});
await browser.close();
console.log("wrote", path.join(outDir, "template-page.png"));
