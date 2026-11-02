import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRef, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  FileSearch,
  FileText,
  FileUp,
  Info,
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";
import { apiGet, apiUpload, errorMessage } from "@/lib/api";
import type { ResumeAnalysis } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const MAX_BYTES = 5 * 1024 * 1024;

function ScoreCard({ score }: { score: number }) {
  const tone = score >= 75 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-rose-600";
  const bar = score >= 75 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500";
  return (
    <Card className="border-0 bg-[#0B132B] text-white" data-testid="resume-score-card">
      <CardContent className="flex items-center gap-6 p-6">
        <div>
          <p className="text-xs font-medium text-slate-300">ATS readiness</p>
          <p className={`font-heading text-5xl font-semibold ${score >= 75 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-rose-400"}`} data-testid="resume-ats-score">
            {score}
          </p>
        </div>
        <div className="flex-1">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className={`h-full rounded-full ${bar} transition-all duration-700`} style={{ width: `${score}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            An estimate of how the resume performs against typical entry-level ATS screening.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function ListBlock({
  title,
  items,
  icon: Icon,
  tone,
  empty,
  testId,
}: {
  title: string;
  items: string[];
  icon: typeof Info;
  tone: string;
  empty: string;
  testId: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 text-base ${tone}`}>
          <Icon className="h-4.5 w-4.5" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">{empty}</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={`${i}-${item.slice(0, 24)}`} className="flex items-start gap-2 text-sm leading-relaxed text-slate-700" data-testid={testId}>
                <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${tone.replace("text-", "bg-")}`} />
                {item}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function AnalysisResult({ analysis }: { analysis: ResumeAnalysis }) {
  return (
    <div className="space-y-4" data-testid="resume-analysis-result">
      <ScoreCard score={analysis.ats_score} />

      {analysis.summary && (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm leading-relaxed text-slate-700" data-testid="resume-summary">{analysis.summary}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4.5 w-4.5 text-primary" /> Sections detected
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["Education", analysis.sections.education],
              ["Skills", analysis.sections.skills],
              ["Projects", analysis.sections.projects],
              ["Experience", analysis.sections.experience],
            ] as const
          ).map(([label, items]) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              {items.length === 0 ? (
                <p className="mt-1 text-sm text-slate-500">Not found in the resume.</p>
              ) : (
                <ul className="mt-1 space-y-1">
                  {items.slice(0, 8).map((item, i) => (
                    <li key={`${i}-${item.slice(0, 20)}`} className="text-sm text-slate-700">• {item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ListBlock title="Grammar & clarity" items={analysis.grammar_suggestions} icon={Sparkles} tone="text-primary" empty="No wording issues flagged." testId="resume-grammar-item" />
        <ListBlock title="Missing information" items={analysis.missing_information} icon={CircleAlert} tone="text-rose-600" empty="Nothing important is missing." testId="resume-missing-item" />
        <ListBlock title="Improvement recommendations" items={analysis.improvements} icon={Lightbulb} tone="text-amber-600" empty="No further recommendations." testId="resume-improvement-item" />
        <ListBlock
          title="Could not be extracted"
          items={analysis.extraction_notes}
          icon={Info}
          tone="text-slate-500"
          empty="Everything in the file was read cleanly — nothing was left unread."
          testId="resume-extraction-note"
        />
      </div>

      {analysis.jd_match && (
        <Card data-testid="resume-jd-match-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4.5 w-4.5 text-primary" /> Job description match
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.jd_match.matched_skills.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Matched skills</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {analysis.jd_match.matched_skills.map((s) => (
                    <Badge key={s} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100" data-testid="resume-jd-matched-skill">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {analysis.jd_match.missing_skills.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Skill gaps</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {analysis.jd_match.missing_skills.map((s) => (
                    <Badge key={s} variant="outline" className="border-rose-200 text-rose-700" data-testid="resume-jd-missing-skill">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {analysis.jd_match.verdict && <p className="text-sm leading-relaxed text-slate-700">{analysis.jd_match.verdict}</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ResumeAnalyzer() {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [result, setResult] = useState<ResumeAnalysis | null>(null);

  const resumes = useQuery({ queryKey: ["resumes"], queryFn: () => apiGet<ResumeAnalysis[]>("/resumes"), retry: 1 });

  const analyze = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      if (file) fd.append("file", file);
      fd.append("job_description", jd);
      return apiUpload<ResumeAnalysis>("/resumes/analyze", fd);
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Resume analysis ready.");
    },
    onError: (err) => toast.error(errorMessage(err, "The AI resume coach is unavailable — please try again shortly.")),
  });

  const pickFile = (picked: File | null) => {
    if (!picked) return;
    const dot = picked.name.lastIndexOf(".");
    const ext = dot === -1 ? "" : picked.name.slice(dot).toLowerCase();
    if (![".pdf", ".docx"].includes(ext)) {
      toast.error("Only PDF and DOCX files are supported.");
      return;
    }
    if (picked.size > MAX_BYTES) {
      toast.error("File too large — the limit is 5 MB.");
      return;
    }
    setFile(picked);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Resume Analyzer</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload a PDF or DOCX (max 5 MB). Add a job description to compare skills against the role.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5 p-6 sm:p-8">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition-colors duration-200 hover:border-primary/50 hover:bg-primary/5"
            data-testid="resume-upload-dropzone"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileUp className="h-6 w-6" />
            </span>
            <span className="text-sm font-medium text-slate-900">
              {file ? file.name : "Click to choose your resume"}
            </span>
            <span className="text-xs text-slate-500">
              {file ? `${(file.size / 1024).toFixed(0)} KB — click to change` : "PDF or DOCX, up to 5 MB"}
            </span>
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              data-testid="resume-file-input"
              aria-label="Resume file"
            />
          </button>

          <div>
            <Label htmlFor="resume-jd">Job description (optional)</Label>
            <Textarea
              id="resume-jd"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              rows={4}
              placeholder="Paste the posting you're targeting — the analyzer will match skills and flag gaps."
              className="mt-1.5"
              data-testid="resume-jd-textarea"
            />
          </div>

          <Button
            onClick={() => analyze.mutate()}
            disabled={!file || analyze.isPending}
            className="w-full sm:w-auto"
            data-testid="resume-analyze-button"
          >
            {analyze.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Reading your resume…
              </>
            ) : (
              <>
                <FileSearch className="h-4 w-4" /> Analyze resume
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && <AnalysisResult analysis={result} />}

      {!result && resumes.data && resumes.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Previous analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100">
              {resumes.data.slice(0, 8).map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setResult(r);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-slate-50"
                    data-testid={`resume-history-item-${r.id}`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate text-sm font-medium text-slate-900">{r.filename}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3 text-sm text-slate-500">
                      {new Date(r.created_at).toLocaleDateString()}
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100">{r.ats_score}/100</Badge>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
