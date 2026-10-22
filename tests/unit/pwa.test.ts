import { describe, it, expect } from "vitest";
import manifest from "@/app/manifest";
import fs from "fs";
import path from "path";

describe("PWA Manifest & Asset Integrity (Tiny 6a)", () => {
  it("provides a compliant web app manifest with Oxford Navy and Ivory colors", () => {
    const data = manifest();
    expect(data.name).toBe("Student Life & Campus Hub");
    expect(data.short_name).toBe("Campus Hub");
    expect(data.start_url).toBe("/");
    expect(data.display).toBe("standalone");
    expect(data.theme_color).toBe("#0B1D33");
    expect(data.background_color).toBe("#F8FAFC");
    expect(data.icons).toBeDefined();
    expect(data.icons?.length).toBeGreaterThanOrEqual(4);
  });

  it("includes required 192x192, 512x512 and maskable icons in manifest", () => {
    const data = manifest();
    const has192 = data.icons?.some((i) => i.sizes === "192x192" && i.purpose === "any");
    const has512 = data.icons?.some((i) => i.sizes === "512x512" && i.purpose === "any");
    const hasMaskable192 = data.icons?.some((i) => i.sizes === "192x192" && i.purpose === "maskable");
    const hasMaskable512 = data.icons?.some((i) => i.sizes === "512x512" && i.purpose === "maskable");

    expect(has192).toBe(true);
    expect(has512).toBe(true);
    expect(hasMaskable192).toBe(true);
    expect(hasMaskable512).toBe(true);
  });

  it("verifies physical existence of required icon files on disk", () => {
    const requiredFiles = [
      "public/manifest.json",
      "public/icons/icon-192x192.png",
      "public/icons/icon-512x512.png",
      "public/icons/icon-maskable-192x192.png",
      "public/icons/icon-maskable-512x512.png",
      "public/icons/apple-touch-icon-180x180.png",
      "public/apple-touch-icon.png",
    ];

    for (const relPath of requiredFiles) {
      const fullPath = path.join(process.cwd(), relPath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(0);
    }
  });

  it("verifies public/manifest.json matches spec exactly", () => {
    const manifestPath = path.join(process.cwd(), "public/manifest.json");
    const raw = fs.readFileSync(manifestPath, "utf-8");
    const json = JSON.parse(raw);

    expect(json.name).toBe("Student Life & Campus Hub");
    expect(json.short_name).toBe("Campus Hub");
    expect(json.display).toBe("standalone");
    expect(json.start_url).toBe("/");
    expect(json.theme_color).toBe("#0B1D33");
    expect(json.background_color).toBe("#F8FAFC");
  });

  describe("Service Worker & Offline Fallback (Tiny 6b)", () => {
    it("provides public/sw.js with offline-first static caching and precaching", () => {
      const swPath = path.join(process.cwd(), "public/sw.js");
      expect(fs.existsSync(swPath)).toBe(true);
      const swContent = fs.readFileSync(swPath, "utf-8");

      expect(swContent).toContain("PRECACHE_ASSETS");
      expect(swContent).toContain("/offline.html");
      expect(swContent).toContain("/_next/static/");
      expect(swContent).toContain("caches.open");
    });

    it("strictly forbids caching of authenticated and API data requests in public/sw.js", () => {
      const swPath = path.join(process.cwd(), "public/sw.js");
      const swContent = fs.readFileSync(swPath, "utf-8");

      expect(swContent).toContain("authorization");
      expect(swContent).toContain("if(!publicStatic");
      expect(swContent).not.toContain("cache.put(request, responseToCache)");
    });

    it("provides an offline fallback HTML page in Academic Navy & Gold", () => {
      const offlineHtmlPath = path.join(process.cwd(), "public/offline.html");
      expect(fs.existsSync(offlineHtmlPath)).toBe(true);
      const html = fs.readFileSync(offlineHtmlPath, "utf-8");

      expect(html).toContain("You&apos;re Currently Offline");
      expect(html).toContain("#0B1D33"); // Oxford Navy
      expect(html).toContain("#C59B27"); // Academic Gold
    });

    it("provides a dedicated Next.js /offline page component", () => {
      const offlinePagePath = path.join(process.cwd(), "app/offline/page.tsx");
      expect(fs.existsSync(offlinePagePath)).toBe(true);
    });
  });

  describe("PWA Install Banner & Installability UX (Tiny 6c)", () => {
    it("provides PwaInstallBanner component with 7-day dismissal cooldown and ARIA accessibility", () => {
      const bannerPath = path.join(process.cwd(), "components/pwa-install-banner.tsx");
      expect(fs.existsSync(bannerPath)).toBe(true);
      const content = fs.readFileSync(bannerPath, "utf-8");

      expect(content).toContain("campus_hub_install_dismissed");
      expect(content).toContain("beforeinstallprompt");
      expect(content).toContain("appinstalled");
      expect(content).toContain("display-mode: standalone");
      expect(content).toContain("role=\"region\"");
      expect(content).toContain("aria-label=\"App Installation Banner\"");
      expect(content).toContain("Install Campus Hub");
      expect(content).toContain("Add to Home Screen");
    });

    it("ensures root layout mounts PwaInstallBanner and service worker register", () => {
      const layoutPath = path.join(process.cwd(), "app/layout.tsx");
      const layoutContent = fs.readFileSync(layoutPath, "utf-8");

      expect(layoutContent).toContain("<PwaInstallBanner />");
      expect(layoutContent).toContain("<PwaRegister />");
      expect(layoutContent).toContain("apple-mobile-web-app-capable");
      expect(layoutContent).toContain("apple-touch-icon");
    });

    it("verifies full installability checklist criteria", () => {
      const manifestPath = path.join(process.cwd(), "public/manifest.json");
      const manifestJson = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

      // 1. Valid names
      expect(manifestJson.name).toBeTruthy();
      expect(manifestJson.short_name).toBeTruthy();

      // 2. Start URL & Display mode
      expect(manifestJson.start_url).toBe("/");
      expect(manifestJson.display).toBe("standalone");

      // 3. Icons (standard 192, 512 + maskable)
      const sizes = manifestJson.icons.map((i: { sizes: string }) => i.sizes);
      expect(sizes).toContain("192x192");
      expect(sizes).toContain("512x512");
      const hasMaskable = manifestJson.icons.some((i: { purpose?: string }) => i.purpose === "maskable");
      expect(hasMaskable).toBe(true);

      // 4. Color theme
      expect(manifestJson.theme_color).toBe("#0B1D33");
      expect(manifestJson.background_color).toBe("#F8FAFC");
    });
  });
});

