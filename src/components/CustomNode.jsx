import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Bot, ArrowDownToDot, ArrowUpFromDot, Terminal } from "lucide-react";
import { useTelemetry } from "@/context/TelemetryContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * CustomNode component for React Flow representing an AI Agent.
 * Displays agent details and action buttons to inspect Input, Output, and System Prompt.
 * Fully supports both Light Mode and High-Contrast Dark Mode.
 */
function CustomNode({
  id,
  data,
  selected,
  targetPosition = Position.Top,
  sourcePosition = Position.Bottom,
}) {
  const { selectedAgentId, setSelectedAgentId, openInspector, theme } =
    useTelemetry();

  const isCurrentActive = selectedAgentId === id || selected;
  const isLight = theme === "light";
  const { name, role, system_prompt, last_input, last_output, level } = data;

  const handleCardClick = () => {
    setSelectedAgentId(id);
  };

  const handleInspect = (e, tab) => {
    e.stopPropagation();
    setSelectedAgentId(id);
    openInspector(
      {
        id,
        name,
        role,
        level,
        system_prompt,
        last_input,
        last_output,
      },
      tab
    );
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group relative w-[300px] rounded-xl p-4 transition-all duration-300 cursor-pointer shadow-xl backdrop-blur-md",
        isLight
          ? "bg-white/95 text-slate-800 border border-slate-200/90 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)]"
          : "bg-slate-900/95 text-slate-100 border border-slate-700/70 border-t-slate-500/60 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.12)]",
        isCurrentActive
          ? isLight
            ? "border-sky-500 ring-2 ring-sky-500/35 shadow-[0_12px_28px_-4px_rgba(14,165,233,0.25)] scale-[1.02]"
            : "border-sky-400 ring-2 ring-sky-400/40 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.9),0_0_24px_2px_rgba(56,189,248,0.25)] scale-[1.02]"
          : isLight
            ? "hover:border-slate-300 hover:shadow-[0_12px_28px_-4px_rgba(0,0,0,0.12)]"
            : "hover:border-slate-600 hover:border-t-white/40 hover:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.9),0_0_20px_-2px_rgba(56,189,248,0.12)]"
      )}
    >
      {/* Target Handle (Incoming data) */}
      <Handle
        type="target"
        position={targetPosition}
        className={cn(
          "!w-3.5 !h-3.5 !rounded-full !border-2 transition-colors",
          isLight ? "!border-white" : "!border-slate-900",
          isCurrentActive
            ? "!bg-sky-400 !shadow-[0_0_10px_#38bdf8]"
            : isLight
              ? "!bg-slate-300 group-hover:!bg-slate-500"
              : "!bg-slate-500 group-hover:!bg-slate-300"
        )}
      />

      {/* Top Header: Icon, Agent Name & Level */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
              isCurrentActive
                ? isLight
                  ? "bg-sky-100 border-sky-300 text-sky-600"
                  : "bg-sky-500/20 border-sky-400/50 text-sky-300"
                : isLight
                  ? "bg-slate-100 border-slate-200 text-slate-600 group-hover:text-slate-900"
                  : "bg-slate-800/90 border-slate-700/80 text-slate-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] group-hover:text-white group-hover:border-slate-600"
            )}
          >
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight truncate group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">
              {name || id}
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono truncate">
              {role || id}
            </span>
          </div>
        </div>

        {level !== undefined && level !== null && String(level).trim() !== "" && (
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="purple" className="text-[10px] px-1.5 py-0 font-mono">
              Lvl {level}
            </Badge>
          </div>
        )}
      </div>

      {/* Telemetry Action Buttons */}
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50 grid grid-cols-3 gap-1.5 nodrag">
        {/* Input Button */}
        <Button
          type="button"
          size="xs"
          variant="subtle"
          onClick={(e) => handleInspect(e, "input")}
          className="rounded-full flex items-center justify-center gap-1 text-[11px] py-1.5 px-2 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          title="Inspect Last Input"
        >
          <ArrowDownToDot className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>Input</span>
        </Button>

        {/* Output Button */}
        <Button
          type="button"
          size="xs"
          variant="subtle"
          onClick={(e) => handleInspect(e, "output")}
          className="rounded-full flex items-center justify-center gap-1 text-[11px] py-1.5 px-2 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          title="Inspect Last Output"
        >
          <ArrowUpFromDot className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Output</span>
        </Button>

        {/* System Prompt Button */}
        <Button
          type="button"
          size="xs"
          variant="subtle"
          onClick={(e) => handleInspect(e, "system_prompt")}
          className="rounded-full flex items-center justify-center gap-1 text-[11px] py-1.5 px-2 hover:border-purple-500/50 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          title="Inspect System Prompt"
        >
          <Terminal className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
          <span className="truncate">Prompt</span>
        </Button>
      </div>

      {/* Source Handle (Outgoing data) */}
      <Handle
        type="source"
        position={sourcePosition}
        className={cn(
          "!w-3.5 !h-3.5 !rounded-full !border-2 transition-colors",
          isLight ? "!border-white" : "!border-slate-900",
          isCurrentActive
            ? "!bg-emerald-400 !shadow-[0_0_10px_#34d399]"
            : isLight
              ? "!bg-slate-300 group-hover:!bg-slate-500"
              : "!bg-slate-500 group-hover:!bg-slate-300"
        )}
      />
    </div>
  );
}

export default memo(CustomNode);
