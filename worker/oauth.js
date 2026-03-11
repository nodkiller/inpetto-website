/**
 * Inpetto — Cloudflare Worker OAuth Proxy for Sveltia CMS
 *
 * ENVIRONMENT VARIABLES (set in Cloudflare Worker Settings → Variables):
 *  GITHUB_CLIENT_ID      → from your GitHub OAuth App
 *  GITHUB_CLIENT_SECRET  → from your GitHub OAuth App (store as Secret)
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ── /auth  →  redirect to GitHub OAuth ─────────────────────────
    if (url.pathname === '/auth') {
      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        scope:     'repo,user',
        state:     url.searchParams.get('state') || '',
      });
      return Response.redirect(
        `https://github.com/login/oauth/authorize?${params}`,
        302
      );
    }

    // ── /callback  →  exchange code for token ──────────────────────
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) return errorPage('Missing authorization code from GitHub.');

      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          client_id:     env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const tokenData = await tokenRes.json();
      if (tokenData.error || !tokenData.access_token) {
        return errorPage(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`);
      }

      const token    = tokenData.access_token;
      const provider = 'github';
      const msgString = `authorization:${provider}:success:` + JSON.stringify({ token, provider });

      // GitHub sets Cross-Origin-Opener-Policy headers which kill window.opener.
      // Strategy:
      //   1. Try postMessage via window.opener (normal path)
      //   2. If opener is null, redirect to same-origin bridge page that uses BroadcastChannel
      const fallbackUrl = `https://inpetto-website.pages.dev/admin/auth-callback.html?msg=${encodeURIComponent(msgString)}`;

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Inpetto CMS — Authenticating…</title>
  <style>
    body { margin: 0; display: flex; align-items: center; justify-content: center;
           min-height: 100vh; font-family: sans-serif; background: #0A0A0A; color: #F0F0EC; }
    p { opacity: .7; }
  </style>
</head>
<body>
  <p>Authentication successful — closing window…</p>
  <script>
    (function () {
      var msg      = ${JSON.stringify(msgString)};
      var fallback = ${JSON.stringify(fallbackUrl)};
      if (window.opener) {
        window.opener.postMessage(msg, '*');
        setTimeout(function () { window.close(); }, 500);
      } else {
        // GitHub COOP killed window.opener — use same-origin BroadcastChannel bridge
        window.location.replace(fallback);
      }
    })();
  </script>
</body>
</html>`;

      return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // ── root health check ───────────────────────────────────────────
    if (url.pathname === '/') {
      return new Response(
        JSON.stringify({ status: 'Inpetto CMS OAuth proxy is running' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Not found', { status: 404 });
  },
};

function errorPage(msg) {
  return new Response(`<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0A0A0A;color:#CFFF00;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0">
<h2>Auth Failed</h2><p style="color:#F0F0EC;opacity:.7">${msg}</p>
<script>setTimeout(function(){window.close()},3000)</script>
</body></html>`, { status: 400, headers: { 'Content-Type': 'text/html' } });
}
