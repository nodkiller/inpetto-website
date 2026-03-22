// Cloudflare Pages Function: serve work-detail.html for /works/:slug
export async function onRequest(context) {
  const url = new URL(context.request.url);
  url.pathname = '/work-detail.html';
  const asset = await context.env.ASSETS.fetch(new Request(url, context.request));
  return new Response(asset.body, {
    status: 200,
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
}
