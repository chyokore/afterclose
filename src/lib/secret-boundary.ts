import "server-only";
// Refuse reflected credentials even if a provider puts them in an otherwise allowed field.
export function containsCredentialValue(value:unknown) {
  const text=JSON.stringify(value);
  return [process.env.BINANCE_API_KEY,process.env.BINANCE_SECRET_KEY].some(v=>v && v.length>=8 && text.includes(v));
}
