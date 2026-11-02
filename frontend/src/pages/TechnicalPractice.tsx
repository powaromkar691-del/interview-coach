import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Loader2, RefreshCw, Sparkles, Swords, XCircle } from "lucide-react";
import { apiGet, apiPost, errorMessage } from "@/lib/api";
import type {
  Difficulty,
  QuizAttempt,
  QuizSetResponse,
  QuizSubmitResponse,
  TopicInfo,
  TopicListResponse,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

function TopicCard({
  topic,
  attempts,
  avg,
  onPick,
}: {
  topic: TopicInfo;
  attempts: number;
  avg: number | null;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="h-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
      data-testid={`practice-topic-card-${topic.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-base font-semibold text-slate-900">{topic.name}</h3>
        {avg != null && (
          <Badge className={avg >= 70 ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}>
            {avg.toFixed(0)}%
          </Badge>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{topic.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {topic.subtopics.slice(0, 3).map((s) => (
          <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{s}</span>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-400">
        {attempts > 0 ? `${attempts} attempt${attempts > 1 ? "s" : ""}` : "No attempts yet"}
      </p>
    </button>
  );
}

export default function TechnicalPractice() {
  const queryClient = useQueryClient();
  const topics = useQuery({ queryKey: ["topics"], queryFn: () => apiGet<TopicListResponse>("/topics"), staleTime: Infinity });
  const attempts = useQuery({ queryKey: ["quizAttempts"], queryFn: () => apiGet<QuizAttempt[]>("/quizzes/attempts"), retry: 1 });

  const [dialogTopic, setDialogTopic] = useState<TopicInfo | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [count, setCount] = useState(5);
  const [quiz, setQuiz] = useState<QuizSetResponse | null>(null);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [outcome, setOutcome] = useState<QuizSubmitResponse | null>(null);

  const generate = useMutation({
    mutationFn: () => apiPost<QuizSetResponse>("/quizzes/generate", { topic: dialogTopic?.id, difficulty, count }),
    onSuccess: (data) => {
      setQuiz(data);
      setOutcome(null);
      setSelected({});
      setDialogTopic(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (err) => toast.error(errorMessage(err, "Quiz generation is unavailable right now — please try again shortly.")),
  });

  const submit = useMutation({
    mutationFn: (quizId: string) =>
      apiPost<QuizSubmitResponse>(`/quizzes/${quizId}/submit`, {
        answers: (quiz?.questions ?? []).map((q) => ({ question_id: q.id, selected_index: selected[q.id] ?? 0 })),
      }),
    onSuccess: (data) => {
      setOutcome(data);
      queryClient.invalidateQueries({ queryKey: ["quizAttempts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (err) => toast.error(errorMessage(err, "Could not submit your quiz — please try again.")),
  });

  const statsFor = (topicId: string) => {
    const mine = (attempts.data ?? []).filter((a) => a.topic === topicId);
    const avg = mine.length ? mine.reduce((sum, a) => sum + a.score_pct, 0) / mine.length : null;
    return { attempts: mine.length, avg };
  };

  const answeredCount = quiz ? quiz.questions.filter((q) => selected[q.id] !== undefined).length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Technical Preparation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Nine core CS domains with AI-generated MCQs, instant explanations and difficulty levels. Your
          attempts feed the dashboard's skill map.
        </p>
      </div>

      {quiz && !outcome && (
        <Card data-testid="quiz-runner">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">{quiz.topic}</CardTitle>
              <p className="text-xs text-slate-500">
                {quiz.difficulty} · {quiz.questions.length} questions ·{" "}
                {quiz.source === "ai" ? "freshly generated" : "curated question bank"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuiz(null);
                setOutcome(null);
              }}
              data-testid="quiz-back-to-topics-button"
            >
              <ArrowLeft className="h-4 w-4" /> Topics
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            {quiz.questions.map((q, qi) => (
              <div key={q.id} className="rounded-xl border border-slate-200 p-4" data-testid={`quiz-question-${qi + 1}`}>
                <p className="text-sm font-medium text-slate-900">
                  {qi + 1}. {q.question}
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {q.options.map((option, oi) => {
                    const chosen = selected[q.id] === oi;
                    return (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => setSelected((s) => ({ ...s, [q.id]: oi }))}
                        className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors duration-150 ${
                          chosen ? "border-primary bg-primary/5 font-medium text-primary" : "border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                        data-testid={`quiz-option-${qi + 1}-${oi}`}
                      >
                        <span className="mr-2 font-semibold">{String.fromCharCode(65 + oi)}.</span>
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-500">
                {answeredCount}/{quiz.questions.length} answered
              </p>
              <Button
                onClick={() => submit.mutate(quiz.id)}
                disabled={answeredCount < quiz.questions.length || submit.isPending}
                data-testid="quiz-submit-button"
              >
                {submit.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  "Submit answers"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {quiz && outcome && (
        <Card data-testid="quiz-results">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Swords className="h-4.5 w-4.5 text-primary" /> {outcome.attempt.correct}/{outcome.attempt.total} correct — {outcome.attempt.score_pct}%
              </CardTitle>
              <p className="text-xs text-slate-500">Recorded to your progress.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQuiz(null);
                setOutcome(null);
              }}
              data-testid="quiz-try-another-button"
            >
              <RefreshCw className="h-4 w-4" /> Try another quiz
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {outcome.results.map((r, i) => (
              <div key={r.question_id} className={`rounded-xl border p-4 ${r.correct ? "border-emerald-200 bg-emerald-50/50" : "border-rose-200 bg-rose-50/50"}`} data-testid={`quiz-result-${i + 1}`}>
                <p className="flex items-start gap-2 text-sm font-medium text-slate-900">
                  {r.correct ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  )}
                  {r.question}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Your answer: <span className="font-medium">{r.options[r.selected_index]}</span>
                  {!r.correct && (
                    <>
                      {" "}· Correct: <span className="font-medium text-emerald-700">{r.options[r.correct_index]}</span>
                    </>
                  )}
                </p>
                {r.explanation && <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{r.explanation}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!quiz && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(topics.data?.topics ?? []).map((topic) => {
            const s = statsFor(topic.id);
            return (
              <TopicCard
                key={topic.id}
                topic={topic}
                attempts={s.attempts}
                avg={s.avg}
                onPick={() => setDialogTopic(topic)}
              />
            );
          })}
          {topics.isPending && <p className="text-sm text-slate-500">Loading topics…</p>}
        </div>
      )}

      <Dialog open={dialogTopic !== null} onOpenChange={(open) => !open && setDialogTopic(null)}>
        <DialogContent className="max-w-md" data-testid="quiz-setup-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Start a quiz{dialogTopic ? ` — ${dialogTopic.name}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label>Difficulty</Label>
              <div className="mt-1.5 flex gap-2">
                {DIFFICULTIES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDifficulty(value)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                      difficulty === value ? "border-primary bg-primary/5 text-primary" : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                    data-testid={`quiz-difficulty-${value}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="quiz-count">Questions</Label>
              <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
                <SelectTrigger id="quiz-count" className="mt-1.5 w-full" data-testid="quiz-count-select">
                  <SelectValue>{(v: string) => `${v} questions`}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {[3, 5, 7, 10].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => generate.mutate()} disabled={generate.isPending} className="w-full" data-testid="quiz-generate-button">
              {generate.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating questions…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate quiz
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
