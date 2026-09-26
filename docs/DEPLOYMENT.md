# SKILLVERSE deployment

## Free hosted demo (Cloudflare Pages, Render, Supabase)

This option gives other people a browser URL without managing a VM. It is for
demo use: Render Free services sleep after inactivity, and Supabase Free
projects may pause after a week with low database activity. Render's free
Postgres expires after 30 days, so use Supabase for the database in this setup.

1. Push this project to a GitHub repository. Keep `.env` files, database dumps,
   and backup folders out of the repository.
2. Create a Supabase project. In **Connect**, select **Session pooler** and
   copy its host, port, username, and database name. Session mode is suitable
   for a long-running API on an IPv4-only host. Use port `5432` and require
   SSL. URL-encode reserved characters in the password.
3. In Render, create a **Web Service** from the repository. Set **Root
   Directory** to `backend`, choose Docker, and use `Dockerfile`. Set the
   health check path to `/api/health`. Add `DATABASE_URL` using the Supabase
   session-pooler connection URI, and `CORS_ORIGINS` to the exact Cloudflare
   Pages origin. The container honors Render's `PORT` setting.
4. In Cloudflare Pages, import the same repository. Set **Root Directory** to
   `frontend`, build command to `npm run build`, and output directory to `dist`.
   Add the build variable `VITE_API_BASE` with the full Render API URL ending
   in `/api` (for example `https://skillverse-api.onrender.com/api`).
5. Copy the resulting `https://<project>.pages.dev` URL into Render's
   `CORS_ORIGINS`, then redeploy the API. If the generated Render hostname
   differs from the example above, use the actual URL in `VITE_API_BASE` and
   trigger a new Pages deployment.
6. Seed the demo database once from this project, with `DATABASE_URL` set to
   the Supabase URI in your local shell:

   ```bash
   cd backend
   read -rsp 'Supabase database URL: ' DATABASE_URL; echo
   export DATABASE_URL
   PYTHONPATH=. ./.venv/bin/python -m scripts.seed_database
   unset DATABASE_URL
   ```

   The seed script inserts the curated demo data. Never run it against a
   database containing real operational records.

This prototype has no user authentication, and its API has write operations.
Anyone with the public link may be able to change shared demo data. Do not put
personal or confidential data in this public demo. Add authentication and
authorization before using it for real users or operational records.

This deployment uses Docker Compose, PostgreSQL, a non-root FastAPI container,
an Nginx container for the React app/API proxy, and Caddy for public HTTPS.
Only Caddy publishes ports; PostgreSQL, the API, and the web server remain on
the private Compose network.

## Requirements

- A Linux host or VM with Docker Engine and the Docker Compose plugin.
- A DNS name pointing to the host for HTTPS deployment.
- A DNS name pointing to the host, with inbound TCP ports 80 and 443 allowed.
- Inbound UDP 443 is optional and enables HTTP/3.

## First deployment

1. Copy the project to the server and enter its root directory.
2. Create the deployment environment file and set a unique database password:

   ```bash
   cp .env.production.example .env.production
   openssl rand -hex 32
   ```

   Put the generated value in `POSTGRES_PASSWORD`. Set `SITE_ADDRESS` to the
   DNS name and `CORS_ORIGINS` to its exact HTTPS origin. Leave
   `GEMINI_API_KEY` empty to use deterministic fallback explanations, or put a
   server-side Gemini key there. Never put secrets in frontend variables or
   commit `.env.production`.

3. Point the DNS A/AAAA records for `SITE_ADDRESS` to the server. Open inbound
   TCP 80 and 443 in the host and cloud firewalls. Compose starts Caddy, which
   obtains and renews HTTPS certificates automatically. Keep ports 8000, 8080,
   and 5432 closed to the public internet.

4. Build and start the stack:

   ```bash
   docker compose --env-file .env.production -f compose.production.yml up -d --build
   docker compose --env-file .env.production -f compose.production.yml ps
   ```

5. Check the externally served health endpoint:

   ```bash
   curl --fail https://skills.example.org/api/health
   ```

   It should return JSON with `status: ok` and `database: connected`.

6. For a demonstration instance only, seed the curated EV sample data once:

   ```bash
   docker compose --env-file .env.production -f compose.production.yml \
     exec api python -m scripts.seed_database
   ```

   Do not run the demo seed against a database containing real operational
   data. The app otherwise starts with an empty database.

## Updates and operations

```bash
# View service logs
docker compose --env-file .env.production -f compose.production.yml logs -f

# Rebuild and roll forward after updating the source
docker compose --env-file .env.production -f compose.production.yml up -d --build

# Back up PostgreSQL to a file on the host
docker compose --env-file .env.production -f compose.production.yml \
  exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' \
  > "skillverse-$(date +%F).dump"
```

The named `skillverse_data` volume stores PostgreSQL data. `docker compose down`
keeps it; `docker compose down -v` deletes it. Keep encrypted backups outside
the server and practice restoring them before relying on the deployment.

## Network and security settings

- Only the Caddy container publishes host ports. PostgreSQL, the API, and the
  web container stay on the internal Compose network.
- The API and frontend do not implement user authentication or per-user access
  control. Treat this as a restricted pilot: protect it with a VPN, an
  identity-aware gateway, or add application authentication before allowing
  general public access. HTTPS alone does not provide authorization.
- The API creates missing tables on startup with SQLAlchemy `create_all`; it
  does not yet have versioned schema migrations. Back up before model/schema
  changes and add Alembic migrations before maintaining a long-lived production
  database.
- Set `CORS_ORIGINS` only to trusted browser origins if cross-origin API access
  is needed. The default frontend uses same-origin `/api` requests.
- Keep Docker, the host OS, and base images patched; restrict SSH; monitor disk
  space for PostgreSQL and backups.

## Deployment checks

Run the project checks before building the server images:

```bash
(cd backend && PYTHONPATH=. python -m pytest -q)
(cd frontend && npm ci && npm run smoke:pages && npm run build)
```

Validate Compose interpolation without starting services by providing a real
local `.env.production` first:

```bash
docker compose --env-file .env.production -f compose.production.yml config
```
