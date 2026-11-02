import { useEffect, useState } from "react";
import { Show } from "@/components/auth/ClerkAuthProvider";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Briefcase, Check, X } from "lucide-react";
import { apiGet, apiPost, errorMessage } from "@/lib/api";
import type { MeResponse, OnboardingInput, PrepLevel, Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEGREES = ["B.Tech", "B.E.", "B.Sc", "BCA", "M.Tech", "MCA", "M.Sc", "Other"];
const BRANCHES = [
  "Computer Science",
  "Information Technology",
  "Electronics & Communication",
  "Electrical & Electronics",
  "Mechanical",
  "Civil",
  "Chemical",
  "Other",
];
const TARGET_ROLES = [
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
const PREP_LEVELS: { value: PrepLevel; label: string; hint: string }[] = [
  { value: "beginner", label: "Beginner", hint: "Building the foundations" },
  { value: "intermediate", label: "Intermediate", hint: "Know the basics, need practice" },
  { value: "advanced", label: "Advanced", hint: "Strong fundamentals, polishing for interviews" },
];
const SCHEDULES = ["Mornings", "Afternoons", "Evenings", "Late nights", "Weekends only", "Flexible"];
const YEARS = Array.from({ length: 10 }, (_, i) => 2023 + i);
const STEPS = ["About you", "Skills & projects", "Goals & schedule"];

const EMPTY_FORM: OnboardingInput = {
  full_name: "",
  degree: "B.Tech",
  branch: "Computer Science",
  graduation_year: 2026,
  skills: [],
  projects: [],
  experience: "",
  target_role: "Software Engineer",
  prep_level: "beginner",
  weekly_hours: 8,
  schedule_pref: "Flexible",
};

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Onboarding progress">
      {STEPS.map((label, i) => (
        <li key={label} className="flex flex-1 flex-col gap-2">
          <div className={`h-1.5 rounded-full transition-colors duration-300 ${i <= step ? "bg-primary" : "bg-slate-200"}`} />
          <span className={`text-xs font-medium ${i <= step ? "text-primary" : "text-slate-400"}`}>{label}</span>
        </li>
      ))}
    </ol>
  );
}

