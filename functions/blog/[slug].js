// Cloudflare Pages Function: serve blog-post.html for /blog/:slug
export async function onRequest(context) {
  const url = new URL(context.request.url);
  url.pathname = '/blog-post.html';
  const asset = await context.env.ASSETS.fetch(url.toString());
  return new Response(asset.body, {
    status: asset.status,
    headers: {
      'content-type': 'text/html;charset=UTF-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  });
}
