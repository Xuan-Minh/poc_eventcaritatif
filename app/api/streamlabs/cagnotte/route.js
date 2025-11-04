import { NextResponse } from "next/server";
import tokenStore from "../../../../lib/tokenStore.js";
import streamlabsClient from "../../../../lib/streamlabsClient.js";
import fs from "fs";
import path from "path";

export async function GET(request) {
  const clientId = process.env.STREAMLABS_CLIENT_ID;
  if (!clientId)
    return NextResponse.json(
      { error: "STREAMLABS_CLIENT_ID not configured" },
      { status: 500 }
    );

  const tokenEntry = await tokenStore.get("streamlabs", clientId);
  // Try donations API first
  if (tokenEntry && tokenEntry.access_token) {
    try {
      const resp = await fetch(
        `https://streamlabs.com/api/v1.0/donations?access_token=${encodeURIComponent(
          tokenEntry.access_token
        )}`
      );
      const data = await resp.json().catch(() => null);
      if (resp.ok && Array.isArray(data)) {
        const total = data.reduce((s, d) => s + (Number(d.amount) || 0), 0);
        return NextResponse.json(
          { source: "api", total, raw: data },
          { status: 200 }
        );
      }
      // if unauthorized, try refresh and retry once
      if (resp.status === 401 || (data && data.error === "access_denied")) {
        const refreshed = await streamlabsClient.refreshToken(clientId);
        if (refreshed.ok) {
          const newToken = await tokenStore.get("streamlabs", clientId);
          const retry = await fetch(
            `https://streamlabs.com/api/v1.0/donations?access_token=${encodeURIComponent(
              newToken.access_token
            )}`
          );
          const retryData = await retry.json().catch(() => null);
          if (retry.ok && Array.isArray(retryData)) {
            const total = retryData.reduce(
              (s, d) => s + (Number(d.amount) || 0),
              0
            );
            return NextResponse.json(
              { source: "api_after_refresh", total, raw: retryData },
              { status: 200 }
            );
          }
        }
      }
    } catch (e) {
      // fallthrough to events log
    }
  }

  // Fallback: aggregate from events log (if socket listener is running)
  try {
    const logFile = path.resolve(process.cwd(), "data/streamlabs-events.log");
    if (!fs.existsSync(logFile))
      return NextResponse.json({ source: "none", total: 0 }, { status: 200 });
    const lines = fs.readFileSync(logFile, "utf8").split(/\n+/).filter(Boolean);
    let total = 0;
    for (const l of lines) {
      try {
        const obj = JSON.parse(l);
        const payload = obj.payload || obj;
        if (payload && payload.type === "donation") {
          // donation payload shape may vary; try common fields
          const amt =
            Number(
              payload.amount ||
                payload.message?.amount ||
                payload.amount_usd ||
                0
            ) || 0;
          total += amt;
        }
      } catch (e) {
        // ignore malformed lines
      }
    }
    return NextResponse.json({ source: "events_log", total }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
