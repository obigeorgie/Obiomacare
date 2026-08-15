import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler'
import { routeApi } from './api.js'

/**
 * The DEBUG flag will do two things:
 * 1. Output logs to the console
 * 2. Return detailed error messages in the response
 */
const DEBUG = false

addEventListener('fetch', event => {
  try {
    event.respondWith(handleEvent(event))
  } catch (e) {
    if (DEBUG) {
      return event.respondWith(
        new Response(e.message || e.toString(), {
          status: 500,
        }),
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

  /**
   * Redirects for retired app routes (Vercel app pages, now static site)
   */
  const redirects = {
    '/cases': '/case-engine.html',
    '/login': '/',
    '/readiness': '/case-engine.html',
    '/anatomy-lab': '/',
  }
  if (redirects[url.pathname]) {
    return Response.redirect(url.origin + redirects[url.pathname], 301)
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
