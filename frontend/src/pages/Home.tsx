import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/components/auth/ClerkAuthProvider";
import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Briefcase,
  Camera,
  CheckCircle2,
  ChevronDown,
  FileSearch,
  MessagesSquare,
  Mic,
  Route as RouteIcon,
  Sparkles,
  Star,
  TrendingUp,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import IntroSplash from "@/components/IntroSplash";

// ── Data ────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: MessagesSquare,
    title: "AI Mock Interviews",
    text: "HR, technical, project, behavioral and role-specific rounds — questions generated for your target role and difficulty.",
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: Volume2,
    title: "Voice-Powered Interview",
    text: "Questions are spoken aloud automatically. Dictate your answer by voice; transcription is instant and hands-free.",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: Camera,
    title: "Webcam Presence Analysis",
    text: "Optional camera integration tracks attention, expression and eye contact while you answer — just like a real interview.",
    color: "bg-sky-50 text-sky-600",
  },
  {
    icon: FileSearch,
    title: "Resume Analyzer",
    text: "Upload a PDF or DOCX and get section detection, clarity fixes, ATS score, and a job-description skill-gap match.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: RouteIcon,
    title: "Personalized Roadmap",
    text: "A weekly plan built from your profile, target role and the weak areas the AI coach actually measured.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: BrainCircuit,
    title: "Adaptive Difficulty",
    text: "Do well and questions get harder; struggle and the coach eases up, explains gaps, and generates follow-ups.",
    color: "bg-rose-50 text-rose-600",
  },
  {
    icon: TrendingUp,
    title: "Progress Analytics",
    text: "Track interview scores, quiz results and roadmap progress over time on one dashboard.",
    color: "bg-teal-50 text-teal-600",
  },
  {
    icon: Mic,
    title: "Technical Practice",
    text: "MCQ quizzes across nine core CS domains — C++, Python, DSA, DBMS, OS, networks and more — with instant explanations.",
    color: "bg-orange-50 text-orange-600",
  },
];

const STEPS = [
  { n: "01", title: "Create your profile", text: "Tell us your degree, skills, projects, target role and how much time you have each week." },
  { n: "02", title: "Practice with the AI", text: "Start a mock interview. Questions appear, are spoken aloud, and you answer by voice or text." },
  { n: "03", title: "Get scored feedback", text: "Every answer is scored on relevance, correctness, clarity and completeness, with model answers." },
  { n: "04", title: "Follow your roadmap", text: "Turn measured weak areas into a weekly task list and watch your scores climb." },
];

const ROLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Data Analyst", "Data Scientist", "ML Engineer", "QA Engineer",
  "DevOps Engineer", "Product Manager", "Business Analyst", "Internship",
];

const FAQS = [
  { q: "Does the AI really speak questions aloud?", a: "Yes — the interview room uses your browser's built-in Text-to-Speech engine. Questions play automatically when they appear, and you can replay them anytime using the Speak button." },
  { q: "How does voice answer recording work?", a: "Click 'Speak Answer' to activate your microphone. The browser's Speech Recognition API transcribes your speech in real time into the answer box. Hit 'Done & Submit' and the AI evaluates your transcribed text." },
  { q: "What does the webcam feature do?", a: "It's optional. When enabled, a lightweight pixel-analysis routine estimates attention, expression and eye contact — similar to what a remote interviewer would notice. No data leaves your device." },
  { q: "What resume formats are supported?", a: "PDF and DOCX files up to 5 MB. The analyzer reports clearly when text could not be extracted (e.g., a scanned-image PDF) versus when a section is genuinely missing." },
  { q: "Which interview types are available?", a: "HR, technical, project-based, behavioral and role-specific rounds at easy, medium or hard difficulty, with 3 to 10 questions per session." },
  { q: "How does the roadmap work?", a: "After onboarding, the AI plans your weeks using your profile, target role and weak areas measured from your interviews and quizzes. Tick tasks off and it re-plans as you improve." },
];

// ── Scroll-in animation helper ───────────────────────────────────────────────
function useFadeIn(threshold = 0.1) {
  const [visible, setVisible] = useState(false);
  const ref = (node: HTMLElement | null) => {
    if (!node) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(node);
  };
  return { ref, visible };
}

