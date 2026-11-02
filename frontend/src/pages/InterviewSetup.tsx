import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Briefcase, Code2, FolderKanban, Loader2, Smile, Sparkles, Users } from "lucide-react";
import { apiPost, errorMessage } from "@/lib/api";
import type { Difficulty, InterviewCreateInput, InterviewSession, InterviewType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ROLES = [
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "QA Engineer",
  "DevOps Engineer",
  "Product Manager",
  "Business Analyst",
];

const TYPES: { value: InterviewType; icon: typeof Users; label: string; desc: string }[] = [
  { value: "technical", icon: Code2, label: "Technical", desc: "DSA, OOP, CS fundamentals" },
  { value: "hr", icon: Users, label: "HR", desc: "Fit, strengths, classics" },
  { value: "project", icon: FolderKanban, label: "Project-based", desc: "Deep-dive into your projects" },
  { value: "behavioral", icon: Smile, label: "Behavioral", desc: "STAR-style situations" },
  { value: "role_specific", icon: Briefcase, label: "Role-specific", desc: "For your exact target role" },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export default function InterviewSetup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [role, setRole] = useState(ROLES[0]);
  const [customRole, setCustomRole] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [type, setType] = useState<InterviewType>("technical");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [count, setCount] = useState(5);

  const create = useMutation({
    mutationFn: (input: InterviewCreateInput) => apiPost<InterviewSession>("/interviews", input),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      navigate(`/interview/${session.id}`);
    },
    onError: (err) => toast.error(errorMessage(err, "The AI interviewer is unavailable right now — please try again in a moment.")),
  });

  const start = () => {
    const finalRole = useCustom ? customRole.trim() : role;
    if (finalRole.length < 2) {
      toast.error("Please choose or type a job role first.");
      return;
    }
    create.mutate({ role: finalRole, interview_type: type, difficulty, num_questions: count });
  };

  const busy = create.isPending;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Set up your mock interview</h1>
        <p className="mt-1 text-sm text-slate-500">
          The AI generates questions for your role and difficulty, scores every written answer, and asks
          follow-ups when it spots gaps.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-7 p-6 sm:p-8">
          <div>
            <Label htmlFor="interview-role">Job role</Label>
            <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
              {useCustom ? (
                <Input
                  id="interview-role"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="e.g. Cloud Support Engineer"
                  data-testid="interview-custom-role-input"
                />
              ) : (
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="interview-role" className="w-full" data-testid="interview-role-select">
                    <SelectValue>{(v: string) => v}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant="outline"
                type="button"
                onClick={() => setUseCustom((u) => !u)}
                data-testid="interview-toggle-custom-role-button"
                className="shrink-0"
              >
                {useCustom ? "Choose from list" : "Custom role"}
              </Button>
            </div>
          </div>

          <div>
            <Label>Interview type</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {TYPES.map(({ value, icon: Icon, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`rounded-xl border p-3 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 ${
                    type === value ? "border-primary bg-primary/5 ring-2 ring-primary" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                  data-testid={`interview-type-${value}`}
                >
                  <Icon className={`h-5 w-5 ${type === value ? "text-primary" : "text-slate-400"}`} />
                  <span className="mt-2 block text-sm font-semibold text-slate-900">{label}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-slate-500">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label>Difficulty</Label>
              <div className="mt-1.5 flex gap-2">
                {DIFFICULTIES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDifficulty(value)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                      difficulty === value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                    data-testid={`interview-difficulty-${value}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="interview-count">Number of questions</Label>
              <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
                <SelectTrigger id="interview-count" className="mt-1.5 w-full" data-testid="interview-count-select">
                  <SelectValue>{(v: string) => `${v} questions`}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <SelectItem key={n} value={String(n)}>{n} questions</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 border-t border-slate-100 pt-6">
            <Button onClick={start} disabled={busy} className="w-full sm:w-auto" data-testid="interview-start-button">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Preparing your interview…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Start Interview
                </>
              )}
            </Button>
            <p className="text-xs text-slate-400">
              Written answers only — the coach evaluates text and never uses your camera or microphone.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How scoring works</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-slate-500">
            Each answer is scored 0-10 on relevance, technical correctness, clarity, completeness and
            problem-solving approach. The final report converts your average into a 0-100 band. These are
            AI-generated estimates, not a real interviewer's judgment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
