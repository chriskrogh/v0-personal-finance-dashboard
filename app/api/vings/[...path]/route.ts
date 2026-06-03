import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const VINGS_API_BASE = "https://external.vin.gs/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  console.log("[v0] Vings API proxy route hit");
  console.log("[v0] Request URL:", request.url);
  
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("vings_access_token")?.value;

  console.log("[v0] Access token exists:", !!accessToken);

  if (!accessToken) {
    console.log("[v0] No access token, returning 401");
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { path } = await params;
  console.log("[v0] Path segments:", path);
  
  const apiPath = "/" + path.join("/");
  const url = new URL(apiPath, VINGS_API_BASE);

  // Forward query params
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  console.log("[v0] Proxying to:", url.toString());

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    console.log("[v0] Vings API response status:", response.status);

    const data = await response.json();
    console.log("[v0] Vings API response data keys:", Object.keys(data));

    if (!response.ok) {
      console.log("[v0] Vings API error response:", JSON.stringify(data));
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[v0] Vings API fetch error:", err);
    return NextResponse.json(
      { error: { code: "API_ERROR", message: "Failed to fetch from Vings API" } },
      { status: 500 }
    );
  }
}

// Also export POST, PUT, DELETE for completeness
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  console.log("[v0] Vings API proxy POST route hit");
  return handleMutationRequest(request, params, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  console.log("[v0] Vings API proxy PUT route hit");
  return handleMutationRequest(request, params, "PUT");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  console.log("[v0] Vings API proxy DELETE route hit");
  return handleMutationRequest(request, params, "DELETE");
}

async function handleMutationRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }>,
  method: string
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

  try {
    const body = await request.text();
    const response = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: body || undefined,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    console.error("[v0] Vings API error:", err);
    return NextResponse.json(
      { error: { code: "API_ERROR", message: "Failed to fetch from Vings API" } },
      { status: 500 }
    );
  }
}
