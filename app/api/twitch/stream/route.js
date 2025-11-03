import { NextResponse } from "next/server";

/**
 * GET /api/twitch/stream
 * Query: user_login or user_id or ?access_token=...
 */
export async function GET(request) {
  const url = new URL(request.url);
  const accessFromQuery = url.searchParams.get("access_token");
  const userLogin = url.searchParams.get("user_login");
  const userId = url.searchParams.get("user_id");
  let authHeader = request.headers.get("authorization");
  let accessToken = null;

  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    accessToken = authHeader.slice(7).trim();
  } else if (accessFromQuery) {
    accessToken = accessFromQuery;
  }

  if (!accessToken) {
    return NextResponse.json(
      { error: "Missing access token" },
      { status: 400 }
    );
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId)
    return NextResponse.json(
      { error: "TWITCH_CLIENT_ID missing" },
      { status: 500 }
    );

  const params = new URLSearchParams();
  if (userId) params.set("user_id", userId);
  if (userLogin) params.set("user_login", userLogin);

  const urlHelix = `https://api.twitch.tv/helix/streams?${params.toString()}`;

  try {
    const resp = await fetch(urlHelix, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": clientId,
      },
    });
    const data = await resp.json();
    return NextResponse.json({ ok: resp.ok, status: resp.status, data });
  } catch (err) {
    return NextResponse.json(
      { error: "Unexpected error", details: String(err) },
      { status: 500 }
    );
  }
}
