import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Check, Circle, Clock, Loader2, Play, RefreshCw, Route as RouteIcon, Sparkles } from "lucide-react";
import { apiGet, apiPatch, apiPost, errorMessage } from "@/lib/api";
import type { Roadmap, RoadmapTask, TaskStatus } from "@/lib/types";
import { TASK_TYPE_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TYPE_STYLES: Record<string, string> = {
  learn: "bg-[#F3E8FF] text-[#581C87] hover:bg-[#EDE9FE]",
  practice: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
  quiz: "bg-sky-50 text-sky-700 hover:bg-sky-100",
  mock: "bg-amber-50 text-amber-700 hover:bg-amber-100",
  revise: "bg-slate-100 text-slate-700 hover:bg-slate-200",
};

function TaskRow({ task, onStatus }: { task: RoadmapTask; onStatus: (status: TaskStatus) => void }) {
  const done = task.status === "completed";
  return (
    <li
      className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 transition-all duration-200 ease-out hover:shadow-xs"
      data-testid={`roadmap-task-${task.id}`}
    >
      <button
        type="button"
        onClick={() => onStatus(done ? "todo" : "completed")}
        aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
          done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white hover:border-primary"
        }`}
        data-testid={`roadmap-task-toggle-${task.id}`}
      >
        {done && <Check className="h-3.5 w-3.5" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${done ? "text-slate-400 line-through" : "text-slate-900"}`} data-testid={`roadmap-task-title-${task.id}`}>
          {task.title}
        </p>
        {task.description && <p className="mt-1 text-sm leading-relaxed text-slate-500">{task.description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge className={TYPE_STYLES[task.task_type] ?? TYPE_STYLES.revise}>{TASK_TYPE_LABELS[task.task_type]}</Badge>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3 w-3" /> {task.estimated_minutes} min
          </span>
          <span className="text-xs text-slate-400">{task.topic}</span>
        </div>
      </div>
      {!done && task.status !== "in_progress" && (
        <Button variant="ghost" size="xs" onClick={() => onStatus("in_progress")} data-testid={`roadmap-task-start-${task.id}`}>
          <Play className="h-3.5 w-3.5" /> Start
        </Button>
      )}
    </li>
  );
}

export default function RoadmapPage() {
  const queryClient = useQueryClient();
  const [weeks, setWeeks] = useState(2);
  const roadmap = useQuery({ queryKey: ["roadmap"], queryFn: () => apiGet<Roadmap | null>("/roadmap"), retry: 1 });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["roadmap"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const generate = useMutation({
    mutationFn: () => apiPost<Roadmap>("/roadmap/generate", { weeks }),
    onSuccess: () => {
      invalidate();
      toast.success("Your personalized roadmap is ready.");
    },
    onError: (err) => toast.error(errorMessage(err, "The AI mentor is unavailable right now — please try again shortly.")),
  });

  const setTaskStatus = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      apiPatch<Roadmap>(`/roadmap/tasks/${taskId}`, { status }),
    onSuccess: () => invalidate(),
    onError: () => toast.error("Could not update the task — please try again."),
  });

  if (roadmap.isPending) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" data-testid="roadmap-loading">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (roadmap.isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <p className="font-heading text-lg font-semibold text-slate-900">Couldn't load your roadmap</p>
          <Button variant="outline" onClick={() => roadmap.refetch()} data-testid="roadmap-retry-button">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const data = roadmap.data;

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Learning Roadmap</h1>
        <Card className="mt-4">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <RouteIcon className="h-7 w-7" />
            </span>
            <div>
              <p className="font-heading text-lg font-semibold text-slate-900" data-testid="roadmap-empty-title">No roadmap yet</p>
              <p className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-slate-500" data-testid="roadmap-empty-text">
                The AI mentor will build a weekly plan from your profile, target role, available time and the
                weak areas measured from your interviews and quizzes.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-48">
                <Select value={String(weeks)} onValueChange={(v) => setWeeks(Number(v))}>
                  <SelectTrigger data-testid="roadmap-weeks-select" aria-label="Roadmap length">
                    <SelectValue>{(v: string) => `${v}-week plan`}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((w) => (
                      <SelectItem key={w} value={String(w)}>{w}-week plan</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => generate.mutate()} disabled={generate.isPending} data-testid="roadmap-generate-button">
                {generate.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Designing your plan…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Generate my roadmap
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-slate-900">Learning Roadmap</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <CalendarDays className="h-4 w-4 text-primary" /> {data.weeks}-week plan for {data.target_role} ·{" "}
            created {new Date(data.created_at).toLocaleDateString()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => generate.mutate()} disabled={generate.isPending} data-testid="roadmap-regenerate-button">
          {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Regenerate
        </Button>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700" data-testid="roadmap-progress-label">Overall progress</p>
            <p className="font-heading text-xl font-semibold text-primary" data-testid="roadmap-progress-pct">{data.progress_pct}%</p>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200" data-testid="roadmap-progress-bar">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${data.progress_pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {data.tasks.filter((t) => t.status === "completed").length} of {data.tasks.length} tasks completed
          </p>
        </CardContent>
      </Card>

      {Array.from({ length: data.weeks }, (_, i) => i + 1).map((week) => {
        const weekTasks = data.tasks.filter((t) => t.week === week);
        if (weekTasks.length === 0) return null;
        return (
          <Card key={week}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base" data-testid={`roadmap-week-${week}`}>
                <Circle className="h-3 w-3 fill-primary text-primary" /> Week {week}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {weekTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onStatus={(status) => setTaskStatus.mutate({ taskId: task.id, status })}
                  />
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
