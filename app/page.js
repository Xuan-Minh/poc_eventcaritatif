"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

export default function Page() {
  const router = useRouter();
  const { register, handleSubmit } = useForm({
    defaultValues: { example: "" },
  });

  function onConnectTwitch() {
    // redirect to our API that triggers Twitch OAuth
    window.location.href = "/api/twitch/auth";
  }

  const onSubmit = (data) => {
    // Example handler — in a real app you'd save settings or call an API
    console.log("form submit", data);
    // small navigation example
    router.push("/");
  };

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1>battle4 — POC Twitch / Streamlabs</h1>

      <section style={{ marginTop: 20, display: "flex", gap: 12 }}>
        {/* Use anchor links as a progressive enhancement so redirect works without JS */}
        <a
          href="/api/twitch/auth"
          style={{
            display: "inline-block",
            padding: "10px 16px",
            fontSize: 16,
            background: "#6441a4",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 6,
          }}
        >
          Se connecter avec Twitch
        </a>

        <a
          href="/api/streamlabs/auth"
          style={{
            display: "inline-block",
            padding: "10px 16px",
            fontSize: 16,
            background: "#ff6b00",
            color: "#fff",
            textDecoration: "none",
            borderRadius: 6,
          }}
        >
          Se connecter avec Streamlabs
        </a>
      </section>

      <section style={{ marginTop: 28, maxWidth: 540 }}>
        <h3>Exemple: mini-formulaire</h3>
        <form onSubmit={handleSubmit(onSubmit)}>
          <label>
            Exemple:
            <input
              {...register("example")}
              placeholder="Valeur de test"
              style={{ marginLeft: 8 }}
            />
          </label>
          <div style={{ marginTop: 12 }}>
            <button type="submit">Envoyer</button>
          </div>
        </form>
      </section>
    </main>
  );
}
