# Errors and troubleshooting — September 26, 2026

## Subsequent credentialed attempt

With nonempty local credentials, platforms/search returned transport timeouts and tokens returned ENOTFOUND. Windows DNS lookup timed out; Node DNS also returned ENOTFOUND. No HTTP response or Binance authentication error was available. Added safe timing/error metadata instead of logging raw fetch errors. See [live verification](live-verification.md) for exact outcomes. A temporary platforms-only probe was consolidated into `npm run test:api -- --platforms-only`.

## Foundation history

Only observed errors are recorded here.

| Observation | Action/outcome |
| --- | --- |
| `git log` reported no commits on master | Expected for the empty local repository; preserved it. |
| Sandboxed Git HTTPS lookup failed with `SEC_E_NO_CREDENTIALS` | Retried with approved external access; repository lookup succeeded and returned no refs. This was not a Binance authentication failure. |
| Updating `.git/config` was denied in sandbox | Approved Git remote configuration succeeded. |
| npm metadata lookup failed with EPERM in the global cache | Used a project-local ignored npm cache for subsequent installation. |
| Installed Node version was 16.20.2 | Prepared a supported Node 24 runtime locally. |
| Documentation root inaccessible through the web reader | Read official authentication and RWA pages directly. |
| npm warned ESLint 9 is no longer supported | Retained the version selected by the current Next.js scaffold; record for a compatible upgrade. |

No live Binance authentication error has been observed because no credentials are configured. A passing signing unit test must not be described as successful provider authentication.

Additional validation observations:

- ESLint rejected the homepage anchor to `/`; replaced it with Next.js Link and lint passed.
- tsx initially failed before tests with `uv_os_get_passwd` / ENOMEM under the restricted Windows process. Tests ran after approved access.
- A synthetic provider-error test exposed required `data` parsing before provider-error classification. Made envelope data optional; success payloads still require endpoint schema validation. All tests passed.
- Initial build compiled and type-checked, then failed prerendering the framework global error page with an uninitialized workStore invariant. Explicit project root plus an approved rerun passed. The exact causal contribution of sandbox restrictions versus root resolution was not isolated.
- A preview opened before the server started returned connection refused. After starting the production server, a fresh localhost tab loaded successfully. The original browser error page could not be rebound because its internal data URL was blocked by browser policy.
- npm reported pending install-script approvals for unrs-resolver and esbuild. No broad approval was granted; lint, tests and build worked with the installed packages.