// ── Sub-components ───────────────────────────────────────────────────────────
function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "border-b border-slate-200/70 bg-white/95 shadow-sm backdrop-blur-xl" : "bg-transparent"}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md">
            <Briefcase className="h-4 w-4" />
          </span>
          <span className="font-bold text-lg tracking-tight text-slate-900">IntelliHire</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <a href="#features" className="transition-colors hover:text-indigo-600">Features</a>
          <a href="#how-it-works" className="transition-colors hover:text-indigo-600">How it works</a>
          <a href="#faq" className="transition-colors hover:text-indigo-600">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/sign-in">
            <Button variant="ghost" className="text-slate-700 hover:text-indigo-600">Sign in</Button>
          </Link>
          <Link to="/sign-up">
            <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 shadow-md">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#05080f] pb-24 pt-20 text-white">
      {/* Gradient mesh */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-violet-600/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-sky-600/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Placement Preparation
          </div>

          <h1 className="font-black text-4xl sm:text-5xl md:text-6xl leading-tight tracking-tight">
            Ace your campus{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-sky-400 bg-clip-text text-transparent">
              interviews
            </span>{" "}
            with AI coaching
          </h1>

          <p className="mt-6 text-lg sm:text-xl leading-relaxed text-slate-300">
            IntelliHire speaks interview questions aloud, listens to your voice answers, opens your camera to track presence, then gives scored feedback and a follow-up — exactly like a real interviewer.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link to="/sign-up">
              <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-8 py-4 text-base shadow-lg hover:opacity-90 hover:shadow-indigo-500/30">
                Start Preparing for Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/sign-in">
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 bg-transparent hover:bg-white/5 hover:text-white px-8 py-4 text-base">
                Sign in to continue
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
            {["AI Mock Interview", "Voice Q&A", "Resume Analyzer", "Learning Roadmap"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Mock UI card */}
        <div className="mx-auto mt-16 max-w-2xl">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm">
            {/* Window chrome */}
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-rose-500" />
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="ml-2 text-xs text-slate-400">IntelliHire — AI Interview Room</span>
            </div>
            <div className="p-6 space-y-4">
              {/* Bot message */}
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600">
                  <Bot className="h-4 w-4 text-white" />
                </span>
                <div className="rounded-2xl rounded-tl-sm bg-white/10 px-4 py-3 text-sm text-slate-200 leading-relaxed">
                  How would you design a scalable REST API with caching, authentication, and proper error handling?
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-300">
                    <Volume2 className="h-3 w-3 animate-pulse" /> Speaking question aloud…
                  </div>
                </div>
              </div>
              {/* Webcam strip */}
              <div className="flex items-center gap-2 rounded-xl bg-black/30 border border-white/10 px-3 py-2 text-xs text-emerald-400">
                <Camera className="h-3.5 w-3.5" />
                Camera active · Attention 91% · Expression: confident
              </div>
              {/* User answer recording */}
              <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5">
                <Mic className="h-4 w-4 text-rose-400 animate-pulse" />
                <span className="text-sm text-rose-300">Recording your voice answer…</span>
                <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-xs text-white">LIVE</span>
              </div>
              {/* Score pill */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Previous answer score</span>
                <span className="rounded-full bg-emerald-900/60 px-3 py-1 text-sm font-bold text-emerald-400">8.5 / 10</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const { ref, visible } = useFadeIn();
  return (
    <section id="features" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center mb-16" ref={ref as any}>
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Everything you need</p>
          <h2 className={`mt-3 text-3xl sm:text-4xl font-black text-slate-900 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            Built for campus placement prep
          </h2>
          <p className="mt-4 text-slate-600">
            One platform covers mock interviews, resume review, technical quizzes, and your personalized roadmap — all powered by AI.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${f.color}`}>
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-bold text-slate-900">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { ref, visible } = useFadeIn();
  return (
    <section id="how-it-works" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center mb-16" ref={ref as any}>
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">How it works</p>
          <h2 className={`mt-3 text-3xl sm:text-4xl font-black text-slate-900 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            From signup to offer-ready in 4 steps
          </h2>
        </div>
        <div className="relative grid gap-8 md:grid-cols-4">
          {/* connector line */}
          <div className="absolute top-10 left-0 right-0 hidden h-0.5 bg-gradient-to-r from-indigo-200 via-violet-200 to-sky-200 md:block" style={{ width: "75%", margin: "0 12.5%" }} />
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className={`flex flex-col items-center text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xl font-black text-white shadow-lg shadow-indigo-200">
                {s.n}
              </div>
              <h3 className="mt-4 font-bold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RolesStrip() {
  return (
    <section className="overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-700 py-8">
      <p className="mb-4 text-center text-sm font-semibold uppercase tracking-widest text-indigo-200">
        Practice for any target role
      </p>
      <div className="flex gap-4 animate-scroll-x whitespace-nowrap">
        {[...ROLES, ...ROLES].map((r, i) => (
          <span
            key={`${r}-${i}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white"
          >
            <Star className="h-3 w-3 text-amber-300" /> {r}
          </span>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(null);
  const { ref, visible } = useFadeIn();
  return (
    <section id="faq" className="bg-slate-50 py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-12 text-center" ref={ref as any}>
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">FAQ</p>
          <h2 className={`mt-3 text-3xl font-black text-slate-900 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            Common questions
          </h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
                onClick={() => setOpen(open === i ? null : i)}
              >
                {faq.q}
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <div className="px-6 pb-4 text-sm leading-relaxed text-slate-600">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand() {
  const { ref, visible } = useFadeIn();
  return (
    <section className="bg-[#05080f] py-24" ref={ref as any}>
      <div className="mx-auto max-w-3xl px-4 text-center">
        <div className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            Your next campus offer{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              starts today
            </span>
          </h2>
          <p className="mt-4 text-slate-400 text-lg">
            Join thousands of students who are practising smarter, scoring higher, and landing offers faster with IntelliHire.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/sign-up">
              <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-8 py-4 text-base shadow-lg hover:opacity-90">
                Start Preparing — It's Free <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 text-xs text-slate-400 sm:flex-row sm:justify-between sm:gap-0">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
            <Briefcase className="h-3 w-3" />
          </span>
          <span className="font-semibold text-slate-700">IntelliHire</span>
        </div>
        <p className="max-w-sm text-center md:text-left">
          AI scores are estimates based on written or transcribed answers. No audio or video data leaves your device.
        </p>
        <p>© {new Date().getFullYear()} IntelliHire</p>
      </div>
    </footer>
  );
}

// ── Main Export ──────────────────────────────────────────────────────────────
function PublicLanding({ redirectAfterIntro = false }: { redirectAfterIntro?: boolean }) {
  const [introVisible, setIntroVisible] = useState(() => {
    try {
      const seenAt = Number(
        window.sessionStorage.getItem("interview-coach-intro-seen")
      );
      const recentlySeen =
        Number.isFinite(seenAt) &&
        seenAt > 0 &&
        Date.now() - seenAt < 30 * 60 * 1000;
      return !recentlySeen;
    } catch {
      return true;
    }
  });

  const finishIntro = useCallback(() => {
    try {
      window.sessionStorage.setItem(
        "interview-coach-intro-seen",
        String(Date.now())
      );
    } catch {
      // Storage may be disabled.
    }
    setIntroVisible(false);
  }, []);

  if (introVisible) return <IntroSplash onComplete={finishIntro} />;

  if (redirectAfterIntro) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
        <div className="min-h-svh bg-slate-50 text-slate-900">
          {/* Inject scroll-x keyframe */}
          <style>{`
            @keyframes scroll-x {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-scroll-x {
              animation: scroll-x 28s linear infinite;
              width: max-content;
            }
          `}</style>
          <LandingNav />
          <main>
            <Hero />
            <Features />
            <HowItWorks />
            <RolesStrip />
            <Faq />
            <CtaBand />
          </main>
          <Footer />
        </div>
  );
}

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  return <PublicLanding redirectAfterIntro={isSignedIn} />;
}