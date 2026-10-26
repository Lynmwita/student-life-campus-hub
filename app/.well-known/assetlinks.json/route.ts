import { NextResponse } from "next/server";
import assetLinks from "@/public/.well-known/assetlinks.json";

export async function GET() {
  return NextResponse.json(assetLinks, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
