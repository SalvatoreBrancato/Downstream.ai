import React, { useState, useMemo, useEffect } from "react";
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
  Wrench,
  Globe,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { countTokens } from "@/utils/tokenCounter";

/**
 * InspectorSheet displays an offcanvas drawer with formatted JSON payloads,
 * system prompt, and tools/functions cards with descriptions.
 */
export default function InspectorSheet() {
  const { inspectorState, closeInspector, setInspectorTab, theme } =
    useTelemetry();
  const { isOpen, agent, tab } = inspectorState;

  const [copied, setCopied] = useState(false);
  const [toolsViewMode, setToolsViewMode] = useState("cards"); // 'cards' | 'json'
  const [tokenCount, setTokenCount] = useState(null);
  const [tokenError, setTokenError] = useState(false);

  // Compute displayed content and language based on active tab
  const { content, language, tabLabel } = useMemo(() => {
    if (!agent) {
      return { content: "", language: "json", tabLabel: "", icon: Terminal };
    }

    if (tab === "input") {
      const val = agent.last_input;
      return {
        content:
          typeof val === "object"
            ? JSON.stringify(val, null, 2)
            : String(val || "{}"),
        language: "json",
        tabLabel: "Last Input Payload",
        icon: ArrowDownToDot,
      };
    }

    if (tab === "output") {
      const val = agent.last_output;
      return {
        content:
          typeof val === "object"
            ? JSON.stringify(val, null, 2)
            : String(val || "{}"),
        language: "json",
        tabLabel: "Last Output Payload",
        icon: ArrowUpFromDot,
      };
    }

    if (tab === "tools") {
      const val = Array.isArray(agent.tools) ? agent.tools : [];
      return {
        content: JSON.stringify(val, null, 2),
        language: "json",
        tabLabel: "Tools & Functions",
        icon: Wrench,
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

  useEffect(() => {
    if (!isOpen || !agent || tab === "tools") return;

    let cancelled = false;
    setTokenCount(null);
    setTokenError(false);
    const text = tab === "system_prompt" && !agent.system_prompt ? "" : content;

    countTokens(text)
      .then((count) => {
        if (!cancelled) setTokenCount(count);
      })
      .catch((error) => {
        console.error("Failed to count tokens:", error);
        if (!cancelled) setTokenError(true);
      });

    return () => { cancelled = true; };
  }, [isOpen, agent, tab, content]);

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

  const toolsList = Array.isArray(agent.tools) ? agent.tools : [];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeInspector()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-0 flex flex-col h-full shadow-2xl"
      >
        {/* Header Section */}
        <SheetHeader className="p-6 pb-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-500 dark:text-sky-400 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {agent.name}
                </SheetTitle>
                <Badge
                  variant="outline"
                  className="font-mono text-[11px] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                >
                  {agent.id}
                </Badge>
                {agent.level !== undefined &&
                  agent.level !== null &&
                  String(agent.level).trim() !== "" && (
                    <Badge variant="purple" className="font-mono text-[11px]">
                      Level {agent.level}
                    </Badge>
                  )}
                {agent.web_search !== undefined && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono text-[11px] flex items-center gap-1",
                      agent.web_search
                        ? "text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-950/40"
                        : "text-slate-400 border-slate-200 dark:border-slate-800"
                    )}
                  >
                    <Globe className="w-3 h-3 text-sky-500 dark:text-sky-400" />
                    <span>{agent.web_search ? "Web Search" : "Offline"}</span>
                  </Badge>
                )}
              </div>
              <SheetDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {agent.description ||
                  agent.role ||
                  "AI Autonomous Telemetry Agent"}
              </SheetDescription>
            </div>
          </div>

          {/* Quick Tab Switcher inside the Inspector */}
          <div className="flex items-center justify-between pt-2 gap-2 flex-wrap">
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 text-xs flex-wrap gap-0.5">
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

              <button
                type="button"
                onClick={() => setInspectorTab("tools")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                  tab === "tools"
                    ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Tools</span>
                {toolsList.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300 font-mono">
                    {toolsList.length}
                  </span>
                )}
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
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Copied
                  </span>
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
        <div className="px-6 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-300">
              {tabLabel}
            </span>
            <span className="text-slate-400 dark:text-slate-500">•</span>
            <span className="font-mono uppercase text-[10px] text-slate-500 dark:text-slate-400">
              {tab === "tools" && toolsViewMode === "cards"
                ? "VIEW: CARDS"
                : language}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {tab === "tools" && (
              <div className="inline-flex rounded p-0.5 bg-slate-200/70 dark:bg-slate-800 border border-slate-300/70 dark:border-slate-700 text-[10px]">
                <button
                  type="button"
                  onClick={() => setToolsViewMode("cards")}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    toolsViewMode === "cards"
                      ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setToolsViewMode("json")}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    toolsViewMode === "json"
                      ? "bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  JSON
                </button>
              </div>
            )}
            <div className="font-mono text-[11px] text-slate-500 flex items-center gap-2 whitespace-nowrap">
              {tab !== "tools" && (
                <>
                  <span title="Estimated from this tab's text or JSON using the OpenAI o200k_base tokenizer; actual model usage may differ.">
                    {tokenError
                      ? "Tokens unavailable"
                      : tokenCount === null
                        ? "≈ … tokens"
                        : `≈ ${tokenCount.toLocaleString()} tokens`}
                  </span>
                  <span className="text-slate-400 dark:text-slate-600">•</span>
                </>
              )}
              <span>{content.length.toLocaleString()} characters</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {tab === "tools" && toolsViewMode === "cards" ? (
          <div className="flex-1 w-full overflow-y-auto p-6 space-y-4">
            {toolsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                  <Boxes className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Nessun Tool Configurato
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  Questo agente non ha funzioni o tool registrati. Puoi
                  aggiungerli specificando l&apos;array{" "}
                  <code className="text-sky-500 font-mono">tools: [...]</code>{" "}
                  nello schema JSON.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Funzioni Registrate ({toolsList.length})
                  </span>
                  {agent.web_search && (
                    <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> Web Search attiva
                    </span>
                  )}
                </div>

                {toolsList.map((tool, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:border-sky-500/40 transition-all shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {tool.name || `tool_${idx + 1}`}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono border-slate-200 dark:border-slate-700 text-slate-500 shrink-0"
                      >
                        function
                      </Badge>
                    </div>

                    <div className="pl-8">
                      {tool.description ? (
                        <div className="bg-white dark:bg-slate-950/70 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800/80">
                          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block mb-1">
                            Descrizione Funzione
                          </span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs italic text-slate-400 dark:text-slate-500">
                          Nessuna descrizione specificata per questa funzione.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Monaco Editor Container for Input, Output, System Prompt, and Tools JSON */
          <div
            className={`flex-1 w-full relative min-h-0 ${
              theme === "light" ? "bg-white" : "bg-[#1e1e1e]"
            }`}
          >
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
        )}

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
