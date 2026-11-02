import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { InterviewSummary, QuizAttempt, ResumeAnalysis } from "@/lib/types";
import { DIFFICULTY_LABELS, INTERVIEW_TYPE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-8 text-center text-sm text-slate-500">
        {text}
      </TableCell>
    </TableRow>
  );
}

export default function History() {
  const interviews = useQuery({ queryKey: ["interviews"], queryFn: () => apiGet<InterviewSummary[]>("/interviews"), retry: 1 });
  const attempts = useQuery({ queryKey: ["quizAttempts"], queryFn: () => apiGet<QuizAttempt[]>("/quizzes/attempts"), retry: 1 });
  const resumes = useQuery({ queryKey: ["resumes"], queryFn: () => apiGet<ResumeAnalysis[]>("/resumes"), retry: 1 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Progress &amp; History</h1>
        <p className="mt-1 text-sm text-slate-500">Every interview, quiz and resume analysis you've completed.</p>
      </div>

      <Tabs defaultValue="interviews">
        <TabsList>
          <TabsTrigger value="interviews" data-testid="history-tab-interviews">Interviews</TabsTrigger>
          <TabsTrigger value="quizzes" data-testid="history-tab-quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="resumes" data-testid="history-tab-resumes">Resumes</TabsTrigger>
        </TabsList>

        <TabsContent value="interviews">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interview sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {interviews.isPending ? (
                <div className="flex justify-center py-8" data-testid="history-interviews-loading">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(interviews.data ?? []).map((iv) => (
                      <TableRow key={iv.id} data-testid={`history-interview-row-${iv.id}`}>
                        <TableCell>{fmt(iv.created_at)}</TableCell>
                        <TableCell className="font-medium text-slate-900">{iv.role}</TableCell>
                        <TableCell>{INTERVIEW_TYPE_LABELS[iv.interview_type]}</TableCell>
                        <TableCell>{DIFFICULTY_LABELS[iv.difficulty]}</TableCell>
                        <TableCell>
                          {iv.overall_score != null ? (
                            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100">{iv.overall_score}/100</Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {iv.status === "completed" ? (
                            <Badge variant="secondary">Completed</Badge>
                          ) : (
                            <Badge variant="outline">In progress</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Link
                            to={iv.status === "completed" ? `/interview/${iv.id}/report` : `/interview/${iv.id}`}
                            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                            data-testid={`history-open-interview-${iv.id}`}
                          >
                            {iv.status === "completed" ? "Report" : "Resume"}
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                    {interviews.data && interviews.data.length === 0 && (
                      <EmptyRow colSpan={7} text="No interviews yet — start one from the dashboard." />
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quiz attempts</CardTitle>
            </CardHeader>
            <CardContent>
              {attempts.isPending ? (
                <div className="flex justify-center py-8" data-testid="history-quizzes-loading">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Correct</TableHead>
                      <TableHead>Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(attempts.data ?? []).map((a) => (
                      <TableRow key={a.id} data-testid={`history-quiz-row-${a.id}`}>
                        <TableCell>{fmt(a.created_at)}</TableCell>
                        <TableCell className="font-medium text-slate-900">{a.topic}</TableCell>
                        <TableCell>{a.difficulty}</TableCell>
                        <TableCell>
                          {a.correct}/{a.total}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              a.score_pct >= 70
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                            }
                          >
                            {a.score_pct}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {attempts.data && attempts.data.length === 0 && (
                      <EmptyRow colSpan={5} text="No quiz attempts yet — try one from Technical Practice." />
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resumes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resume analyses</CardTitle>
            </CardHeader>
            <CardContent>
              {resumes.isPending ? (
                <div className="flex justify-center py-8" data-testid="history-resumes-loading">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>File</TableHead>
                      <TableHead>ATS score</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(resumes.data ?? []).map((r) => (
                      <TableRow key={r.id} data-testid={`history-resume-row-${r.id}`}>
                        <TableCell>{fmt(r.created_at)}</TableCell>
                        <TableCell className="font-medium text-slate-900">{r.filename}</TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100">{r.ats_score}/100</Badge>
                        </TableCell>
                        <TableCell>
                          <Link to="/resume" className="text-sm font-medium text-primary underline-offset-4 hover:underline" data-testid={`history-open-resume-${r.id}`}>
                            Open analyzer
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                    {resumes.data && resumes.data.length === 0 && (
                      <EmptyRow colSpan={4} text="No resume analyses yet — upload a resume in the analyzer." />
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
