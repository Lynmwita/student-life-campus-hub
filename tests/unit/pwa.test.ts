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
});
