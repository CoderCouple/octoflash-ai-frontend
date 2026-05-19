
/**
 * Thin macOS-style window chrome around any child. Used in the desktop
 * (Tauri / Electron) build to give the editor a real-window feel.
 *
 * Web build skips this entirely — `/editor` renders fullscreen inside
 * the app shell.
 */
export function DesktopChrome({
  title = "Octoflash AI — Editor",
  background = "linear-gradient(135deg, #d4d8e5 0%, #e2e6f0 100%)",
  children,
}: {
  title?: string;
  background?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="w-full h-full flex p-3.5"
      style={{
        background,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro", "Helvetica Neue", sans-serif',
      }}
    >
      <div className="flex-1 rounded-xl overflow-hidden bg-background relative flex flex-col shadow-[0_0_0_1px_rgba(0,0,0,0.18),0_18px_50px_rgba(0,0,0,0.28)]">
        {/* macOS titlebar */}
        <div className="flex items-center h-[30px] px-3 bg-muted/60 border-b shrink-0">
          <div className="flex gap-[7px]">
            <span className="size-3 rounded-full bg-[#ff5f57] border border-black/10" />
            <span className="size-3 rounded-full bg-[#febc2e] border border-black/10" />
            <span className="size-3 rounded-full bg-[#28c840] border border-black/10" />
          </div>
          <div className="flex-1 text-center text-xs font-medium text-muted-foreground">
            {title}
          </div>
          <div className="w-[50px]" />
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
