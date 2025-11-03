import { NextResponse } from "next/server";
import tokenStore from "../../../../lib/tokenStore.js";

/**
 * POST /api/twitch/token
 * Body JSON: { code: string, redirect_uri?: string }
 * Exchanges code for tokens with Twitch. POC persists tokens to data/tokens.json.
 */
export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body || !body.code) {
    return NextResponse.json(
      { error: "Missing `code` in request body" },
      { status: 400 }
    );
  }

  const code = body.code;
  const redirectUri = body.redirect_uri || process.env.TWITCH_REDIRECT_URI;
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { error: "Twitch client config missing in env" },
      { status: 500 }
    );
  }

  const tokenUrl = "https://id.twitch.tv/oauth2/token";
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });

  try {
    const resp = await fetch(tokenUrl, { method: "POST", body: params });
    const data = await resp.json();

    if (!resp.ok) {
      return NextResponse.json(
        { error: "Twitch token exchange failed", details: data },
        { status: resp.status }
      );
    }

    // Persist tokens to file-based token store (POC)
    try {
      await tokenStore.save("twitch", clientId, data);
    } catch (e) {
      // If persistence fails, still return tokens but warn in response
      return NextResponse.json({
        success: true,
        data,
        warning: "Failed to persist tokens",
        persistError: String(e),
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { error: "Unexpected error", details: String(err) },
      { status: 500 }
    );
  }
}
