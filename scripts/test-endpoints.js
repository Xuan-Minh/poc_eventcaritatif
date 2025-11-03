// scripts/test-endpoints.js
// Simple test script to call POC endpoints locally.
// Usage: node scripts/test-endpoints.js

const base = process.env.BASE_URL || "http://localhost:3000";

async function run() {
  try {
    console.log("Checking", `${base}/api/twitch/auth`);
    const authResp = await fetch(`${base}/api/twitch/auth`, {
      redirect: "manual",
    });
    console.log(
      " /api/twitch/auth ->",
      authResp.status,
      "Location:",
      authResp.headers.get("location")
    );
  } catch (e) {
    console.error("Error calling /api/twitch/auth:", e.message);
  }

  try {
    console.log("\nPOST /api/twitch/token (empty body)");
    const tokenResp = await fetch(`${base}/api/twitch/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const tokenBody = await tokenResp.text();
    console.log(" status:", tokenResp.status);
    console.log(" body:", tokenBody);
  } catch (e) {
    console.error("Error calling /api/twitch/token:", e.message);
  }

  try {
    console.log("\nGET /api/twitch/user (no token)");
    const userResp = await fetch(`${base}/api/twitch/user`);
    const userBody = await userResp.text();
    console.log(" status:", userResp.status);
    console.log(" body:", userBody);
  } catch (e) {
    console.error("Error calling /api/twitch/user:", e.message);
  }
}

run();
