# Interview Coach — App Spec (living)

## What it is
AI-powered placement-prep platform for college students and freshers: AI mock interviews
(5 modes) with per-answer scoring and follow-ups, feedback reports, resume analyzer
(PDF/DOCX + optional JD match), 9-domain MCQ quizzes, personalized weekly roadmap, and a
progress dashboard/history. Landing page at `/` with features, how-it-works, roles, FAQ.

## Stack
- Backend: FastAPI + motor (MongoDB, DB `app`), all routes on `api_router` under `/api`.
- Frontend: React 19 + TS strict + Tailwind v4 + shadcn (base-nova) + TanStack Query + recharts.
- Auth: Emergent-managed Clerk (email+password + Google). Protected backend routes use
  `Depends(require_user)` from `backend/clerk_auth.py`. Frontend attaches Bearer tokens via
  `src/lib/authToken.ts` inside `src/lib/api.ts`. No admin roles (students only).
- AI: emergentintegrations `LlmChat` (default openai/gpt-5.4), key `EMERGENT_LLM_KEY` in
  `backend/.env`. Rate limits: `backend/lib/ratelimit.py`. Fallbacks: data-derived report if
  the AI dies at completion; static MCQ bank if quiz generation fails.
- Fonts: Outfit (headings) + Plus Jakarta Sans (body) + JetBrains Mono (code). Theme: navy
  #0B132B, slate bg #F8FAFC, indigo primary #4F46E5, purple accents #7C3AED.

## Pages (all routes registered in src/App.tsx)
`/` landing (signed-in users redirect to /dashboard) · `/sign-in` + `/sign-up` (Clerk
widgets) · `/onboarding` (3-step wizard, gate) · `/dashboard` · `/interview` (setup) ·
`/interview/:id` (room; renders ReportView when completed) · `/interview/:id/report` ·
`/resume` · `/practice` · `/roadmap` · `/history`. Protected pages wrapped in
ProtectedRoute → redirects signed-out users to /sign-in and un-onboarded users to
/onboarding.

## Data model (Mongo collections; string uuid4 ids; aware-UTC datetimes)
- `users`: {user_id (Clerk sub, unique), email, name, picture, onboarding_completed, created_at}
- `profiles`: {user_id (unique), full_name, degree, branch, graduation_year, skills[], projects[], experience, target_role, prep_level, weekly_hours, schedule_pref}
- `interviews`: {id, user_id, role, interview_type (hr|technical|project|behavioral|role_specific), difficulty (easy|medium|hard), num_questions, status, questions[{id, question, topic, difficulty, criteria[], is_follow_up, base_question_id}], answers[{question_id, answer, evaluated_at, evaluation{score 0-10, feedback, strengths[], improvements[], missing_concepts[], suggested_answer}}], created_at, completed_at, report{overall_score 0-100, summary, strengths[], weaknesses[], missing_concepts[], topics_to_revise[], next_steps[]}}
- `resume_analyses`: {id, user_id, filename, created_at, ats_score, summary, sections{education[],skills[],projects[],experience[]}, grammar_suggestions[], missing_information[], extraction_notes[], improvements[], jd_match{matched_skills[], missing_skills[], verdict}|null}
- `quiz_sets`: {id, user_id, topic, difficulty, questions[{id, question, options[4], correct_index, explanation, difficulty, topic}], created_at} — TTL 2 h; correct answers never sent unasked
- `quiz_attempts`: {id, user_id, topic, difficulty, total, correct, score_pct, created_at}
- `roadmaps`: one per user ({user_id} unique), {id, target_role, weeks, tasks[{id, week, title, description, topic, task_type (learn|practice|quiz|mock|revise), estimated_minutes, status (todo|in_progress|completed)}], progress_pct}
- Indexes: `backend/lib/db.py::INDEXES`, applied at startup by ensure_indexes().

## Key flows
- Sign-in → GET `/users/me` syncs name/email from Clerk on first call. ProtectedRoute gates
  /onboarding until POST `/users/onboarding` sets onboarding_completed.
- Interview: POST `/interviews` (creates session + generates Q1) → UI loop POST
  `/interviews/{id}/answer` (evaluate → optional follow-up → next base question, or complete
  + report). Report overall_score = mean(answer scores)×10 (server-computed); LLM writes the
  qualitative parts; data-derived fallback report if the AI fails at completion. Answer
  failures (503) leave the session untouched — the same answer can be resubmitted.
- Resume: POST `/resumes/analyze` (multipart; PDF/DOCX ≤ 5 MB; pypdf/python-docx extraction;
  text capped 15k chars; untrusted-input prompt). missing_information = genuinely absent;
  extraction_notes = present-but-unreadable.
- Quizzes: POST `/quizzes/generate` (AI; static bank fallback `lib/content.py`; source field
  says which) → POST `/quizzes/{id}/submit` (server-graded; attempts stored).
- Roadmap: POST `/roadmap/generate` (profile + weak areas from `lib/insights.py`) → PATCH
  `/roadmap/tasks/{task_id}` toggles status and recomputes progress_pct.
- Dashboard: GET `/dashboard` — all real data (interview scores, quiz attempts, roadmap
  tasks, weak/strong areas aggregated from interview evaluation topics + quiz attempts).

## Auth + test accounts
- No admin roles. Test accounts and the automated sign-in ticket flow: memory/test_credentials.md.

## Known deviations from the original request (deliberate)
- MongoDB instead of PostgreSQL (pod-managed database).
- React 19/Vite instead of vanilla HTML/CSS/JS (pod template stack).
- Clerk-managed auth instead of hand-rolled password hashing (Emergent playbook).
- Evaluation is text-only (no audio/video analysis) — stated in UI copy everywhere.
