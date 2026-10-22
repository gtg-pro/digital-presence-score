import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

import type { DigitalPresenceReport } from "@/features/report/types/report.types";
import { siteConfig } from "@/config/site";
import { escapeHtml } from "@/lib/report/export/export-validation";
import { PDF_THEME } from "@/lib/report/export/pdf-theme";

let cachedLogoDataUrl: string | null = null;
let cachedPoppinsFontFaceCss: string | null = null;
let cachedPoppinsBoldDataUrl: string | null = null;

function loadLogoDataUrl(): string {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  try {
    const logoPath = path.join(process.cwd(), "public", "images", "logo.png");
    const bytes = readFileSync(logoPath);
    cachedLogoDataUrl = `data:image/png;base64,${bytes.toString("base64")}`;
    return cachedLogoDataUrl;
  } catch {
    cachedLogoDataUrl = "";
    return "";
  }
}

function loadFontDataUrl(filename: string): string {
  const fontPath = path.join(process.cwd(), "public", "fonts", "poppins", filename);
  const bytes = readFileSync(fontPath);
  return `data:font/ttf;base64,${bytes.toString("base64")}`;
}

/** Full Poppins family for the first-page document header (in PDF body HTML). */
export function getPoppinsFontFaceCss(): string {
  if (cachedPoppinsFontFaceCss) return cachedPoppinsFontFaceCss;
  try {
    const regular = loadFontDataUrl("Poppins-Regular.ttf");
    const semiBold = loadFontDataUrl("Poppins-SemiBold.ttf");
    const bold = loadFontDataUrl("Poppins-Bold.ttf");
    cachedPoppinsFontFaceCss = `
@font-face {
  font-family: "Poppins";
  font-style: normal;
  font-weight: 400;
  src: url("${regular}") format("truetype");
}
@font-face {
  font-family: "Poppins";
  font-style: normal;
  font-weight: 600;
  src: url("${semiBold}") format("truetype");
}
@font-face {
  font-family: "Poppins";
  font-style: normal;
  font-weight: 700;
  src: url("${bold}") format("truetype");
}`;
  } catch {
    cachedPoppinsFontFaceCss = "";
  }
  return cachedPoppinsFontFaceCss;
}

/** Single bold face for Playwright footerTemplate (keeps template payload small). */
function getPoppinsBoldDataUrl(): string {
  if (cachedPoppinsBoldDataUrl !== null) return cachedPoppinsBoldDataUrl;
  try {
    cachedPoppinsBoldDataUrl = loadFontDataUrl("Poppins-Bold.ttf");
  } catch {
    cachedPoppinsBoldDataUrl = "";
  }
  return cachedPoppinsBoldDataUrl;
}

const POPPINS_STACK = '"Poppins", Helvetica, Arial, sans-serif';

/**
 * Date-only label for the GENERATED pill.
 * Strips clock times (e.g. "8:28 AM", "14:05:00") and timezone tokens.
 */
export function formatGeneratedLabel(auditDateLabel: string): string {
  const trimmed = auditDateLabel.trim();
  if (!trimmed) return "GENERATED";

  const dateOnly = trimmed
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?\b/g, "")
    .replace(/\b(?:UTC|GMT)(?:[+-]\d{1,4})?\b/gi, "")
    .replace(/\s*,\s*,+/g, ",")
    .replace(/\s+/g, " ")
    .replace(/^[\s,.—–-]+|[\s,.—–-]+$/g, "")
    .trim();

  return `GENERATED  ${(dateOnly || trimmed).toUpperCase()}`;
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}

/**
 * First-page-only report header matching the provided reference screenshot.
 */
