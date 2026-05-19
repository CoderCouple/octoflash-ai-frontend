
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Scene } from "@octoflash/core";

/** Prompt tab — editable scene prompt + main text + compiled params. */
export function PromptTab({ scene }: { scene: Scene }) {
  return (
    <div className="flex-1 overflow-auto bg-muted/25">
      <div className="max-w-3xl mx-auto p-7 flex flex-col gap-4">
        <Field label="Scene prompt — sent to the planner">
          <Textarea defaultValue={scene.prompt} rows={6} className="text-[13px]" />
        </Field>

        <Field label="Main text — rendered in this scene">
          <Input defaultValue={scene.mainText} />
        </Field>

        <Field label="Compiled params · read-only">
          <pre className="font-mono text-[11px] leading-relaxed bg-muted rounded-md border p-3 overflow-x-auto">
{`{
  "template": "${scene.template}",
  "params": {
    "text": "${scene.mainText}",
    "duration": ${Math.round(scene.duration * 1000)},
    "style": "${scene.style}",
    "background": "${scene.bg}",
    "motionIntensity": ${scene.motion}
  }
}`}
          </pre>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
        {label}
      </div>
      {children}
    </div>
  );
}
