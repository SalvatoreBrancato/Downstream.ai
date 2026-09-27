import React from "react";
import { useTelemetry } from "@/context/TelemetryContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Network,
  GitBranch,
  Layers,
  ArrowDownUp,
  ArrowLeftRight,
  Code2,
  Sun,
  Moon,
} from "lucide-react";

export default function Header({ onOpenJsonModal }) {
  const {
    telemetryData,
    layoutDirection,
    toggleLayoutDirection,
    theme,
    toggleTheme,
  } = useTelemetry();

  const agentCount = telemetryData?.agents?.length || 0;
  const flowCount = telemetryData?.flows?.length || 0;

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.8)] transition-colors">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
          <Network className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Downstream AI
            </h1>
            <Badge variant="purple" className="text-[10px] py-0 px-1.5 uppercase tracking-wider font-semibold">
              Telemetry Map
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Multi-Agent Directed Graph & Dynamic Inspector
          </p>
        </div>
      </div>

      {/* Center Stats */}
      <div className="hidden md:flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700/60 shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <Layers className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
          <span>Agents:</span>
          <span className="font-semibold text-slate-900 dark:text-white font-mono">{agentCount}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700/60 shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <GitBranch className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>Flows:</span>
          <span className="font-semibold text-slate-900 dark:text-white font-mono">{flowCount}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700/60 shadow-sm dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] text-emerald-600 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-600 dark:text-slate-300">Cache:</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">Auto-saved</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Theme Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={theme === "dark"}
          onClick={toggleTheme}
          className="relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border border-slate-300 dark:border-slate-700 bg-slate-200/90 dark:bg-slate-900 p-1 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 shadow-inner"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className="sr-only">Toggle theme</span>
          <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none select-none">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span
            className={cn(
              "pointer-events-none relative z-10 flex h-6 w-6 transform items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-md transition-transform duration-300 ease-in-out border border-slate-200/90 dark:border-slate-700",
              theme === "dark" ? "translate-x-6" : "translate-x-0"
            )}
          >
            {theme === "dark" ? (
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            )}
          </span>
        </button>

        {/* Layout Direction Switch */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleLayoutDirection}
          className="text-xs gap-1.5 border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm"
          title="Toggle layout direction (Vertical / Horizontal)"
        >
          {layoutDirection === "TB" ? (
            <>
              <ArrowDownUp className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <span className="hidden sm:inline">Layout: Vertical</span>
            </>
          ) : (
            <>
              <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span className="hidden sm:inline">Layout: Horizontal</span>
            </>
          )}
        </Button>

        {/* JSON Drawer Modal Trigger */}
        <Button
          type="button"
          size="sm"
          onClick={onOpenJsonModal}
          className="text-xs gap-1.5 bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-sm"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Upload / Edit JSON</span>
        </Button>
      </div>
    </header>
  );
}
