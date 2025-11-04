import tokenStore from "./tokenStore.js";

const endpoints = [
  "https://streamlabs.com/api/v2.0/token",
  "https://streamlabs.com/api/v1.0/token",
];

async function postForm(url, params, headers = {}) {
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...headers,
    },
    body: new URLSearchParams(params),
  });
  let data = null;
  try {
    data = await resp.json();
  } catch (e) {
    data = null;
  }
  return { resp, data };
}

export async function refreshToken(clientId) {
  const clientSecret = process.env.STREAMLABS_CLIENT_SECRET;
  const redirectUri = process.env.STREAMLABS_REDIRECT_URI;
  if (!clientId || !clientSecret)
    return { ok: false, error: "missing_client_config" };

  const current = await tokenStore.get("streamlabs", clientId);
  if (!current || !current.refresh_token)
    return { ok: false, error: "no_refresh_token" };

  const params = {
    grant_type: "refresh_token",
    refresh_token: current.refresh_token,
    client_id: clientId,
    client_secret: clientSecret,
  };

  for (const ep of endpoints) {
    try {
      const { resp, data } = await postForm(ep, params);
      if (resp.ok && data) {
        // persist new tokens
        await tokenStore.save("streamlabs", clientId, data);
        return { ok: true, data };
      }
    } catch (e) {
      // continue
    }
  }

  // try Basic auth variant
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  for (const ep of endpoints) {
    try {
      const { resp, data } = await postForm(
        ep,
        { grant_type: "refresh_token", refresh_token: current.refresh_token },
        { Authorization: `Basic ${basic}` }
      );
      if (resp.ok && data) {
        await tokenStore.save("streamlabs", clientId, data);
        return { ok: true, data };
      }
    } catch (e) {}
  }

  return { ok: false, error: "refresh_failed" };
}

export default { refreshToken };
