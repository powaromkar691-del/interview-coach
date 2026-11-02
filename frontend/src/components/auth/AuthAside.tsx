import { Briefcase, CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

// Branded navy side panel for the split auth screens (hidden on small screens so the
// Clerk widget gets the full width).
export default function AuthAside({ headline, sub, points }: { headline: string; sub: string; points: string[] }) {
  return (
    <aside className="hidden flex-col justify-between bg-[#0B132B] p-10 text-white lg:flex">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
          <Briefcase className="h-5 w-5" />
        </span>
        <span className="font-heading text-lg font-semibold tracking-tight">Interview Coach</span>
      </div>

      <div className="max-w-md">
        <h1 className="font-heading text-4xl font-semibold tracking-tight">{headline}</h1>
        <p className="mt-3 text-base leading-relaxed text-slate-300">{sub}</p>
        <ul className="mt-8 space-y-4">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-3 text-sm text-slate-200">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-purple-400" />
              {point}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-slate-500">Scores are AI-generated estimates based on your written answers.</p>
    </aside>
  );
}

export function AuthCenter({ children, testId }: { children: ReactNode; testId: string }) {
  return (
    <div className="flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md" data-testid={testId}>
        {children}
      </div>
    </div>
  );
}
