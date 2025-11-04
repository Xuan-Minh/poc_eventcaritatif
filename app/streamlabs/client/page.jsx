"use client";
import React, { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

export default function StreamlabsClientPage() {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [tokenVisible, setTokenVisible] = useState(false);
  const [serverToken, setServerToken] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const res = await fetch("/api/streamlabs/client-token");
        const json = await res.json();
        if (!mounted) return;
        if (!json.ok) {
          console.warn("no token available for client socket", json);
          return;
        }
        const token = json.access_token;
        setServerToken(token || null);
        // connect to Streamlabs sockets with token in auth (browser)
        // include both auth and query param 'access_token' — some Streamlabs setups expect it in the query
        const socket = io("https://sockets.streamlabs.com", {
          transports: ["websocket", "polling"],
          auth: { token },
          query: { access_token: token },
          reconnection: true,
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          setConnected(true);
        });
        socket.on("disconnect", () => {
          setConnected(false);
        });
        socket.on("event", (ev) => {
          // event is Streamlabs payload (donation, etc.)
          setEvents((s) => [ev, ...s].slice(0, 200));
        });
        socket.on("connect_error", (err) => {
          console.error("connect_error", err);
          setEvents((s) =>
            [
              {
                type: "error",
                message: String(err && err.message ? err.message : err),
              },
              ...s,
            ].slice(0, 200)
          );
        });
      } catch (err) {
        console.error("streamlabs client init error", err);
      }
    }
    init();
    return () => {
      mounted = false;
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Streamlabs live client (dev)</h2>
      <p>Status: {connected ? "connected ✅" : "disconnected"}</p>
      <div style={{ marginTop: 8 }}>
        <strong>Server token:</strong>
        {serverToken ? (
          <span style={{ marginLeft: 8 }}>
            <code style={{ fontSize: 12 }}>
              {tokenVisible
                ? serverToken
                : `${serverToken.slice(0, 20)}...${serverToken.slice(-10)}`}
            </code>
            <button
              style={{ marginLeft: 8 }}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(serverToken);
                } catch (e) {
                  console.warn("copy failed", e);
                }
              }}
            >
              Copier
            </button>
            <button
              style={{ marginLeft: 8 }}
              onClick={() => setTokenVisible((v) => !v)}
            >
              {tokenVisible ? "Masquer" : "Afficher"}
            </button>
          </span>
        ) : (
          <span style={{ marginLeft: 8, color: "#666" }}>
            no token available
          </span>
        )}
      </div>
      <div style={{ marginTop: 12 }}>
        <h3>Recent events</h3>
        {events.length === 0 && <div>No events yet.</div>}
        <ul>
          {events.map((ev, i) => (
            <li
              key={i}
              style={{
                marginBottom: 8,
                borderBottom: "1px solid #eee",
                paddingBottom: 6,
              }}
            >
              <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                {JSON.stringify(ev, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
