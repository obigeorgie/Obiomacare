import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler'
import { routeApi } from './api.js'
import { routeAdmin } from './api-events.js'

const DEBUG = false

addEventListener('fetch', event => {
  try {
    event.respondWith(handleEvent(event))
  } catch (e) {
    if (DEBUG) {
      return event.respondWith(
        new Response(e.message || e.toString(), { status: 500 }),
      )
    }
    event.respondWith(new Response('Internal Error', { status: 500 }))
  }
})

async function handleEvent(event) {
  const url = new URL(event.request.url)
  let options = {}

  /**
   * API routes — handled before static assets
   */
  if (url.pathname.startsWith('/api/')) {
    const apiResponse = await routeApi(event.request, event.env || {})
    if (apiResponse) return apiResponse
  }

  // Private operator dashboard (Revenue OS Phase 1)
  if (url.pathname === '/admin') {
    return await routeAdmin(event.request, event.env || {})
  }

  /**
   * Redirects for retired app routes (Vercel app pages, now static site)
   */
  const redirects = {
    '/cases': '/case-engine.html',
    '/anatomy-lab': '/',
    '/readiness/': '/readiness.html',
    '/institutional': '/instructor-dashboard.html',
  }
  if (redirects[url.pathname]) {
    return Response.redirect(url.origin + redirects[url.pathname], 301)
  }

  /**
   * Media assets — served from R2 bucket
   */
  if (url.pathname.startsWith('/media/')) {
    try {
      const objectKey = url.pathname.slice(7) // Remove '/media/' prefix
      const bucket = (event.env && event.env.MEDIA_BUCKET) || globalThis.MEDIA_BUCKET || self.MEDIA_BUCKET
      if (!bucket) {
        return new Response('R2 bucket not bound', { status: 500 })
      }
      const object = await bucket.get(objectKey)
      if (object) {
        const headers = new Headers()
        object.writeHttpMetadata(headers)
        headers.set('etag', object.httpEtag)
        headers.set('Cache-Control', 'public, max-age=31536000, immutable')
        headers.set('X-Content-Type-Options', 'nosniff')
        return new Response(object.body, { headers })
      }
      return new Response('Not Found: ' + objectKey, { status: 404 })
    } catch (e) {
      return new Response('Error: ' + (e.message || e.toString()), { status: 500 })
    }
  }

  /**
   * mapRequestToAsset serves a default asset when the route is "/"
   */
  options.mapRequestToAsset = req => {
    // Serve index.html for root path
    if (url.pathname === '/') {
      return mapRequestToAsset(new Request(`${url.origin}/index.html`, req))
    }
    // Serve directory index.html for trailing-slash paths
    if (url.pathname.endsWith('/')) {
      return mapRequestToAsset(new Request(`${url.origin}${url.pathname}index.html`, req))
    }
    // Try with .html extension for clean URLs
    if (!url.pathname.includes('.')) {
      return mapRequestToAsset(new Request(`${url.origin}${url.pathname}.html`, req))
    }
    return mapRequestToAsset(req)
  }

  try {
    const page = await getAssetFromKV(event, options)
    
    // Allow CORS for assets
    const response = new Response(page.body, page)
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    return response
  } catch (e) {
    // Fallthrough, look for 404.html
    if (e.status === 404) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/404.html`, req),
        })
        return new Response(notFoundResponse.body, { ...notFoundResponse, status: 404 })
      } catch (e) {}
    }
    return new Response(e.message || e.toString(), { status: e.status || 500 })
  }
}
