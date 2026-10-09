// Defence in depth around the unchanged Binance client. All budgets are
// per-isolate; this deliberately makes no global rate-limit guarantee.
const paths = new Set(['platforms', 'tokens', 'search', 'price', 'underlying-market'].map(p => '/build/api/v1/dex/market/rwa/' + p).concat('/build/api/v1/dex/aggregator/supported/chain'));
export function createSupabaseTransport(outbound: typeof fetch, region: () => string | undefined, clock = Date.now) {
  let windowStart = clock(), binance = 0, issuer = 0, blockedUntil = 0, totalBinance = 0;
  const retryAfterMs = () => Math.max(0, blockedUntil - clock());
  const transport: typeof fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const isBinance = url.origin === 'https://web3.binance.com' && paths.has(url.pathname);
    const isIssuer = url.href === 'https://app.ondo.finance/assets/nvdaon';
    if (region() !== 'eu-central-1' || (!isBinance && !isIssuer) || url.username || url.password || init?.redirect !== 'error' || (init.method ?? 'GET') !== 'GET') throw Error('OUTBOUND_NOT_ALLOWED');
    const now = clock();
    if (now - windowStart >= 30_000) { windowStart = now; binance = 0; issuer = 0; }
    // Backwards clock movement cannot release an existing budget/cooldown.
    if (isBinance && (now < blockedUntil || binance >= 6) || isIssuer && issuer >= 1) throw Error('OUTBOUND_COOLDOWN');
    if (isBinance) { binance++; totalBinance++; } else issuer++;
    const response = await outbound(input, init);
    if (isBinance) {
      const raw = response.headers.get('Retry-After');
      const seconds = raw !== null && /^\d+$/.test(raw.trim()) ? Number(raw) : NaN;
      const until = Number.isFinite(seconds) ? clock() + seconds * 1000 : raw ? Date.parse(raw) : NaN;
      if (Number.isFinite(until) && until > clock()) blockedUntil = Math.max(blockedUntil, until);
      if (response.status === 429) blockedUntil = Math.max(blockedUntil, clock() + 60_000);
    }
    return response;
  };
  return { fetch: transport, retryAfterMs, binanceCalls: () => totalBinance };
}
