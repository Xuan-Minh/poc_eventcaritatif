import { NextResponse } from "next/server";

export async function GET(request) {
  const url = new URL(request.url);
  const redirectOverride = url.searchParams.get("redirect_uri");
  const clientId = process.env.STREAMLABS_CLIENT_ID;
  const redirectUri = redirectOverride || process.env.STREAMLABS_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        error: "STREAMLABS_CLIENT_ID or STREAMLABS_REDIRECT_URI not configured",
      },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
  });

  const authUrl = `https://streamlabs.com/api/v1.0/authorize?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}
