import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  FileSearch,
  Flame,
  Gauge,
  ListChecks,
  MessagesSquare,
  Route as RouteIcon,
  Swords,
  Target,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import type { DashboardData, MeResponse } from "@/lib/types";
import { DIFFICULTY_LABELS, INTERVIEW_TYPE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/components/auth/ClerkAuthProvider";

function Stat({
  icon: Icon,
  label,
  value,
  testId,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  testId: string;
}) {
  return (
    <Card className="transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex items-center gap-4 p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="font-heading text-2xl font-semibold text-slate-900" data-testid={testId}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

const QUICK_ACTIONS = [
  { to: "/interview", icon: MessagesSquare, title: "Start a mock interview", text: "HR, technical, project or behavioral" },
  { to: "/resume", icon: FileSearch, title: "Analyze your resume", text: "ATS score, gaps and JD matching" },
  { to: "/practice", icon: Swords, title: "Practice a quiz", text: "Nine CS domains, instant explanations" },
];

export default function Dashboard() {
  const me = useQuery({ queryKey: ["me"], queryFn: () => apiGet<MeResponse>("/users/me"), retry: 1 });
  const dash = useQuery({ queryKey: ["dashboard"], queryFn: () => apiGet<DashboardData>("/dashboard") });

  // Static shell always renders; only the data regions below handle pending/error states.
  const { user } = useUser();
  const displayName = user?.fullName || me.data?.name || "there";
  const firstName = displayName.split(" ")[0];
  const data = dash.data;
  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900" data-testid="dashboard-greeting">
            Welcome back, {firstName}
          </h1>
          {data?.target_role ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <Target className="h-4 w-4 text-primary" /> Target role: {data.target_role}
            </p>
          ) : null}
        </div>
        <Link to="/onboarding" data-testid="dashboard-edit-profile-link">
          <Button variant="outline" size="sm">
            <CalendarDays className="h-4 w-4" /> Edit profile
          </Button>
        </Link>
      </div>

      {dash.isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="font-heading text-lg font-semibold text-slate-900">Couldn't load your stats</p>
            <p className="text-sm text-slate-500">The dashboard is partially available — retry in a moment.</p>
            <Button variant="outline" onClick={() => dash.refetch()} data-testid="dashboard-retry-button">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Metric strip */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat icon={ClipboardCheck} label="Interviews completed" value={stats ? String(stats.interviews_completed) : "…"} testId="stat-interviews-completed" />
            <Stat icon={Gauge} label="Avg interview score" value={stats?.avg_interview_score != null ? `${stats.avg_interview_score}/100` : "—"} testId="stat-avg-interview-score" />
            <Stat icon={ListChecks} label="Quizzes taken" value={stats ? String(stats.quizzes_taken) : "…"} testId="stat-quizzes-taken" />
            <Stat icon={RouteIcon} label="Roadmap progress" value={stats ? `${stats.roadmap_progress}%` : "…"} testId="stat-roadmap-progress" />
          </div>

          {/* Quick actions */}
          <div className="grid gap-4 sm:grid-cols-3">
            {QUICK_ACTIONS.map(({ to, icon: Icon, title, text }) => (
              <Link key={to} to={to} data-testid={`dashboard-quick-${to.slice(1)}`}>
                <Card className="group h-full transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3E8FF] text-[#6B21A8]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{title}</p>
                      <p className="truncate text-xs text-slate-500">{text}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            {/* Left: trend + recent */}
            <div className="space-y-4 lg:col-span-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Flame className="h-4.5 w-4.5 text-primary" /> Interview score trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data && data.score_history.length >= 2 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={data.score_history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={32} tick={{ fill: "#64748B", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ background: "#0B132B", border: "none", borderRadius: 12, color: "#FFFFFF" }}
                          labelStyle={{ color: "#94A3B8" }}
                          formatter={(value: number, name: string) => [`${value}/100`, name === "score" ? "Score" : name]}
                        />
                        <Area type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={2.5} fill="url(#scoreFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 text-center" data-testid="dashboard-chart-empty">
                      <p className="text-sm font-medium text-slate-600">No trend to show yet</p>
                      <p className="max-w-xs text-xs text-slate-400">
                        Complete at least two mock interviews and your score progression will appear here.
                      </p>
                      <Link to="/interview">
                        <Button size="sm" variant="outline" data-testid="dashboard-empty-interview-cta">
                          Take your first interview
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-base">Recent interviews</CardTitle>
                  <Link to="/history" className="text-sm font-medium text-primary underline-offset-4 hover:underline" data-testid="dashboard-view-history-link">
                    View all
                  </Link>
                </CardHeader>
                <CardContent>
                  {data && data.recent_interviews.length > 0 ? (
                    <ul className="divide-y divide-slate-100">
                      {data.recent_interviews.map((interview) => (
                        <li key={interview.id} className="flex items-center justify-between gap-3 py-3" data-testid={`dashboard-recent-interview-${interview.id}`}>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">{interview.role}</p>
                            <p className="text-xs text-slate-500">
                              {INTERVIEW_TYPE_LABELS[interview.interview_type]} · {DIFFICULTY_LABELS[interview.difficulty]}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            {interview.overall_score != null ? (
                              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100">{interview.overall_score}/100</Badge>
                            ) : (
                              <Badge variant="secondary">In progress</Badge>
                            )}
                            <Link
                              to={interview.status === "completed" ? `/interview/${interview.id}/report` : `/interview/${interview.id}`}
                              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                              data-testid={`dashboard-open-interview-${interview.id}`}
                            >
                              {interview.status === "completed" ? "Report" : "Resume"}
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="py-6 text-center text-sm text-slate-500" data-testid="dashboard-recent-empty">
                      Your finished interviews will appear here.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: skills + next tasks */}
            <div className="space-y-4 lg:col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Skill focus</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data && (data.weak_areas.length > 0 || data.strong_areas.length > 0) ? (
                    <>
                      {data.weak_areas.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Needs work</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {data.weak_areas.map((area) => (
                              <Link key={area} to="/practice" data-testid={`dashboard-weak-area-${area.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                                <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100">{area}</Badge>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                      {data.strong_areas.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Strong areas</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {data.strong_areas.map((area) => (
                              <Badge key={area} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-slate-500" data-testid="dashboard-skills-empty">
                      Complete an interview or quiz and the coach will map your strong and weak areas here.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recommended next</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data && data.recommended_tasks.length > 0
                    ? data.recommended_tasks.map((task) => (
                        <Link key={task.id} to="/roadmap" className="block rounded-lg border border-slate-100 bg-slate-50 p-3 transition-colors hover:bg-slate-100" data-testid={`dashboard-recommended-task-${task.id}`}>
                          <p className="text-sm font-medium text-slate-900">{task.title}</p>
                          <p className="text-xs text-slate-500">Week {task.week} · {task.estimated_minutes} min</p>
                        </Link>
                      ))
                    : data && data.recommendations.length > 0
                      ? data.recommendations.map((rec) => (
                          <p key={rec} className="rounded-lg bg-[#F3E8FF]/50 p-3 text-sm text-[#581C87]" data-testid="dashboard-recommendation">
                            {rec}
                          </p>
                        ))
                      : (
                        <p className="text-sm text-slate-500" data-testid="dashboard-recommended-empty">
                          No tasks yet — start an interview or generate a roadmap.
                        </p>
                      )}
                  <Link to="/roadmap" className="block pt-1 text-sm font-medium text-primary underline-offset-4 hover:underline" data-testid="dashboard-open-roadmap-link">
                    Open roadmap →
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
