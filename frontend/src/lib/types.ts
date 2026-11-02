// Hand-written mirrors of the backend's Pydantic models — nothing infers across the
// Python/TS boundary, so keep every interface in sync with its model in the same edit.

export type PrepLevel = "beginner" | "intermediate" | "advanced";
export type InterviewType = "hr" | "technical" | "project" | "behavioral" | "role_specific";
export type Difficulty = "easy" | "medium" | "hard";
export type TaskType = "learn" | "practice" | "quiz" | "mock" | "revise";
export type TaskStatus = "todo" | "in_progress" | "completed";
export type InterviewStatus = "in_progress" | "completed";

// --- models/users.py ---
export interface Profile {
  user_id: string;
  full_name: string;
  degree: string;
  branch: string;
  graduation_year: number;
  skills: string[];
  projects: string[];
  experience: string;
  target_role: string;
  prep_level: PrepLevel;
  weekly_hours: number;
  schedule_pref: string;
  created_at: string;
  updated_at: string;
}

export interface OnboardingInput {
  full_name: string;
  degree: string;
  branch: string;
  graduation_year: number;
  skills: string[];
  projects: string[];
  experience: string;
  target_role: string;
  prep_level: PrepLevel;
  weekly_hours: number;
  schedule_pref: string;
}

export interface MeResponse {
  user_id: string;
  email: string;
  name: string;
  picture: string | null;
  onboarding_completed: boolean;
  profile: Profile | null;
  created_at: string;
}

// --- models/interview.py ---
export interface InterviewQuestion {
  id: string;
  question: string;
  topic: string;
  difficulty: string;
  criteria: string[];
  is_follow_up: boolean;
  base_question_id: string | null;
}

export interface AnswerEvaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  missing_concepts: string[];
  suggested_answer: string;
}

export interface InterviewAnswer {
  question_id: string;
  answer: string;
  evaluated_at: string;
  evaluation: AnswerEvaluation;
}

export interface InterviewReport {
  overall_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  missing_concepts: string[];
  topics_to_revise: string[];
  next_steps: string[];
}

export interface InterviewSession {
  id: string;
  user_id: string;
  role: string;
  interview_type: InterviewType;
  difficulty: Difficulty;
  num_questions: number;
  status: InterviewStatus;
  questions: InterviewQuestion[];
  answers: InterviewAnswer[];
  created_at: string;
  completed_at: string | null;
  report: InterviewReport | null;
}

export interface InterviewSummary {
  id: string;
  role: string;
  interview_type: InterviewType;
  difficulty: Difficulty;
  status: InterviewStatus;
  num_questions: number;
  overall_score: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface InterviewCreateInput {
  role: string;
  interview_type: InterviewType;
  difficulty: Difficulty;
  num_questions: number;
}

export interface AnswerResponse {
  question_id: string;
  evaluation: AnswerEvaluation;
  next_question: InterviewQuestion | null;
  status: InterviewStatus;
  report: InterviewReport | null;
}

// --- models/resume.py ---
export interface ResumeSections {
  education: string[];
  skills: string[];
  projects: string[];
  experience: string[];
}

export interface JdMatch {
  matched_skills: string[];
  missing_skills: string[];
  verdict: string;
}

export interface ResumeAnalysis {
  id: string;
  user_id: string;
  filename: string;
  created_at: string;
  ats_score: number;
  summary: string;
  sections: ResumeSections;
  grammar_suggestions: string[];
  missing_information: string[];
  extraction_notes: string[];
  improvements: string[];
  jd_match: JdMatch | null;
}

// --- models/quiz.py ---
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  difficulty: string;
  topic: string;
}

export interface QuizSetResponse {
  id: string;
  topic: string;
  difficulty: Difficulty;
  source: "ai" | "bank";
  questions: QuizQuestion[];
}

export interface QuizResultItem {
  question_id: string;
  question: string;
  options: string[];
  selected_index: number;
  correct_index: number;
  correct: boolean;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  topic: string;
  difficulty: string;
  total: number;
  correct: number;
  score_pct: number;
  created_at: string;
}

export interface QuizSubmitResponse {
  attempt: QuizAttempt;
  results: QuizResultItem[];
}

// --- models/roadmap.py ---
export interface RoadmapTask {
  id: string;
  week: number;
  title: string;
  description: string;
  topic: string;
  task_type: TaskType;
  estimated_minutes: number;
  status: TaskStatus;
}

export interface Roadmap {
  id: string;
  user_id: string;
  target_role: string;
  weeks: number;
  tasks: RoadmapTask[];
  progress_pct: number;
  created_at: string;
}

// --- models/dashboard.py ---
export interface ScorePoint {
  date: string;
  score: number;
}

export interface DashboardStats {
  interviews_completed: number;
  avg_interview_score: number | null;
  quizzes_taken: number;
  avg_quiz_score: number | null;
  roadmap_progress: number;
}

export interface DashboardData {
  target_role: string | null;
  stats: DashboardStats;
  score_history: ScorePoint[];
  strong_areas: string[];
  weak_areas: string[];
  recommended_tasks: RoadmapTask[];
  recommendations: string[];
  recent_interviews: InterviewSummary[];
}

// --- lib/content.py (static topics) ---
export interface TopicInfo {
  id: string;
  name: string;
  description: string;
  subtopics: string[];
}

export interface TopicListResponse {
  topics: TopicInfo[];
}

// --- shared labels ---
export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  hr: "HR Interview",
  technical: "Technical Interview",
  project: "Project-Based",
  behavioral: "Behavioral",
  role_specific: "Role-Specific",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  learn: "Learn",
  practice: "Practice",
  quiz: "Quiz",
  mock: "Mock Interview",
  revise: "Revise",
};
