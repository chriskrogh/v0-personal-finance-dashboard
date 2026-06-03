import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

const VINGS_API_BASE = "https://external.vin.gs/api";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("vings_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const url = `${VINGS_API_BASE}/v1/me`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error("[api] /vings/me error:", response.status);
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    logger.error("[api] /vings/me fetch error:", err);
    return NextResponse.json(
      { error: { code: "API_ERROR", message: "Failed to fetch from Vings API" } },
      { status: 500 }
    );
  }
}
