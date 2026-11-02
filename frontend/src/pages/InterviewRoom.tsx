import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowRight,
  Bot,
  Camera,
  CameraOff,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Eye,
  Lightbulb,
  Loader2,
  Mic,
  MicOff,
  Send,
  SmilePlus,
  Volume2,
  VolumeX,
} from "lucide-react";
import { apiGet, apiPost, errorMessage } from "@/lib/api";
import type { AnswerResponse, InterviewQuestion, InterviewSession } from "@/lib/types";
import { DIFFICULTY_LABELS, INTERVIEW_TYPE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import ReportView from "@/components/report/ReportView";

// ─── Camera lighting helper (runs in browser, no server needed) ─────────────
interface FaceMetrics {
  lighting: number; // 0-100 relative camera-frame brightness estimate
  wellLit: boolean;
}

// This is deliberately a lighting-quality check, not facial, emotion, attention,
// or eye-contact recognition. It runs locally and does not identify the user.
function analyzeCameraLighting(video: HTMLVideoElement, canvas: HTMLCanvasElement): FaceMetrics {
  const ctx = canvas.getContext("2d");
  if (!ctx || !video.videoWidth || !video.videoHeight) return { lighting: 0, wellLit: false };
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  try {
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let total = 0;
    let samples = 0;
    // Sample a subset of pixels to keep the periodic check inexpensive.
    for (let i = 0; i < data.length; i += 64) {
      total += (data[i] + data[i + 1] + data[i + 2]) / 3;
      samples += 1;
    }
    const lighting = samples ? Math.round(total / samples / 2.55) : 0;
    return { lighting, wellLit: lighting >= 35 };
  } catch {
    return { lighting: 0, wellLit: false };
  }
}

// ─── Feedback Panel ──────────────────────────────────────────────────────────
function FeedbackPanel({ result }: { result: AnswerResponse }) {
  const ev = result.evaluation;
  return (
    <Card data-testid="interview-feedback-panel">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Lightbulb className="h-4.5 w-4.5 text-primary" /> Coach feedback
          </span>
          <span
            className={`rounded-full px-3 py-1 text-sm font-bold ${
              ev.score >= 7 ? "bg-emerald-50 text-emerald-700" : ev.score >= 5 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
            }`}
            data-testid="interview-feedback-score"
          >
            {ev.score.toFixed(1)}/10
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-slate-700" data-testid="interview-feedback-text">{ev.feedback}</p>
        {ev.strengths?.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Strengths</p>
            <ul className="mt-1 space-y-1">
              {ev.strengths.map((s) => (
                <li key={s.slice(0, 32)} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {ev.improvements?.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Gaps to close</p>
            <ul className="mt-1 space-y-1">
              {ev.improvements.map((a) => (
                <li key={a.slice(0, 32)} className="flex items-start gap-2 text-sm text-slate-700">
                  <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
        {ev.suggested_answer && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700" data-testid="interview-model-answer">
            <p className="font-semibold text-slate-900">What a strong answer looks like:</p>
            <p className="mt-1">{ev.suggested_answer}</p>
          </div>
        )}
        {ev.missing_concepts?.length > 0 && (
          <p className="text-xs text-slate-500">
            Concepts to review: <span className="font-medium text-slate-700">{ev.missing_concepts.join(", ")}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Camera Quality Panel ─────────────────────────────────────────────────────
function FacePanel({ metrics }: { metrics: FaceMetrics | null }) {
  if (!metrics) return null;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs">
      <Eye className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
      <span className="text-indigo-800">
        <span className="font-semibold">Lighting:</span> {metrics.wellLit ? "Adequate" : "Low — consider adding light"} ({metrics.lighting}%) ·
        <span className="font-semibold"> Camera feed:</span> Live
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function InterviewRoom() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const sessionQ = useQuery({
    queryKey: ["interview", id],
    queryFn: () => apiGet<InterviewSession>(`/interviews/${id}`),
    retry: 1,
  });

  const [active, setActive] = useState<InterviewQuestion | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<AnswerResponse | null>(null);

  // TTS / STT
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Webcam + local camera-quality check
  const [webcamOn, setWebcamOn] = useState(false);
  const [faceMetrics, setFaceMetrics] = useState<FaceMetrics | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const session = sessionQ.data;

  // Pick the first unanswered question when session loads
  useEffect(() => {
    if (!session || session.status !== "in_progress" || active) return;
    const answered = new Set(session.answers.map((a) => a.question_id));
    const nextQ = session.questions.find((q) => !answered.has(q.id)) ?? null;
    setActive(nextQ);
  }, [session, active]);

  // Auto-speak when new question arrives
  useEffect(() => {
    if (active?.question) {
      // Small delay so user sees the question rendered first
      const t = setTimeout(() => speakQuestion(active.question), 500);
      return () => clearTimeout(t);
    }
  }, [active?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── TTS ──
  const speakQuestion = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) {
      toast.error("Text-to-speech not supported in this browser.");
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    // Prefer a natural female voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) =>
      v.name.toLowerCase().includes("female") ||
      v.name.includes("Zira") ||
      v.name.includes("Samantha") ||
      v.name.includes("Google UK English Female")
    );
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking]);

  // ── STT ──
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // Stop TTS first
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        toast.info("🎤 Listening... speak your answer clearly.");
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + " ";
        }
        setAnswer(transcript.trim());
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== "no-speech") {
          toast.error(`Microphone error: ${event.error}`);
        }
      };

      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  // ── Webcam ──
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setWebcamOn(true);
      toast.success("Camera preview started — a basic lighting check is running locally.");

      // Check camera-frame lighting every 3 seconds; no face or emotion recognition is performed.
      faceIntervalRef.current = setInterval(() => {
        if (videoRef.current && canvasRef.current) {
          const metrics = analyzeCameraLighting(videoRef.current, canvasRef.current);
          setFaceMetrics(metrics);
        }
      }, 3000);
    } catch (err: any) {
      toast.error(`Camera access denied: ${err.message || "check browser permissions."}`);
    }
  };

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (faceIntervalRef.current) {
      clearInterval(faceIntervalRef.current);
      faceIntervalRef.current = null;
    }
    setWebcamOn(false);
    setFaceMetrics(null);
  }, []);

  // ── Submit answer ──
  const submit = useMutation({
    mutationFn: () =>
      apiPost<AnswerResponse>(`/interviews/${id}/answer`, {
        answer,
        
      }),
    onSuccess: (data) => {
      if (isSpeaking) { window.speechSynthesis.cancel(); setIsSpeaking(false); }
      if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
      setResult(data);
      setAnswer("");
      queryClient.invalidateQueries({ queryKey: ["interview", id] });
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => toast.error(errorMessage(err, "The AI interviewer is unavailable — please try again.")),
  });

  // ── Submit when recording stops with content ──
  const stopAndSubmit = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
    // Small delay to let final recognition results settle
    setTimeout(() => {
      if (answer.trim().length >= 5) {
        submit.mutate();
      }
    }, 800);
  };

  if (sessionQ.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" data-testid="interview-room-loading">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sessionQ.isError || !session) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <CircleAlert className="h-8 w-8 text-rose-500" />
          <p className="font-heading text-lg font-semibold text-slate-900">Couldn't load this interview</p>
          <Button variant="outline" onClick={() => sessionQ.refetch()} data-testid="interview-room-retry-button">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Finished — show report
  if (session.status === "completed" && !result) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Feedback report</h1>
          <div className="flex gap-2">
            <Link to="/interview" data-testid="report-new-interview-link">
              <Button variant="outline" size="sm">New interview</Button>
            </Link>
            <Link to="/dashboard" data-testid="report-dashboard-link">
              <Button size="sm">Dashboard</Button>
            </Link>
          </div>
        </div>
        <ReportView session={session} />
      </div>
    );
  }

  const answeredIds = new Set(session.answers.map((a) => a.question_id));
  const baseDone = session.questions.filter((q) => !q.is_follow_up && answeredIds.has(q.id)).length;
  const progress = Math.min(100, Math.round((100 * baseDone) / session.num_questions));
  const isFollowUp = active?.is_follow_up ?? false;
  // If active is follow-up, show the current question number as baseDone (the question being followed up)
  // If active is base question, questionNumber is baseDone + 1
  const questionNumber = isFollowUp ? Math.max(1, baseDone) : Math.min(session.num_questions, baseDone + 1);

  const continueToInterview = () => {
    if (!result) return;
    if (result.status === "completed") {
      setResult(null);
    } else {
      setActive(result.next_question);
      setResult(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-xl font-semibold tracking-tight text-slate-900" data-testid="interview-room-title">
            {session.role}
          </h1>
          <Badge variant="secondary">{INTERVIEW_TYPE_LABELS[session.interview_type]}</Badge>
          <Badge className="bg-[#F3E8FF] text-[#581C87] hover:bg-[#EDE9FE]">{DIFFICULTY_LABELS[session.difficulty]}</Badge>
        </div>
        <p className="text-sm text-slate-500" data-testid="interview-progress-label">
          Question {questionNumber} of {session.num_questions}
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200" data-testid="interview-progress-bar">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Face analysis info */}
      {faceMetrics && <FacePanel metrics={faceMetrics} />}

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left: Question + answer */}
        <div className="space-y-4 lg:col-span-7">
          {/* AI Interviewer card */}
          <Card className="border-0 bg-[#0F172A] text-slate-100 shadow-md">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                    <Bot className="h-4.5 w-4.5 text-indigo-300" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">AI Interviewer</p>
                    <p className="text-xs text-slate-400">
                      {isFollowUp ? "Follow-up question" : `Question ${questionNumber}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Speak question button */}
                  {active && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => active && speakQuestion(active.question)}
                      className={`text-xs text-indigo-200 hover:text-white hover:bg-white/10 ${
                        isSpeaking ? "bg-indigo-600/40 text-indigo-300 animate-pulse" : ""
                      }`}
                      title={isSpeaking ? "Stop speaking" : "Speak question aloud"}
                    >
                      {isSpeaking
                        ? <><VolumeX className="h-4 w-4 mr-1 text-rose-400" /> Stop</>
                        : <><Volume2 className="h-4 w-4 mr-1" /> Speak</>}
                    </Button>
                  )}
                  {/* Webcam toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={webcamOn ? stopWebcam : startWebcam}
                    className={`text-xs hover:bg-white/10 ${
                      webcamOn ? "text-emerald-300 bg-emerald-900/30" : "text-slate-300"
                    }`}
                    title={webcamOn ? "Stop webcam" : "Enable camera preview and lighting check"}
                  >
                    {webcamOn
                      ? <><CameraOff className="h-4 w-4 mr-1" /> Camera Off</>
                      : <><Camera className="h-4 w-4 mr-1" /> Enable Camera</>}
                  </Button>
                  {active && (
                    <Badge className="bg-white/10 text-slate-200 hover:bg-white/10">{active.topic}</Badge>
                  )}
                </div>
              </div>

              <p className="font-heading text-lg leading-relaxed sm:text-xl" data-testid="interview-question-text">
                {active ? active.question : "Loading question…"}
              </p>

              {/* Webcam preview */}
              {webcamOn && (
                <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full max-h-36 object-cover opacity-90"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-xs text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Camera active · Lighting check only
                  </div>
                  {faceMetrics && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                      <SmilePlus className="h-3 w-3 text-indigo-300" />
                      Lighting {faceMetrics.lighting}%
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* After submit: continue card */}
          {result ? (
            <Card data-testid="interview-submitted-card">
              <CardContent className="space-y-4 p-6">
                <p className="text-sm text-slate-500">Your answer was evaluated — see the coach feedback panel.</p>
                <Button onClick={continueToInterview} data-testid="interview-continue-button">
                  {result.status === "completed"
                    ? "View final report"
                    : result.next_question?.is_follow_up
                    ? "Answer the follow-up"
                    : "Next question"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            // Answer input
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label htmlFor="interview-answer" className="text-sm font-medium text-slate-700">
                    Your answer
                  </label>
                  <div className="flex items-center gap-2">
                    {/* Mic button */}
                    <Button
                      type="button"
                      variant={isListening ? "destructive" : "secondary"}
                      size="sm"
                      onClick={toggleListening}
                      className="text-xs flex items-center gap-1.5"
                    >
                      {isListening ? (
                        <><MicOff className="h-3.5 w-3.5 animate-pulse" /> Stop Recording</>
                      ) : (
                        <><Mic className="h-3.5 w-3.5 text-indigo-600" /> Speak Answer</>
                      )}
                    </Button>
                    {/* Stop & auto-submit */}
                    {isListening && answer.trim().length >= 5 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={stopAndSubmit}
                        className="text-xs border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                      >
                        <Send className="h-3.5 w-3.5 mr-1" /> Done & Submit
                      </Button>
                    )}
                  </div>
                </div>

                {/* Recording indicator */}
                {isListening && (
                  <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 animate-pulse border border-rose-200">
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                    Recording your voice in real time... speak into your microphone.
                  </div>
                )}

                <Textarea
                  id="interview-answer"
                  value={answer}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAnswer(e.target.value)}
                  rows={9}
                  placeholder="Type your response or click 'Speak Answer' to dictate through your microphone..."
                  className="resize-y"
                  data-testid="interview-answer-textarea"
                />

                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">{answer.trim().length} characters — aim for 3-8 sentences.</p>
                  <Button
                    onClick={() => submit.mutate()}
                    disabled={submit.isPending || answer.trim().length < 2}
                    data-testid="interview-submit-answer-button"
                  >
                    {submit.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Evaluating…</>
                    ) : (
                      <>Submit answer <Send className="h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right rail: rubric or feedback */}
        <div className="space-y-4 lg:col-span-5">
          {result ? (
            <FeedbackPanel result={result} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What a strong answer covers</CardTitle>
              </CardHeader>
              <CardContent>
                {active && active.criteria.length > 0 ? (
                  <ul className="space-y-2" data-testid="interview-criteria-list">
                    {active.criteria.map((c) => (
                      <li key={c.slice(0, 32)} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {c}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">Answer with a clear definition, an example, and why it matters.</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-5">
              <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
                <ChevronDown className="hidden" />
                Questions are spoken aloud automatically. Enable your camera for a local lighting-quality check. Dictate your answers hands-free using the microphone button.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
