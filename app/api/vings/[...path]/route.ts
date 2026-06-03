import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const VINGS_API_BASE = "https://external.vin.gs/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("vings_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { path } = await params;
  const apiPath = "/" + path.join("/");
  const url = new URL(apiPath, VINGS_API_BASE);

  // Forward query params
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Vings API error:", err);
    return NextResponse.json(
      { error: { code: "API_ERROR", message: "Failed to fetch from Vings API" } },
      { status: 500 }
    );
  }
}
