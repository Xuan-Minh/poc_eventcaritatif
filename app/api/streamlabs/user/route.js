import { NextResponse } from "next/server";
import tokenStore from "../../../../lib/tokenStore.js";
import streamlabsClient from "../../../../lib/streamlabsClient.js";

export async function GET(request) {
  // Return Streamlabs user info using stored token
  const clientId = process.env.STREAMLABS_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "STREAMLABS_CLIENT_ID not configured" },
      { status: 500 }
    );
  }

  const tokenEntry = await tokenStore.get("streamlabs", clientId);
  if (!tokenEntry || !tokenEntry.access_token) {
    return NextResponse.json(
      { error: "No streamlabs token stored" },
      { status: 404 }
    );
  }

  try {
    const resp = await fetch(
      `https://streamlabs.com/api/v1.0/user?access_token=${encodeURIComponent(
        tokenEntry.access_token
      )}`
    );
    const data = await resp.json().catch(() => null);
    if (resp.status === 401 || (data && data.error === "access_denied")) {
      // try refresh once
      const refreshed = await streamlabsClient.refreshToken(clientId);
      if (refreshed.ok) {
        const newToken = await tokenStore.get("streamlabs", clientId);
        const retry = await fetch(
          `https://streamlabs.com/api/v1.0/user?access_token=${encodeURIComponent(
            newToken.access_token
          )}`
        );
        const retryData = await retry.json().catch(() => null);
        return NextResponse.json(retryData ?? { error: "invalid_response" }, {
          status: retry.status || 200,
        });
      }
    }

    return NextResponse.json(data ?? { error: "invalid_response" }, {
      status: resp.status || 200,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
