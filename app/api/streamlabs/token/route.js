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

  // Try v2 then v1 token endpoints, and fallback to Basic auth if needed
  const endpoints = [
    "https://streamlabs.com/api/v2.0/token",
    "https://streamlabs.com/api/v1.0/token",
  ];

  const params = {
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  };

  // helper to POST form and parse json
  async function postForm(url, bodyParams, headers = {}) {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...headers,
      },
      body: new URLSearchParams(bodyParams),
    });
    // try to parse json, otherwise capture raw text for debugging
    let data = null;
    let text = null;
    try {
      data = await resp.json();
    } catch (e) {
      try {
        text = await resp.text();
      } catch (e2) {
        text = null;
      }
    }
    return { resp, data, text };
  }

  let lastError = null;
  // 1) Try form POST to endpoints
  for (const ep of endpoints) {
    try {
      const { resp, data, text } = await postForm(ep, params);
      if (resp.ok && data) {
        try {
          await tokenStore.save("streamlabs", clientId, data);
        } catch (e) {
          return {
            status: 200,
            body: { success: true, data, warning: "Failed to persist tokens" },
          };
        }
        return { status: 200, body: { success: true, data } };
      }
      // capture last non-ok response for debugging
      lastError = { url: ep, status: resp.status, data, text };
      // If the provider returned invalid_client, we'll try Basic auth fallback below
    } catch (e) {
      lastError = { url: ep, error: String(e) };
    }
  }

  // 2) Fallback: try Basic Auth header with endpoints
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  for (const ep of endpoints) {
    try {
      const { resp, data, text } = await postForm(
        ep,
        { grant_type: "authorization_code", code, redirect_uri: redirectUri },
        { Authorization: `Basic ${basic}` }
      );
      if (resp.ok && data) {
        try {
          await tokenStore.save("streamlabs", clientId, data);
        } catch (e) {
          return {
            status: 200,
            body: { success: true, data, warning: "Failed to persist tokens" },
          };
        }
        return { status: 200, body: { success: true, data } };
      }
      lastError = { url: ep, status: resp.status, data, text };
    } catch (e) {
      lastError = { url: ep, error: String(e) };
    }
  }

  // If all attempts failed, return generic error with hint
  return {
    status: 400,
    body: {
      error: "token_exchange_failed",
      error_description:
        "All token exchange attempts failed. Verify client id/secret and registered redirect URI match exactly.",
      provider_last_error: lastError,
    },
  };
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
