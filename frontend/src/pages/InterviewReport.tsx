import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { apiGet } from "@/lib/api";
import type { InterviewSession } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ReportView from "@/components/report/ReportView";

export default function InterviewReport() {
  const { id = "" } = useParams();
  const sessionQ = useQuery({
    queryKey: ["interview", id],
    queryFn: () => apiGet<InterviewSession>(`/interviews/${id}`),
    retry: 1,
  });

  const session = sessionQ.data;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/history" aria-label="Back to history" data-testid="report-back-link">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">
              {session ? `${session.role} — feedback report` : "Feedback report"}
            </h1>
            <p className="text-sm text-slate-500">Scores, strengths and next steps from this session.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to="/interview" data-testid="report-page-new-interview-link">
            <Button variant="outline" size="sm">New interview</Button>
          </Link>
          <Link to="/dashboard" data-testid="report-page-dashboard-link">
            <Button size="sm">Dashboard</Button>
          </Link>
        </div>
      </div>

      {sessionQ.isPending && (
        <div className="flex min-h-[40vh] items-center justify-center" data-testid="report-page-loading">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {sessionQ.isError && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="font-heading text-lg font-semibold text-slate-900">Couldn't load this report</p>
            <Button variant="outline" onClick={() => sessionQ.refetch()} data-testid="report-page-retry-button">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {session && session.status === "completed" && session.report && <ReportView session={session} />}

      {session && session.status !== "completed" && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="font-heading text-lg font-semibold text-slate-900">This interview isn't finished yet</p>
            <p className="text-sm text-slate-500">Complete the remaining questions to generate the feedback report.</p>
            <Link to={`/interview/${session.id}`} data-testid="report-resume-interview-link">
              <Button>Resume interview</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
