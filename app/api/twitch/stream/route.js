import { NextResponse } from "next/server";
import tokenStore from "../../../../lib/tokenStore.js";

export async function GET(request) {
  const url = new URL(request.url);
  const login = url.searchParams.get("login");
  const userId = url.searchParams.get("user_id");

  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "TWITCH_CLIENT_ID not configured" }, { status: 500 });

  const tokenEntry = await tokenStore.get("twitch", clientId);
  if (!tokenEntry || !tokenEntry.access_token) {
    return NextResponse.json({ error: "No twitch token stored" }, { status: 404 });
  }

  const params = new URLSearchParams();
  if (login) params.set("user_login", login);
  if (userId) params.set("user_id", userId);
  const urlApi = `https://api.twitch.tv/helix/streams?${params.toString()}`;

  try {
    const resp = await fetch(urlApi, {
      headers: {
        "Client-Id": clientId,
        Authorization: `Bearer ${tokenEntry.access_token}`,
      },
    });
    const data = await resp.json().catch(() => null);
    return NextResponse.json(data ?? { error: "invalid_response" }, { status: resp.status || 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
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
