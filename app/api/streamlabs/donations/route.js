import { NextResponse } from "next/server";
import tokenStore from "../../../../lib/tokenStore.js";
import streamlabsClient from "../../../../lib/streamlabsClient.js";

export async function GET(request) {
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

  // support optional query params (limit, page, etc.)
  const url = new URL(request.url);
  const qs = new URLSearchParams(url.searchParams);
  if (!qs.has("access_token")) qs.set("access_token", tokenEntry.access_token);

  try {
    const resp = await fetch(
      `https://streamlabs.com/api/v1.0/donations?${qs.toString()}`
    );
    const data = await resp.json().catch(() => null);
    // If unauthorized, try refresh once and retry
    if (resp.status === 401 || (data && data.error === "access_denied")) {
      const refreshed = await streamlabsClient.refreshToken(clientId);
      if (refreshed.ok) {
        const newToken = await tokenStore.get("streamlabs", clientId);
        if (!qs.has("access_token"))
          qs.set("access_token", newToken.access_token);
        const retry = await fetch(
          `https://streamlabs.com/api/v1.0/donations?${qs.toString()}`
        );
        const retryData = await retry.json().catch(() => null);
        let totalRetry = null;
        if (Array.isArray(retryData))
          totalRetry = retryData.reduce(
            (s, d) => s + (Number(d.amount) || 0),
            0
          );
        return NextResponse.json(
          { raw: retryData, total: totalRetry },
          { status: retry.status || 200 }
        );
      }
    }
    // compute total amount (if data is array of donations)
    let total = null;
    if (Array.isArray(data)) {
      total = data.reduce((s, d) => s + (Number(d.amount) || 0), 0);
    }
    return NextResponse.json(
      { raw: data, total },
      { status: resp.status || 200 }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
