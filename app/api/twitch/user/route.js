import { NextResponse } from "next/server";

/**
 * GET /api/twitch/user
 * Requires Authorization: Bearer <access_token> OR ?access_token=...
 * Calls Twitch Helix /users
 */
export async function GET(request) {
  const url = new URL(request.url);
  const accessFromQuery = url.searchParams.get("access_token");
  let authHeader = request.headers.get("authorization");
  let accessToken = null;

  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    accessToken = authHeader.slice(7).trim();
  } else if (accessFromQuery) {
    accessToken = accessFromQuery;
  }

  if (!accessToken) {
    return NextResponse.json(
      {
        error:
          "Missing access token. Provide Authorization: Bearer <token> or ?access_token=",
      },
      { status: 400 }
    );
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "TWITCH_CLIENT_ID not configured" },
      { status: 500 }
    );
  }

  try {
    const resp = await fetch("https://api.twitch.tv/helix/users", {
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