export function buildPdfDocumentHeader(report: DigitalPresenceReport): string {
  const logo = loadLogoDataUrl();
  const brand = escapeHtml(siteConfig.name);
  const business = escapeHtml(truncate(report.businessName || "Business website", 48));
  const website = escapeHtml(
    truncate(report.website || "Website submitted for assessment", 56),
  );
  const websiteHref = report.website?.startsWith("http")
    ? escapeHtml(report.website)
    : report.website
      ? escapeHtml(`https://${report.website}`)
      : "#";
  const generated = escapeHtml(formatGeneratedLabel(report.auditDateLabel));

  // Logo asset already includes the wordmark; invert so it reads on black.
  const logoHtml = logo
    ? `<img src="${logo}" width="220" height="58" style="display:block;width:220px;height:58px;object-fit:contain;filter:brightness(0) invert(1);" />`
    : `<div style="font-family:${POPPINS_STACK};font-size:22px;font-weight:700;color:${PDF_THEME.white};letter-spacing:0.2px;line-height:1.1;">${brand}</div>`;

  return `
<header class="pdf-doc-header" style="width:100%;margin:0;padding:0;font-family:${POPPINS_STACK};-webkit-print-color-adjust:exact;print-color-adjust:exact;">
  <style>
    .pdf-doc-header a,
    .pdf-doc-header a:link,
    .pdf-doc-header a:visited {
      color: ${PDF_THEME.white} !important;
      -webkit-text-fill-color: ${PDF_THEME.white} !important;
      text-decoration: none !important;
    }
  </style>
  <div style="width:100%;box-sizing:border-box;background:${PDF_THEME.black};color:${PDF_THEME.white};position:relative;overflow:hidden;padding:26px 32px 24px;min-height:140px;">
    <!-- Center diagonal sky-blue bands (reference layout) -->
    <div style="position:absolute;left:46%;top:-40px;width:56px;height:220px;background:${PDF_THEME.sky};opacity:0.95;transform:skewX(-28deg);"></div>
    <div style="position:absolute;left:calc(46% + 42px);top:-40px;width:34px;height:220px;background:${PDF_THEME.skyBright};opacity:0.75;transform:skewX(-28deg);"></div>
    <div style="position:absolute;left:calc(46% + 72px);top:-40px;width:18px;height:220px;background:${PDF_THEME.sky};opacity:0.45;transform:skewX(-28deg);"></div>
    <div style="position:absolute;left:calc(46% + 108px);top:18px;width:10px;height:110px;background:${PDF_THEME.sky};transform:skewX(-28deg);"></div>

    <table style="width:100%;border-collapse:collapse;position:relative;z-index:1;">
      <tr>
        <td style="width:46%;vertical-align:middle;padding:0 24px 0 0;">
          ${logoHtml}
        </td>
        <td style="width:54%;vertical-align:middle;padding:0;text-align:right;">
          <div style="font-family:${POPPINS_STACK};font-size:11px;font-weight:600;color:${PDF_THEME.white};letter-spacing:2.4px;">WEBSITE AUDIT REPORT</div>
          <div style="font-family:${POPPINS_STACK};font-size:22px;font-weight:700;color:${PDF_THEME.white};margin-top:6px;line-height:1.15;">${business}</div>
          <div style="margin-top:6px;">
            <a href="${websiteHref}" style="font-family:${POPPINS_STACK};font-size:12px;font-weight:500;color:${PDF_THEME.white};-webkit-text-fill-color:${PDF_THEME.white};text-decoration:none;">${website}</a>
          </div>
          <div style="display:inline-block;margin-top:12px;border:1.5px solid ${PDF_THEME.sky};border-radius:999px;padding:6px 16px;">
            <span style="font-family:${POPPINS_STACK};font-size:10px;font-weight:700;color:${PDF_THEME.white};letter-spacing:1.1px;">${generated}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>
  <div style="height:3px;background:${PDF_THEME.sky};width:100%;"></div>
</header>`;
}

/** Blank Playwright headerTemplate — real header lives in the document body (page 1 only). */
export function buildPdfHeaderTemplate(): string {
  return `<div style="width:100%;margin:0;padding:0;font-size:10px;color:transparent;">&nbsp;</div>`;
}

/**
 * Chromium PDF footerTemplate matching the single-row white-on-black reference.
 */
export function buildPdfFooterTemplate(): string {
  const contact = PDF_THEME.contactUrl;
  const boldUrl = getPoppinsBoldDataUrl();
  const fontFace = boldUrl
    ? `@font-face{font-family:"Poppins";font-style:normal;font-weight:700;src:url("${boldUrl}") format("truetype");}`
    : "";

  return `
<div style="width:100%;margin:0 0 -20px 0;padding:0;font-size:10px;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-family:${POPPINS_STACK};">
  <style>
    ${fontFace}
    a, a:link, a:visited {
      color: ${PDF_THEME.white} !important;
      -webkit-text-fill-color: ${PDF_THEME.white} !important;
    }
  </style>
  <div style="height:1px;background:#333333;width:100%;"></div>
  <div style="width:100%;box-sizing:border-box;background:${PDF_THEME.black};color:${PDF_THEME.white};padding:16px 28px 18px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="vertical-align:middle;padding:0;white-space:nowrap;">
          <span style="font-family:${POPPINS_STACK};font-size:10px;font-weight:700;color:${PDF_THEME.white};letter-spacing:1.4px;">NEED HELP IMPROVING YOUR SCORE?</span>
          <a href="${contact}" style="display:inline-block;margin-left:28px;font-family:${POPPINS_STACK};font-size:10px;font-weight:700;color:${PDF_THEME.white};-webkit-text-fill-color:${PDF_THEME.white};text-decoration:none;letter-spacing:1.4px;">CONTACT US →</a>
          <a href="${contact}" style="display:inline-block;margin-left:18px;font-family:${POPPINS_STACK};font-size:10px;font-weight:600;color:${PDF_THEME.white};-webkit-text-fill-color:${PDF_THEME.white};text-decoration:underline;letter-spacing:0.4px;">${escapeHtml(contact)}</a>
        </td>
        <td style="vertical-align:middle;padding:0;text-align:right;white-space:nowrap;width:120px;">
          <span style="font-family:${POPPINS_STACK};font-size:10px;font-weight:700;color:${PDF_THEME.white};letter-spacing:1.4px;">PAGE <span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </td>
      </tr>
    </table>
  </div>
</div>`;
}