function OnboardingInner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingInput>(EMPTY_FORM);
  const [skillDraft, setSkillDraft] = useState("");
  const [error, setError] = useState("");

  const me = useQuery({ queryKey: ["me"], queryFn: () => apiGet<MeResponse>("/users/me"), retry: 1 });

  // Prefill from an existing profile (re-running onboarding edits it).
  useEffect(() => {
    const profile: Profile | null = me.data?.profile ?? null;
    if (profile) setForm({ ...EMPTY_FORM, ...profile });
  }, [me.data]);

  const set = <K extends keyof OnboardingInput>(key: K, value: OnboardingInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const addSkill = () => {
    const parts = skillDraft.split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    set("skills", [...new Set([...form.skills, ...parts])].slice(0, 30));
    setSkillDraft("");
  };

  const save = useMutation({
    mutationFn: () => apiPost<Profile>("/users/onboarding", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Your profile is ready — welcome aboard!");
      navigate("/dashboard");
    },
    onError: (err) => toast.error(errorMessage(err, "Could not save your profile. Please try again.")),
  });

  const next = () => {
    if (step === 0 && form.full_name.trim().length < 2) return setError("Please enter your full name.");
    if (step === 1 && form.skills.length === 0) return setError("Add at least one skill so the coach can personalize questions.");
    setError("");
    setStep((s) => Math.min(2, s + 1));
  };

  const back = () => {
    setError("");
    setStep((s) => Math.max(0, s - 1));
  };

  return (
    <div className="min-h-svh bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B132B] text-white">
            <Briefcase className="h-5 w-5" />
          </span>
          <span className="font-heading text-lg font-semibold tracking-tight text-slate-900">Interview Coach</span>
        </div>

        <Card className="border-slate-200 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_10px_20px_-5px_rgba(15,23,42,0.04)]">
          <CardContent className="space-y-8 p-6 sm:p-8">
            <Stepper step={step} />

            {step === 0 && (
              <div className="space-y-5" data-testid="onboarding-step-education">
                <div>
                  <Label htmlFor="onboarding-full-name">Full name</Label>
                  <Input
                    id="onboarding-full-name"
                    value={form.full_name}
                    onChange={(e) => set("full_name", e.target.value)}
                    placeholder="Priya Sharma"
                    className="mt-1.5"
                    data-testid="onboarding-full-name-input"
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="onboarding-degree">Degree</Label>
                    <Select value={form.degree} onValueChange={(v) => set("degree", v)}>
                      <SelectTrigger id="onboarding-degree" className="mt-1.5 w-full" data-testid="onboarding-degree-select">
                        <SelectValue>{(v: string) => v}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {DEGREES.map((d) => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="onboarding-branch">Branch</Label>
                    <Select value={form.branch} onValueChange={(v) => set("branch", v)}>
                      <SelectTrigger id="onboarding-branch" className="mt-1.5 w-full" data-testid="onboarding-branch-select">
                        <SelectValue>{(v: string) => v}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {BRANCHES.map((b) => (
                          <SelectItem key={b} value={b}>{b}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="onboarding-year">Graduation year</Label>
                  <Select value={String(form.graduation_year)} onValueChange={(v) => set("graduation_year", Number(v))}>
                    <SelectTrigger id="onboarding-year" className="mt-1.5 w-full" data-testid="onboarding-year-select">
                      <SelectValue>{(v: string) => v}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6" data-testid="onboarding-step-skills">
                <div>
                  <Label htmlFor="onboarding-skills">Technical skills &amp; languages</Label>
                  <div className="mt-1.5 flex gap-2">
                    <Input
                      id="onboarding-skills"
                      value={skillDraft}
                      onChange={(e) => setSkillDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                      placeholder="Type a skill and press Enter — e.g. Python, SQL, React"
                      data-testid="onboarding-skills-input"
                    />
                    <Button variant="secondary" onClick={addSkill} data-testid="onboarding-skill-add-button">
                      Add
                    </Button>
                  </div>
                  {form.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2" data-testid="onboarding-skills-chips">
                      {form.skills.map((skill) => (
                        <span
                          key={skill}
                          className="flex items-center gap-1 rounded-full bg-[#F3E8FF] px-3 py-1 text-xs font-medium text-[#581C87]"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => set("skills", form.skills.filter((s) => s !== skill))}
                            aria-label={`Remove ${skill}`}
                            className="rounded-full p-0.5 hover:bg-purple-200"
                            data-testid={`onboarding-skill-remove-${skill.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="onboarding-projects">Projects — one per line</Label>
                  <Textarea
                    id="onboarding-projects"
                    value={form.projects.join("\n")}
                    onChange={(e) => set("projects", e.target.value.split("\n").map((p) => p.trim()).filter(Boolean))}
                    rows={4}
                    placeholder={"Campus placement portal — React, FastAPI, MongoDB\nImage classifier — Python, TensorFlow"}
                    className="mt-1.5"
                    data-testid="onboarding-projects-textarea"
                  />
                </div>
                <div>
                  <Label htmlFor="onboarding-experience">Experience or internships (optional)</Label>
                  <Textarea
                    id="onboarding-experience"
                    value={form.experience}
                    onChange={(e) => set("experience", e.target.value)}
                    rows={3}
                    placeholder="Summer intern at a fintech startup; led the college coding club…"
                    className="mt-1.5"
                    data-testid="onboarding-experience-textarea"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6" data-testid="onboarding-step-goals">
                <div>
                  <Label htmlFor="onboarding-role">Target job role</Label>
                  <Select value={form.target_role} onValueChange={(v) => set("target_role", v)}>
                    <SelectTrigger id="onboarding-role" className="mt-1.5 w-full" data-testid="onboarding-role-select">
                      <SelectValue>{(v: string) => v}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Current preparation level</Label>
                  <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
                    {PREP_LEVELS.map((level) => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => set("prep_level", level.value)}
                        className={`rounded-xl border p-3 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 ${
                          form.prep_level === level.value
                            ? "border-primary bg-primary/5 ring-2 ring-primary"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                        data-testid={`onboarding-level-${level.value}`}
                      >
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                          {form.prep_level === level.value && <Check className="h-4 w-4 text-primary" />}
                          {level.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500">{level.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="onboarding-hours">Weekly preparation time</Label>
                    <Select value={String(form.weekly_hours)} onValueChange={(v) => set("weekly_hours", Number(v))}>
                      <SelectTrigger id="onboarding-hours" className="mt-1.5 w-full" data-testid="onboarding-hours-select">
                        <SelectValue>{(v: string) => `${v} hours / week`}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 4, 6, 8, 10, 15, 20, 30, 40].map((h) => (
                          <SelectItem key={h} value={String(h)}>{h} hours / week</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="onboarding-schedule">Preferred study schedule</Label>
                    <Select value={form.schedule_pref} onValueChange={(v) => set("schedule_pref", v)}>
                      <SelectTrigger id="onboarding-schedule" className="mt-1.5 w-full" data-testid="onboarding-schedule-select">
                        <SelectValue>{(v: string) => v}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {SCHEDULES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700" data-testid="onboarding-error" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={back} disabled={step === 0} data-testid="onboarding-back-button">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              {step < 2 ? (
                <Button onClick={next} data-testid="onboarding-continue-button">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => save.mutate()} disabled={save.isPending} data-testid="onboarding-finish-button">
                  {save.isPending ? "Saving…" : "Finish setup"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Onboarding() {
  return (
    <>
      <Show when="signed-out">
        <Navigate to="/sign-in" replace />
      </Show>
      <Show when="signed-in">
        <OnboardingInner />
      </Show>
    </>
  );
}

