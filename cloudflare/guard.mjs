// Only the trusted Worker binding selects this target's mode. Never inspect requests.
export function syntheticWorker(delegate) {
  return {
    async fetch(request, env, ctx) {
      if (env?.AFTERCLOSE_PREVIEW_MODE !== 'synthetic') {
        return new Response('Synthetic preview configuration required.', {
          status: 503,
          headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
        });
      }
      return delegate.fetch(request, env, ctx);
    },
  };
}
