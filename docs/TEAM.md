# Team split, branching, and workflow

## Module ownership (four members)

| Member | Area | Owns |
|---|---|---|
| 1 — Frontend | `frontend/src/pages/*`, `frontend/src/components/*` | Landing, auth screens, onboarding wizard, dashboard, responsive UI; consumes `src/lib/api.ts` |
| 2 — AI Engineer | `backend/lib/llm.py`, `backend/routers/interviews.py`, prompts | Question generation, answer evaluation, follow-ups, report generation, prompt quality |
| 3 — Backend Engineer | `backend/server.py`, `backend/clerk_auth.py`, `backend/routers/users.py`, `backend/routers/dashboard.py`, `backend/lib/db.py` | Auth wiring, API contracts, Mongo indexes, session history, dashboard aggregation |
| 4 — Resume & Prep Engineer | `backend/routers/resumes.py`, `backend/routers/quizzes.py`, `backend/routers/roadmap.py`, `backend/lib/content.py` | PDF/DOCX extraction, quiz bank, roadmap generation, progress reports |

Shared contracts (change together, in one PR):
- Backend models: `backend/models/*.py`
- Frontend mirrors: `frontend/src/lib/types.ts` — **keep in sync with the Pydantic models in the same edit**
- Typed fetch layer: `frontend/src/lib/api.ts`

## Branching

```bash
main            # always deployable; PRs only, no direct pushes
develop         # integration branch (optional)
feat/<member>-<feature>   # e.g. feat/ai-followups, feat/resume-jd-match, feat/ui-roadmap
fix/<issue>
```

- Each member branches from `main` (or `develop`), opens a PR, and a second member reviews.
- Contract changes (models + types) get a dedicated PR reviewed by both sides of the boundary.
- CI suggestion: `cd frontend && yarn typecheck` + `cd backend && pytest` on every PR.
- Pushing to GitHub:

```bash
git remote add origin git@github.com:<org>/interview-coach.git
git push -u origin main
git checkout -b feat/member1-dashboard && git push -u origin feat/member1-dashboard
```

## Deployment notes

- Frontend: static Vite build served by the platform preview CDN; any static host works
  (`cd frontend && yarn build && yarn preview` to check locally).
- Backend: deploy the FastAPI app behind the same origin as the frontend so the relative
  `/api` paths keep working (single origin = no CORS surprises).
- Database: MongoDB (Atlas free tier is enough) — set `MONGO_URL`/`DB_NAME` in the host's
  env, never in code.
- Secrets: set `GEMINI_API_KEY`, `JWT_SECRET_KEY` in the host's
  environment. See `.env.example`.
