import { NextResponse } from "next/server";
import streamlabsClient from "../../../../lib/streamlabsClient.js";

export async function POST(request) {
  const clientId = process.env.STREAMLABS_CLIENT_ID;
  if (!clientId)
    return NextResponse.json(
      { error: "STREAMLABS_CLIENT_ID not configured" },
      { status: 500 }
    );

  const res = await streamlabsClient.refreshToken(clientId);
  if (res.ok)
    return NextResponse.json(
      { success: true, data: res.data },
      { status: 200 }
    );
  return NextResponse.json(
    { error: res.error || "refresh_failed" },
    { status: 400 }
  );
}
