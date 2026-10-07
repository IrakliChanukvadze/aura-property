# Production inputs

Aura is still local; copying inventory is not deployment. Use a separate Aura database/user and separate app processes/container ports if sharing a DigitalOcean host with Pini. Do not point Aura migrations at Pini's database. Confirm host capacity and backups before deployment.

Required inputs: chosen domain; DigitalOcean SSH/host access (this laptop now authorized); Aura PostgreSQL connection; invitation/recovery email provider; SMS OTP provider; private storage; current/historical FX source or maintained manual rates; reviewed translations and privacy/contact copy.

Cloudflare DNS can be configured through the dashboard. Automated DNS updates need a token restricted to the Aura zone with DNS Edit, not the global API key: https://developers.cloudflare.com/fundamentals/api/reference/permissions/ . R2 needs account ID, bucket, scoped object read/write access key ID and secret: https://developers.cloudflare.com/r2/api/tokens/ . Store secrets in protected deployment environment files or secret manager, never in Git/chat/public NEXT_PUBLIC/VITE variables.

Tbilisi Boulevard has now been copied into Aura independently. Missing Hebrew text, source price/area/annotation gaps and authoritative discount minimums need review before sales launch. Private agreements stay in private storage. Production DEV_INTEGRATIONS must remain false.
