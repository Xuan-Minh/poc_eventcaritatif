import { NextResponse } from "next/server";
import tokenStore from "../../../../lib/tokenStore";

// Dev-only endpoint: returns the stored Streamlabs access token for the first client entry.
// WARNING: This is intentionally simple for the POC. Do NOT expose in production.
export async function GET() {
  try {
    const list = await tokenStore.list("streamlabs");
    const keys = Object.keys(list || {});
    if (!keys.length)
      return NextResponse.json(
        { ok: false, error: "no_tokens" },
        { status: 404 }
      );
    const first = list[keys[0]];
    const token = first && first.access_token;
    if (!token)
      return NextResponse.json(
        { ok: false, error: "no_access_token" },
        { status: 404 }
      );
    return NextResponse.json({ ok: true, access_token: token });
  } catch (err) {
    console.error("client-token GET error", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
