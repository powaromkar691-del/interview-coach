import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Info,
  Lightbulb,
} from "lucide-react";
import type { InterviewSession } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function band(score: number): { label: string; className: string; bar: string } {
  if (score >= 80) return { label: "Excellent", className: "text-emerald-600", bar: "bg-emerald-500" };
  if (score >= 65) return { label: "Good", className: "text-indigo-600", bar: "bg-primary" };
  if (score >= 45) return { label: "Getting there", className: "text-amber-600", bar: "bg-amber-500" };
  return { label: "Needs focused work", className: "text-rose-600", bar: "bg-rose-500" };
}

function ListCard({
  title,
  items,
  icon: Icon,
  tone,
  empty,
}: {
  title: string;
  items: string[];
  icon: typeof CheckCircle2;
  tone: "emerald" | "amber" | "rose" | "indigo";
  empty: string;
}) {
  const tones = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
    indigo: "text-primary",
  } as const;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`h-4.5 w-4.5 ${tones[tone]}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">{empty}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={`${i}-${item.slice(0, 24)}`} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700">
                <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${tones[tone].replace("text-", "bg-")}`} />
                {item}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Full interview feedback report — shared by the room (after completion) and the report page. */
export default function ReportView({ session }: { session: InterviewSession }) {
  const report = session.report;
  if (!report) return null;
  const b = band(report.overall_score);

  return (
    <div className="space-y-6" data-testid="interview-report">
      {/* Overall score banner */}
      <Card className="border-0 bg-[#0B132B] text-white">
        <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-sm font-medium text-slate-300">Overall score — {b.label}</p>
            <p className="font-heading text-5xl font-semibold" data-testid="report-overall-score">
              {report.overall_score}
              <span className="text-2xl text-slate-400">/100</span>
            </p>
          </div>
          <div className="w-full max-w-sm">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${b.bar} transition-all duration-700`}
                style={{ width: `${report.overall_score}%` }}
              />
            </div>
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-slate-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
              AI scores are estimates based on your written answers and may not perfectly reflect a real
              interviewer's judgment.
            </p>
          </div>
        </CardContent>
      </Card>

      {report.summary && (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-heading text-lg font-semibold text-slate-900">Summary</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-700" data-testid="report-summary">
              {report.summary}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <ListCard title="Strengths" items={report.strengths} icon={CheckCircle2} tone="emerald" empty="No clear strengths were identified yet — keep practicing." />
        <ListCard title="Areas for improvement" items={report.weaknesses} icon={Lightbulb} tone="amber" empty="No weaknesses were identified." />
        <ListCard title="Missing concepts" items={report.missing_concepts} icon={CircleAlert} tone="rose" empty="No missing concepts were detected." />
      </div>

      {report.topics_to_revise.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpenCheck className="h-4.5 w-4.5 text-primary" /> Topics to revise
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-2">
            {report.topics_to_revise.map((topic) => (
              <Link key={topic} to="/practice" data-testid={`report-topic-${topic.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                <Badge className="bg-[#F3E8FF] text-[#581C87] hover:bg-[#EDE9FE]">{topic}</Badge>
              </Link>
            ))}
            <Link
              to="/practice"
              className="ml-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
              data-testid="report-practice-link"
            >
              Practice these in a quiz →
            </Link>
          </CardContent>
        </Card>
      )}

      {report.next_steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4.5 w-4.5 text-primary" /> Actionable next steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {report.next_steps.map((step, i) => (
                <li key={`${i}-${step.slice(0, 24)}`} className="flex items-start gap-3 text-sm leading-relaxed text-slate-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Per-question review */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question-by-question review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {session.questions.map((question, index) => {
            const answer = session.answers.find((a) => a.question_id === question.id);
            if (!answer) return null;
            return (
              <details
                key={question.id}
                className="group rounded-xl border border-slate-200 bg-white open:shadow-xs"
                data-testid={`report-question-review-${index + 1}`}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 p-4 [&::-webkit-details-marker]:hidden">
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Question {index + 1} · {question.topic} · {answer.evaluation.score.toFixed(1)}/10
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{question.question}</p>
                  </div>
                  <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-4 border-t border-slate-100 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your answer</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{answer.answer}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Coach feedback</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-700">{answer.evaluation.feedback}</p>
                  </div>
                  {answer.evaluation.suggested_answer && (
                    <div className="rounded-lg bg-[#F3E8FF]/40 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#6B21A8]">Suggested strong answer</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                        {answer.evaluation.suggested_answer}
                      </p>
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
