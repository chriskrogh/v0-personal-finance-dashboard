import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const VINGS_API_BASE = "https://external.vin.gs/api";

export async function GET(request: NextRequest) {
  console.log("[v0] /api/vings/transactions route hit");

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("vings_access_token")?.value;

  console.log("[v0] Access token exists:", !!accessToken);

  if (!accessToken) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const url = new URL(`${VINGS_API_BASE}/v1/transactions`);
  
  // Forward query params
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  console.log("[v0] Fetching:", url.toString());

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    console.log("[v0] Response status:", response.status);
    const data = await response.json();

    if (!response.ok) {
      console.log("[v0] Error response:", JSON.stringify(data));
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[v0] Fetch error:", err);
    return NextResponse.json(
      { error: { code: "API_ERROR", message: "Failed to fetch from Vings API" } },
      { status: 500 }
    );
  }
}
