import React, { useState, useMemo } from "react";
import Editor from "@monaco-editor/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTelemetry } from "@/context/TelemetryContext";
import {
  Copy,
  Check,
  ArrowDownToDot,
  ArrowUpFromDot,
  Terminal,
  Bot,
  FileCode2,
} from "lucide-react";

/**
 * InspectorSheet displays an offcanvas drawer with a read-only Monaco Editor
 * showing formatted JSON payloads or system prompt for the inspected agent.
 */
export default function InspectorSheet() {
  const { inspectorState, closeInspector, setInspectorTab, theme } = useTelemetry();
  const { isOpen, agent, tab } = inspectorState;

  const [copied, setCopied] = useState(false);

  // Compute displayed content and language based on active tab
  const { content, language, tabLabel } = useMemo(() => {
    if (!agent) {
      return { content: "", language: "json", tabLabel: "", icon: Terminal };
    }

    if (tab === "input") {
      const val = agent.last_input;
      return {
        content: typeof val === "object" ? JSON.stringify(val, null, 2) : String(val || "{}"),
        language: "json",
        tabLabel: "Last Input Payload",
        icon: ArrowDownToDot,
      };
    }

    if (tab === "output") {
      const val = agent.last_output;
      return {
        content: typeof val === "object" ? JSON.stringify(val, null, 2) : String(val || "{}"),
        language: "json",
        tabLabel: "Last Output Payload",
        icon: ArrowUpFromDot,
      };
    }

    // Default to system prompt
    return {
      content: agent.system_prompt || "// No system prompt specified",
      language: "markdown",
      tabLabel: "System Prompt",
      icon: Terminal,
    };
  }, [agent, tab]);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  if (!agent) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeInspector()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-0 flex flex-col h-full shadow-2xl transition-colors"
      >
        {/* Header Section */}
        <SheetHeader className="p-6 pb-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-500 dark:text-sky-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {agent.name}
                </SheetTitle>
                <Badge variant="outline" className="font-mono text-[11px] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800">
                  {agent.id}
                </Badge>
                {agent.level !== undefined && agent.level !== null && String(agent.level).trim() !== "" && (
                  <Badge variant="purple" className="font-mono text-[11px]">
                    Level {agent.level}
                  </Badge>
                )}
              </div>
              <SheetDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {agent.role || "AI Autonomous Telemetry Agent"}
              </SheetDescription>
            </div>
          </div>

          {/* Quick Tab Switcher inside the Inspector */}
          <div className="flex items-center justify-between pt-2">
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setInspectorTab("input")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                  tab === "input"
                    ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <ArrowDownToDot className="w-3.5 h-3.5" />
                Input
              </button>

              <button
                type="button"
                onClick={() => setInspectorTab("output")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                  tab === "output"
                    ? "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <ArrowUpFromDot className="w-3.5 h-3.5" />
                Output
              </button>

              <button
                type="button"
                onClick={() => setInspectorTab("system_prompt")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                  tab === "system_prompt"
                    ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                Prompt
              </button>
            </div>

            {/* Copy Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="text-xs gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </Button>
          </div>
        </SheetHeader>

        {/* Content Meta Bar */}
        <div className="px-6 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-300">{tabLabel}</span>
            <span className="text-slate-400 dark:text-slate-500">•</span>
            <span className="font-mono uppercase text-[10px] text-slate-500 dark:text-slate-400">
              {language}
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            {content.length} characters
          </div>
        </div>

        {/* Monaco Editor Container */}
        <div className={`flex-1 w-full relative min-h-0 ${theme === "light" ? "bg-white" : "bg-[#1e1e1e]"}`}>
          <Editor
            height="100%"
            language={language}
            theme={theme === "light" ? "light" : "vs-dark"}
            value={content}
            loading={
              <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                Loading Monaco editor...
              </div>
            }
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              automaticLayout: true,
              lineNumbers: "on",
              renderLineHighlight: "all",
              padding: { top: 12, bottom: 12 },
              domReadOnly: true,
            }}
          />
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Telemetry Inspection Mode: Read-Only</span>
          <Button
            size="xs"
            variant="ghost"
            onClick={closeInspector}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
