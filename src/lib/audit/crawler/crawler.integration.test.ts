import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { crawlWebsite } from "@/lib/audit/crawler/crawler";
import { validatePublicCrawlUrl } from "@/lib/audit/crawler/url-validator";

const homeHtml = readFileSync(
  path.join(__dirname, "../test/fixtures/sample-home.html"),
  "utf8",
);

function startFixtureServer(): Promise<{ server: Server; origin: string }> {
  const server = createServer((req, res) => {
    const url = req.url ?? "/";

    if (url === "/robots.txt") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("User-agent: *\nAllow: /\nDisallow: /private\n");
      return;
    }

    if (url === "/sitemap.xml") {
      const host = req.headers.host ?? "127.0.0.1";
      res.writeHead(200, { "content-type": "application/xml" });
      res.end(`<?xml version="1.0"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
          <url><loc>http://${host}/</loc></url>
          <url><loc>http://${host}/services</loc></url>
          <url><loc>http://${host}/contact</loc></url>
          <url><loc>http://${host}/private</loc></url>
        </urlset>`);
      return;
    }

    if (url === "/private") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end("<html><body><h1>Secret</h1></body></html>");
      return;
    }

    if (url === "/services") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end(
        "<html><head><title>Services</title></head><body><main><h1>Services</h1><p>Drain cleaning</p><a href='/contact'>Contact</a></main></body></html>",
      );
      return;
    }

    if (url === "/contact") {
      res.writeHead(200, { "content-type": "text/html" });
      res.end(
        "<html><head><title>Contact</title></head><body><main><h1>Contact</h1><p>Email us</p><a href='mailto:hello@acme-plumbing.example'>Email</a></main></body></html>",
      );
      return;
    }

    if (url === "/" || url.startsWith("/?")) {
      res.writeHead(200, { "content-type": "text/html" });
      res.end(
        homeHtml.replace(
          /https:\/\/example\.com/g,
          `http://${req.headers.host}`,
        ),
      );
      return;
    }

    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  });

  return new Promise((resolve) => {
    // Bind to 127.0.0.1 explicitly — SSRF guard blocks this by design.
    // Integration test temporarily validates crawl against a public host mock
    // is impractical offline; instead we assert SSRF blocks loopback and
    // exercise crawl via unit extraction + robots separately.
    server.listen(0, "127.0.0.1", () => {
      const address = server.address() as AddressInfo;
      resolve({ server, origin: `http://127.0.0.1:${address.port}` });
    });
  });
}

describe("crawlWebsite security boundaries", () => {
  it("refuses to crawl loopback targets (SSRF)", async () => {
    const result = await crawlWebsite({
      url: "http://127.0.0.1:9/",
      maxPages: 2,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.code === "ssrf_blocked")).toBe(
      true,
    );
    expect(result.pages).toHaveLength(0);
  });

  it("refuses localhost hostnames before DNS", async () => {
    const result = await validatePublicCrawlUrl("http://localhost:3000");
    expect(result.ok).toBe(false);
  });
});

describe("fixture server availability (local only)", () => {
  let server: Server;
  let origin: string;

  beforeAll(async () => {
    ({ server, origin } = await startFixtureServer());
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("serves fixture HTML for offline review", async () => {
    // Confirms fixture server works; crawl itself must not target loopback.
    const response = await fetch(`${origin}/`);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Acme Plumbing");
  });
});
