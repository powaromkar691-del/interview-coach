# Deploy Interview Coach on Render + MongoDB Atlas

This deployment keeps the existing React application and FastAPI API as separate Render services. MongoDB Atlas provides persistent storage.

## 1. Prepare MongoDB Atlas

1. Create an Atlas project and an M0 (or larger) cluster.
2. Create a database user with a strong password. Do not use your Atlas account password.
3. In Network Access, allow the Render service to connect. For a quick initial setup you may temporarily use `0.0.0.0/0`; for tighter security use Render static outbound IPs where your plan supports them.
4. Copy the application connection string. Replace the username/password placeholders and URL-encode special characters in the password. It should resemble `mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority`.
5. Keep the URI private. Never commit it to GitHub.

## 2. Push this project to GitHub

1. Extract the ZIP. Use the `emergent_project` folder as the GitHub repository root; it directly contains `render.yaml`, `backend/`, and `frontend/`.
2. Create a GitHub repository and push the contents of that folder.
3. Confirm `.env` files are not committed; `.gitignore` excludes them.

## 3. Create both Render services

1. Sign in to Render and choose **New → Blueprint**.
2. Connect the GitHub repository containing `render.yaml`.
3. Render detects the API web service and frontend static site.
4. During setup, supply `MONGO_URL`, `CORS_ORIGINS`, `GEMINI_API_KEY` (optional), and `VITE_API_URL` when prompted, or add the values in each service's Environment settings after creation.

If the service URLs are not yet known, create/deploy the API first, then set the frontend `VITE_API_URL` and trigger a frontend redeploy. Set `VITE_API_URL` to the API origin only, e.g. `https://interview-coach-api.onrender.com` (no trailing slash and no `/api`).

## 4. Set the production environment variables

### API service (`interview-coach-api`)

- `APP_ENV=production`
- `MONGO_URL=<your Atlas connection string>`
- `DB_NAME=interview_coach`
- `JWT_SECRET_KEY=<a long random secret>` (Blueprint can generate this automatically)
- `TOKEN_TTL_HOURS=24`
- `CORS_ORIGINS=https://YOUR-FRONTEND.onrender.com`
- `GEMINI_API_KEY=<your new Gemini key>` (optional; omit/leave blank to use the existing fallback behavior)
- `GEMINI_MODEL=gemini-2.5-flash`

### Frontend static site (`interview-coach-frontend`)

- `VITE_API_URL=https://YOUR-API.onrender.com`

The frontend variable is injected at build time. After changing it, trigger **Manual Deploy → Clear build cache & deploy** or a normal redeploy.

## 5. Verify deployment

1. Open `https://YOUR-API.onrender.com/health` — expect `{"status":"ok"}`.
2. Open `https://YOUR-API.onrender.com/health/ready` — expect `{"status":"ready","database":"connected"}`.
3. Open `https://YOUR-API.onrender.com/docs` — FastAPI docs should load.
4. Open the frontend URL, register a new account, sign out, and sign in again.
5. Create an interview, submit answers, inspect the report/history, upload a resume, attempt a quiz, and use the roadmap.
6. Create a second account and verify that its history and saved data are separate.

## Important operational notes

- Render's free web services may sleep when idle; the first request after inactivity can be slow. Use an always-on plan for a responsive public application.
- Use an Atlas cluster with sufficient capacity and backups for real users.
- Configure Atlas network access and database-user permissions carefully.
- The API uses signed JWTs. Keep `JWT_SECRET_KEY` stable between deploys; changing it invalidates existing sessions.
- Rotate any Gemini/API credential that was present in an earlier shared archive.
- Do not expose `MONGO_URL`, `JWT_SECRET_KEY`, or `GEMINI_API_KEY` in frontend variables. Only `VITE_API_URL` belongs in the frontend.
- The frontend's camera analysis should be described as experimental if it still uses heuristic estimates; do not market it as validated facial or attention recognition.

## IntelliHire intro splash integration

The public home route now shows the IntelliHire scientific intro splash once per browser tab session, then continues to the existing Interview Coach landing page. The splash uses the bundled `frontend/public/intro-background.mp4` asset and can be skipped. Existing sign-in, sign-up, protected routes, and application feature pages are unchanged.
