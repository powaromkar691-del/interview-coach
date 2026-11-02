# Interview Coach — API documentation

Base URL: `/api` (frontend calls it relatively through the Vite proxy). All request and
response bodies are JSON. Auth: local email/password accounts. Register at `/api/auth/register`, sign in at
`/api/auth/login`, and send the returned signed JWT as
`Authorization: Bearer <token>`. Every student-data route is scoped to the signed-in
user and returns `404` for records owned by another user. `/api/clerk/config` remains
a compatibility endpoint and reports local authentication mode.

| Method | Path | Auth | Body / params | Returns |
|---|---|---|---|---|
| GET | `/` | – | – | `{"message": "Hello World"}` health probe |
| POST | `/status` | – | `{client_name}` | StatusCheck |
| GET | `/status` | – | – | `StatusCheck[]` |
| POST | `/auth/register` | – | `{name, email, password}` | `{token, user}` |
| POST | `/auth/login` | – | `{email, password}` | `{token, user}` |
| GET | `/users/me` | ✓ | – | `{user_id, email, name, picture, onboarding_completed, profile, created_at}` |
| POST | `/users/onboarding` | ✓ | `{full_name, degree, branch, graduation_year, skills[], projects[], experience, target_role, prep_level, weekly_hours, schedule_pref}` | Profile (marks onboarding complete) |
| POST | `/interviews` | ✓ | `{role, interview_type: hr\|technical\|project\|behavioral\|role_specific, difficulty: easy\|medium\|hard, num_questions: 3-10}` | InterviewSession (status `in_progress`, first question generated) |
| POST | `/interviews/{id}/answer` | ✓ | `{answer}` | `{question_id, evaluation{score 0-10, feedback, strengths[], improvements[], missing_concepts[], suggested_answer}, next_question, status, report}` — report present only when the session completes |
| GET | `/interviews` | ✓ | – | `InterviewSummary[]` (newest first) |
| GET | `/interviews/{id}` | ✓ | – | InterviewSession (full transcript + report) |
| POST | `/resumes/analyze` | ✓ | multipart: `file` (PDF/DOCX ≤ 5 MB), `job_description` (optional) | ResumeAnalysis |
| GET | `/resumes` | ✓ | – | `ResumeAnalysis[]` (newest first, ≤ 20) |
| GET | `/resumes/{id}` | ✓ | – | ResumeAnalysis |
| POST | `/quizzes/generate` | ✓ | `{topic, difficulty, count: 1-10}` | `{id, topic, difficulty, source: ai\|bank, questions[]}` (answers withheld) |
| POST | `/quizzes/{id}/submit` | ✓ | `{answers: [{question_id, selected_index}]}` | `{attempt, results[]}` (server-graded) |
| GET | `/quizzes/attempts` | ✓ | – | `QuizAttempt[]` |
| POST | `/roadmap/generate` | ✓ | `{weeks: 1-4, focus_areas[]}` | Roadmap |
| GET | `/roadmap` | ✓ | – | Roadmap \| `null` |
| PATCH | `/roadmap/tasks/{task_id}` | ✓ | `{status: todo\|in_progress\|completed}` | Roadmap (updated progress) |
| GET | `/dashboard` | ✓ | – | DashboardData (all stats derived from real data) |
| GET | `/topics` | – | – | `{topics: [...]}` — 9 static prep categories |

## Error contract

- `401` — missing, invalid, or expired bearer token.
- `404` — resource not found **or** owned by another user.
- `422` — request validation failure (`{"detail": [...]}` from Pydantic).
- `429` — rate limit exceeded (AI-heavy endpoints are limited per user).
- `503` — AI provider unavailable; message asks the user to retry. Interviews keep their
  pending question so an answer can simply be resubmitted.

## Data model

MongoDB collections (string `uuid4` ids, aware-UTC datetimes): `users`, `profiles`,
`interviews` (questions + answers + report embedded), `resume_analyses`, `quiz_sets`
(TTL 2 h — grading happens while the set is live), `quiz_attempts`, `roadmaps`
(one per user). Indexes are declared in `backend/lib/db.py::INDEXES` and applied at
startup by `ensure_indexes()`.

## AI behavior notes

- Prompts live only in `backend/routers/*` and `backend/lib/llm.py`; the API key is read
  from `GEMINI_API_KEY` in `backend/.env` and never reaches the frontend.
- Resume text and student answers are injected as quoted **untrusted data** — prompts
  instruct the model never to follow instructions inside them.
- Scores are AI-generated estimates; the UI states this on every report and feedback panel.
