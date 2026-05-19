
import { Check, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const steps = [
  { t: "Fetching video metadata",  done: true },
  { t: "Downloading audio track",  done: true },
  { t: "Transcribing (whisper-v3)",done: true },
  { t: "Extracting key concepts",  done: false, active: true },
  { t: "Generating scene plan",    done: false },
  { t: "Drafting prompt",          done: false },
];

export function AnalyzingState() {
  return (
    <div className="h-full flex items-center justify-center bg-muted/30 p-10">
      <Card className="w-[480px] p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="size-8 rounded-full bg-warning/15 text-warning flex items-center justify-center">
            <Loader2 className="size-4 animate-spin" />
          </span>
          <div>
            <div className="text-sm font-semibold">Analyzing source</div>
            <div className="text-xs text-muted-foreground">This usually takes 30–90 seconds.</div>
          </div>
        </div>

        <ul className="flex flex-col gap-2 mb-4">
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-2.5 text-[13px]">
              <span
                className={
                  "size-[18px] rounded-full flex items-center justify-center text-[10px] " +
                  (s.done ? "bg-success text-white"
                          : s.active ? "bg-warning/20" : "bg-muted")
                }
              >
                {s.done && <Check className="size-2.5" />}
                {s.active && <span className="size-1.5 rounded-full bg-warning animate-pulse" />}
              </span>
              <span className={s.done ? "text-muted-foreground line-through" : ""}>{s.t}</span>
            </li>
          ))}
        </ul>

        <Progress value={48} className="h-1" />
        <div className="flex justify-between text-[11px] text-muted-foreground mt-2">
          <span>Step 4 of 6</span><span>~38s remaining</span>
        </div>
      </Card>
    </div>
  );
}
