import { createHash } from "node:crypto";
import path from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss(), productionHeaders()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Libraries in their own chunks, so a game update doesn't re-download them
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "react";
          if (/node_modules\/@supabase\//.test(id)) return "supabase";
          if (/node_modules\/(radix-ui|@radix-ui)\//.test(id)) return "radix";
        },
      },
    },
  },
});

/**
 * Builds only: refuses to build without the Supabase settings, and writes dist/_headers
 * (security headers and caching) for Cloudflare. The content security policy lets the page
 * talk only to its own Supabase project, and run only its own scripts plus the inline
 * theme script in index.html, allowed by its hash.
 */
function productionHeaders(): Plugin {
  let supabase = "";

  return {
    name: "fraudopoly:production-headers",
    apply: "build",
    enforce: "post",
    configResolved(config) {
      const env = loadEnv(config.mode, config.envDir || process.cwd(), "VITE_");
      if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
        throw new Error(
          "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set (in .env.local or .env.production) to build",
        );
      }
      supabase = new URL(env.VITE_SUPABASE_URL).origin;
    },
    generateBundle(_, bundle) {
      const html = bundle["index.html"];
      if (!html || html.type !== "asset") throw new Error("index.html is missing from the build");
      const inline = [...String(html.source).matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
        ([, code]) => `'sha256-${createHash("sha256").update(code).digest("base64")}'`,
      );

      const policy = [
        "default-src 'self'",
        `script-src 'self' ${inline.join(" ")}`,
        // React and the card colors set inline styles
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self'",
        `connect-src 'self' ${supabase} ${supabase.replace(/^https:/, "wss:")}`,
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join("; ");

      this.emitFile({
        type: "asset",
        fileName: "_headers",
        source: [
          "/*",
          `  Content-Security-Policy: ${policy}`,
          "  X-Content-Type-Options: nosniff",
          "  X-Frame-Options: DENY",
          "  Referrer-Policy: strict-origin-when-cross-origin",
          "  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()",
          "  Strict-Transport-Security: max-age=31536000; includeSubDomains",
          "",
          // File names carry a hash of their content, so they never change in place
          "/assets/*",
          "  Cache-Control: public, max-age=31536000, immutable",
          "",
        ].join("\n"),
      });
    },
  };
}
