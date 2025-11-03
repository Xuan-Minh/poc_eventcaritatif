import { NextResponse } from "next/server";
import tokenStore from "../../../../lib/tokenStore.js";

/**
 * Streamlabs token exchange
 * Supports:
 *  - GET /api/streamlabs/token?code=...  (used when Streamlabs redirects the browser)
 *  - POST /api/streamlabs/token { code }
 */

async function doExchange(code) {
  const clientId = process.env.STREAMLABS_CLIENT_ID;
  const clientSecret = process.env.STREAMLABS_CLIENT_SECRET;
  const redirectUri = process.env.STREAMLABS_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return {
      status: 500,
      body: { error: "Streamlabs client config missing in env" },
    };
  }

  const tokenUrl = "https://streamlabs.com/api/v1.0/token";
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });

  try {
    const resp = await fetch(tokenUrl, { method: "POST", body: params });
    const data = await resp.json().catch(() => null);

    if (!resp.ok) {
      return {
        status: resp.status || 500,
        body: { error: "Streamlabs token exchange failed", details: data },
      };
    }

    // persist tokens
    try {
      await tokenStore.save("streamlabs", clientId, data);
    } catch (e) {
      return {
        status: 200,
        body: {
          success: true,
          data,
          warning: "Failed to persist tokens",
          persistError: String(e),
        },
      };
    }

    return { status: 200, body: { success: true, data } };
  } catch (err) {
    return {
      status: 500,
      body: { error: "Unexpected error", details: String(err) },
    };
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.json(
      { error: "Missing code in query" },
      { status: 400 }
    );
  }

  const result = await doExchange(code);
  // For GET (browser redirect), show a simple HTML response or JSON depending on accept
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body || !body.code)
    return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const result = await doExchange(body.code);
  return NextResponse.json(result.body, { status: result.status });
}
