# Repair notes

## Preserved application functionality

The existing page structure and feature routers remain in place: dashboard, onboarding,
interviews, interview reports/history, resume analysis, technical practice, and roadmap.
No feature page or feature router was removed.

## Repairs

- Replaced permissive demo bearer-token handling with server-signed JWT authentication.
- Added email/password registration and login endpoints, PBKDF2 password hashing, token
  expiry, invalid-token rejection, and duplicate-account handling.
- Updated the existing auth provider and sign-in/sign-up screens to use the real API.
- Ensured protected routes wait for session restoration and route signed-out users to login.
- Fixed the duplicate roadmap index and added a unique email index.
- Prevented configured MongoDB connection failures from silently switching to volatile
  in-memory storage.
- Added missing backend dependencies and a correctly named `requirements.txt` while
  retaining the old misspelled requirements filename for compatibility.
- Corrected Gemini model selection/configuration and retained deterministic fallback
  behavior when the provider is not configured or unavailable.
- Corrected wildcard CORS behavior when credentials are enabled.
- Removed the credential-bearing `.env` file from the deliverable; added `.env.example`.
- Corrected the Playwright configuration filename.
- Replaced misleading webcam attention/emotion/eye-contact estimates with an explicitly
  labeled local camera-lighting check. No face or emotion recognition is claimed.

## Validation performed in this repair environment

- All 26 backend Python files passed Python AST parsing and bytecode compilation.
- Package JSON files passed JSON parsing.
- The archive was checked for integrity after creation.

A full frontend TypeScript build and live FastAPI/MongoDB integration test could not be
run here: dependency installation timed out and the repair environment did not contain
Motor/PyMongo or the frontend node_modules. Run the validation commands in `README.md`
after installing dependencies and configuring MongoDB. Do not treat static parsing as
proof of a successful production deployment.

## Required deployment configuration

- Set a strong, unique `JWT_SECRET_KEY` and `APP_ENV=production`.
- Set `MONGO_URL` to a persistent MongoDB deployment; the example mock mode is volatile.
- Set `CORS_ORIGINS` to the exact deployed frontend origin(s).
- Rotate any API key that was present in the original shared archive. It is not included
  in this repaired archive.
