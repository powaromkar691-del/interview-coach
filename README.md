# Interview Coach — AI-Powered Interview Preparation

Interview Coach is a full-stack preparation platform for students and early-career
candidates. This repair preserves the existing dashboard, onboarding, mock interviews,
interview evaluation and reports, interview history, resume analyzer, technical practice,
and personalized roadmap features.

## Technology

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Backend:** FastAPI, Pydantic, Motor
- **Database:** MongoDB; explicit in-memory mock mode is available for local evaluation
- **Authentication:** local email/password accounts, PBKDF2 password hashing, signed JWT sessions
- **AI:** optional Google Gemini integration with structured local fallback responses

## Local setup

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

For macOS/Linux, activate with `source .venv/bin/activate` and copy the environment
file with `cp .env.example .env`.

The example configuration uses in-memory MongoDB for local evaluation. Data in this
mode is lost when the backend process stops. For persistent storage, set `MONGO_URL`
to a reachable MongoDB connection string and configure `DB_NAME`. A configured MongoDB
connection will not silently fall back to memory if it is unavailable.

Set `JWT_SECRET_KEY` to a long random secret before deployment. The development-only
fallback is not suitable for production; the backend refuses to start in production
mode (`APP_ENV=production`) without an explicit secret. Optional Gemini support uses
`GEMINI_API_KEY` and `GEMINI_MODEL`. Without a Gemini key, the existing structured
fallback logic continues to support the AI feature workflows.

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000`. Vite proxies relative `/api` requests to the backend on
port `8001`.

## Validation

```bash
# From backend/
pytest -n 0

# From frontend/
npm run typecheck
npm run build
```

The supplied backend smoke tests expect a running API at `http://localhost:8001`.

## Deployment requirements

Deploy the frontend and backend separately or behind a same-origin reverse proxy. Set
`CORS_ORIGINS` to the exact frontend origin(s), use a persistent MongoDB deployment,
configure a strong `JWT_SECRET_KEY`, and provide `GEMINI_API_KEY` if live Gemini responses
are required. Never commit `.env` files or API credentials. Any credential that was
previously included in a shared archive must be rotated with its provider.

## Project documentation

- API contracts: [`docs/API.md`](docs/API.md)
- Team workflow: [`docs/TEAM.md`](docs/TEAM.md)
- Backend configuration: [`backend/.env.example`](backend/.env.example)


## Render + MongoDB Atlas deployment

See [`DEPLOY_RENDER_ATLAS.md`](DEPLOY_RENDER_ATLAS.md). A Render Blueprint is included at [`render.yaml`](render.yaml) to create the FastAPI API service and React static site. Configure the Atlas URI, API CORS origin, and frontend API URL in Render before making the site public.
