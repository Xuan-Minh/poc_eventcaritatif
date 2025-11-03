import { NextResponse } from "next/server";

/**
 * GET /api/twitch/auth
 * Redirects the user to Twitch OAuth authorize URL.
 * Query params (optional): redirect_uri (override .env TWITCH_REDIRECT_URI)
 */
export async function GET(request) {
  const url = new URL(request.url);
  const redirectOverride = url.searchParams.get("redirect_uri");
  const clientId = process.env.TWITCH_CLIENT_ID;
  const redirectUri = redirectOverride || process.env.TWITCH_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "TWITCH_CLIENT_ID or TWITCH_REDIRECT_URI not configured" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "user:read:email",
  });

  const authUrl = `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}
