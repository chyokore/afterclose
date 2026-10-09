# Submission preparation checklist

Official requirements checked October 9, 2026: [BNB Chain tokenized-stocks hackathon](https://www.bnbchain.org/en/hackathons/tokenized-stocks). Recheck before submission; no form was submitted by this task.

- Repository: https://github.com/chyokore/afterclose
- Reviewed release branch: https://github.com/chyokore/afterclose/tree/codex/cloudflare-live-integration
- Public demo: https://afterclose-preview.pages.dev/
- Scenario Lab: https://afterclose-preview.pages.dev/lab/#/lab/fresh-evidence
- Video URL: **OWNER TO ADD — recording not completed**. [Script](demo-script.md).
- Developer Experience Report: **OWNER TO WRITE/REVIEW**. [Evidence outline](developer-experience-evidence.md) is not a firsthand report.
- Deployment/test evidence: [release record](../deployment/public-live-release.md).
- Concise judge proof: [historical receipt, offline verifier and 12-case lab](proof-index.md).

## Project description

AfterClose is a read-only evidence-quality workbench for tokenized stocks. It displays Binance-backed Ondo NVDAon evidence on BNB Smart Chain, exposes missing independent reference and execution inputs, and produces reproducible WAIT/MONITOR/review decisions with SHA-256 receipts. Twelve separate fictional scenarios demonstrate stronger evidence states.

## Technical summary

Static Cloudflare Pages UI → public fixed-route Supabase Frankfurt gateway → server-only authenticated Binance Web3 RWA discovery, token price, underlying-market and chain metadata. The existing canonical Reference Truth Engine and receipt implementation are unchanged. Refresh is explicit; no browser credentials, polling, auto-retry, wallet or execution. Browser verification checks content hashes; the repository verifier reproduces engine results offline.

## Judge instructions

Open the demo, select Refresh Live Evidence once, inspect timestamps/PARTIAL/WAIT and blockers, expand the receipt, copy/verify/download it, then explore Scenario Lab. In an outage the live view says unavailable; the synthetic lab remains independent. Use the release branch for source and README because this task does not merge main.

## Owner actions before submission

- Confirm eligibility and track fit. The official main-track wording includes a Transaction API dry run and a small live amount; this read-only project implements neither. Ask the organizer whether it qualifies. No transaction is authorized by this checklist.
- Write the required firsthand Developer Experience Report; the official page says AI-generated reports are not accepted. AI-assisted project code is allowed.
- Provide a working demo or judge instructions and public source. Video is recommended/optional, at most four minutes.
- Confirm the published deadline (October 11, 2026 UTC+0), registration and final form fields on the official page.
- Review limitations, current live availability, report/video links and attribution before personally submitting or explicitly authorizing form submission.

Main-track eligibility and the owner's report are unresolved submission work, not evidence of a failed technical deployment.
