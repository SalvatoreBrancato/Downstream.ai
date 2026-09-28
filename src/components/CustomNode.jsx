import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  Bot,
  ArrowDownToDot,
  ArrowUpFromDot,
  Terminal,
  Globe,
  Wrench,
} from "lucide-react";
import { useTelemetry } from "@/context/TelemetryContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  MODEL_PRICES,
  estimateCost,
  formatUsd,
  getRates,
} from "@/utils/modelPricing";
import { useAgentTokenCounts } from "@/utils/useAgentTokenCounts";

/**
 * CustomNode component for React Flow representing an AI Agent.
 * Displays agent details, description, web search badge, and action buttons
 * to inspect Input, Output, System Prompt, and Tools & Functions.
 * Fully supports both Light Mode and High-Contrast Dark Mode.
 */
function CustomNode({
  id,
  data,
  selected,
  targetPosition = Position.Top,
  sourcePosition = Position.Bottom,
}) {
  const {
    selectedAgentId,
    setSelectedAgentId,
    openInspector,
    theme,
    telemetryData,
  } = useTelemetry();

  const isCurrentActive = selectedAgentId === id || selected;
  const isLight = theme === "light";
  const model = MODEL_PRICES[data.model_id];
  const { counts, error: tokenError } = useAgentTokenCounts(
    data,
    Boolean(model),
  );
  const rates = getRates(
    model,
    (counts?.input ?? 0) + (counts?.system_prompt ?? 0),
  );
  const totalCost =
    rates && counts ?
      estimateCost(counts.input + counts.system_prompt, rates.input) +
      estimateCost(counts.output, rates.output)
    : null;
  const totalTokens =
    counts ? counts.input + counts.system_prompt + counts.output : null;

  // Check if this agent is reached by an outgoing green arrow from the currently selected agent (Downstream)
  const isReachedByGreenArrow = Boolean(
    selectedAgentId &&
    selectedAgentId !== id &&
    telemetryData?.flows?.some(
      (flow) => flow.source === selectedAgentId && flow.target === id,
    ),
  );

  // Check if this agent feeds the currently selected agent with an incoming blue arrow (Upstream)
  const isUpstreamSource = Boolean(
    selectedAgentId &&
    selectedAgentId !== id &&
    telemetryData?.flows?.some(
      (flow) => flow.source === id && flow.target === selectedAgentId,
    ),
  );

  const {
    name,
    role,
    description,
    system_prompt,
    last_input,
    last_output,
    level,
    web_search,
    tools,
  } = data;

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
        description,
        level,
        web_search,
        tools,
        system_prompt,
        last_input,
        last_output,
        model_id: data.model_id,
      },
      tab,
    );
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group relative w-[300px] rounded-xl p-4 transition-all duration-300 cursor-pointer shadow-xl backdrop-blur-md",
        isLight ?
          "bg-white/95 text-slate-800 border border-slate-200/90 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.04)]"
        : "bg-slate-900/95 text-slate-100 border border-slate-700/70 border-t-slate-500/60 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.85),inset_0_1px_0_0_rgba(255,255,255,0.12)]",
        isCurrentActive ?
          isLight ?
            "border-sky-500 ring-2 ring-offset-2 ring-sky-500/50 shadow-[0_14px_32px_-4px_rgba(14,165,233,0.35)] scale-[1.03]"
          : "border-sky-400 ring-2 ring-offset-2 ring-offset-slate-950 ring-sky-400/60 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.9),0_0_28px_4px_rgba(56,189,248,0.4)] scale-[1.03]"
        : isUpstreamSource ?
          isLight ?
            "border-sky-500 ring-2 ring-sky-500/40 shadow-[0_12px_28px_-4px_rgba(2,132,199,0.25)] scale-[1.01]"
          : "border-sky-400 ring-2 ring-sky-400/50 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.9),0_0_24px_2px_rgba(56,189,248,0.3)] scale-[1.01]"
        : isReachedByGreenArrow ?
          isLight ?
            "border-emerald-500 ring-2 ring-emerald-500/40 shadow-[0_12px_28px_-4px_rgba(5,150,105,0.25)] scale-[1.01]"
          : "border-emerald-400 ring-2 ring-emerald-400/50 shadow-[0_16px_36px_-6px_rgba(0,0,0,0.9),0_0_24px_2px_rgba(52,211,153,0.3)] scale-[1.01]"
        : isLight ?
          "hover:border-slate-300 hover:shadow-[0_12px_28px_-4px_rgba(0,0,0,0.12)]"
        : "hover:border-slate-600 hover:border-t-white/40 hover:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.9),0_0_20px_-2px_rgba(56,189,248,0.12)]",
      )}
    >
      {/* Target Handle (Incoming data) */}
      <Handle
        type="target"
        position={targetPosition}
        className={cn(
          "!w-3.5 !h-3.5 !rounded-full !border-2 transition-colors",
          isLight ? "!border-white" : "!border-slate-900",
          isCurrentActive ? "!bg-sky-400 !shadow-[0_0_10px_#38bdf8]"
          : isReachedByGreenArrow ? "!bg-emerald-400 !shadow-[0_0_12px_#34d399]"
          : isLight ? "!bg-slate-300 group-hover:!bg-slate-500"
          : "!bg-slate-500 group-hover:!bg-slate-300",
        )}
      />

      {/* Top Header: Icon, Agent Name & Level / Web Search */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
              isCurrentActive ?
                isLight ?
                  "bg-sky-100 border-sky-300 text-sky-600 ring-1 ring-sky-400/50"
                : "bg-sky-500/25 border-sky-400/60 text-sky-300 ring-1 ring-sky-400/50"
              : isUpstreamSource ?
                isLight ? "bg-sky-100 border-sky-300 text-sky-600"
                : "bg-sky-500/20 border-sky-400/50 text-sky-300"
              : isReachedByGreenArrow ?
                isLight ? "bg-emerald-100 border-emerald-300 text-emerald-600"
                : "bg-emerald-500/20 border-emerald-400/50 text-emerald-300"
              : isLight ?
                "bg-slate-100 border-slate-200 text-slate-600 group-hover:text-slate-900"
              : "bg-slate-800/90 border-slate-700/80 text-slate-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] group-hover:text-white group-hover:border-slate-600",
            )}
          >
            <Bot className="w-4 h-4" />
          </div>
          <h3
            className={cn(
              "text-sm font-semibold tracking-tight truncate transition-colors",
              isCurrentActive ?
                isLight ? "text-sky-700 font-bold"
                : "text-sky-300 font-bold"
              : isUpstreamSource ?
                isLight ? "text-sky-600 font-semibold"
                : "text-sky-400 font-semibold"
              : isReachedByGreenArrow ?
                isLight ? "text-emerald-700 font-semibold"
                : "text-emerald-300 font-semibold"
              : "text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300",
            )}
          >
            {name || id}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {web_search !== undefined && web_search !== null && (
            <div
              className={cn(
                "flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border transition-colors",
                web_search ?
                  "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800/80 shadow-sm"
                : "text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60",
              )}
              title={
                web_search ?
                  "Web Search: Abilitata"
                : "Web Search: Disabilitata"
              }
            >
              <Globe
                className={cn(
                  "w-3 h-3",
                  web_search ?
                    "text-sky-500 dark:text-sky-400"
                  : "text-slate-400",
                )}
              />
              <span className="font-mono">{web_search ? "Web" : "Off"}</span>
            </div>
          )}

          {level !== undefined &&
            level !== null &&
            String(level).trim() !== "" && (
              <Badge
                variant="purple"
                className="text-[10px] px-1.5 py-0 font-mono"
              >
                Lvl {level}
              </Badge>
            )}
        </div>
      </div>

      {/* Full-width Description Section */}
      {description ?
        <p
          className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 mb-1"
          title={description}
        >
          {description}
        </p>
      : role ?
        <p
          className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate mb-1"
          title={role}
        >
          {role}
        </p>
      : null}

      {/* Telemetry Action Buttons */}
      {model && (
        <div
          className="mt-3 rounded-md border border-slate-200 bg-slate-50/70 px-2.5 py-2 text-[11px] dark:border-slate-700 dark:bg-slate-800/60"
          title="Stima USD: input + prompt al prezzo input, output al prezzo output. Esclude cache, tool e token non visibili."
        >
          <div className="flex justify-between">
            <div className="truncate font-medium text-slate-600 dark:text-slate-300">
              {model.label}
            </div>
            <div className="mt-0.5 font-mono text-slate-800 dark:text-slate-100">
              {tokenError ?
                "N/D"
              : totalCost === null ?
                "…"
              : formatUsd(totalCost)}
            </div>
          </div>
          <div className="mt-1 font-mono text-slate-800 dark:text-slate-100">
            <span>
              {tokenError ?
                "N/D tokens"
              : totalTokens === null ?
                "… tokens"
              : `${totalTokens.toLocaleString("it-IT")} tokens`}
            </span>
            <span className="ml-2 text-[10px] text-slate-500 dark:text-slate-400">
              tools excluded
            </span>
          </div>
        </div>
      )}
      <div
        className={cn(
          "mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50 grid gap-1 nodrag",
          tools !== undefined ? "grid-cols-4" : "grid-cols-3 gap-1.5",
        )}
      >
        {/* Input Button */}
        <Button
          type="button"
          size="xs"
          variant="subtle"
          onClick={(e) => handleInspect(e, "input")}
          className="rounded-full flex items-center justify-center gap-1 text-[10.5px] py-1.5 px-1 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          title="Inspect Last Input"
        >
          <ArrowDownToDot className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <span className="truncate">Input</span>
        </Button>

        {/* Output Button */}
        <Button
          type="button"
          size="xs"
          variant="subtle"
          onClick={(e) => handleInspect(e, "output")}
          className="rounded-full flex items-center justify-center gap-1 text-[10.5px] py-1.5 px-1 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          title="Inspect Last Output"
        >
          <ArrowUpFromDot className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
          <span className="truncate">Output</span>
        </Button>

        {/* System Prompt Button */}
        <Button
          type="button"
          size="xs"
          variant="subtle"
          onClick={(e) => handleInspect(e, "system_prompt")}
          className="rounded-full flex items-center justify-center gap-1 text-[10.5px] py-1.5 px-1 hover:border-purple-500/50 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          title="Inspect System Prompt"
        >
          <Terminal className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
          <span className="truncate">Prompt</span>
        </Button>

        {/* Tools Button */}
        {tools !== undefined && (
          <Button
            type="button"
            size="xs"
            variant="subtle"
            onClick={(e) => handleInspect(e, "tools")}
            className="rounded-full flex items-center justify-center gap-1 text-[10.5px] py-1.5 px-1 hover:border-sky-500/50 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            title={`Inspect Tools (${Array.isArray(tools) ? tools.length : 0})`}
          >
            <Wrench className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
            <span className="truncate">
              Tools
              {Array.isArray(tools) && tools.length > 0 ?
                ` (${tools.length})`
              : ""}
            </span>
          </Button>
        )}
      </div>

      {/* Source Handle (Outgoing data) */}
      <Handle
        type="source"
        position={sourcePosition}
        className={cn(
          "!w-3.5 !h-3.5 !rounded-full !border-2 transition-colors",
          isLight ? "!border-white" : "!border-slate-900",
          isCurrentActive ? "!bg-emerald-400 !shadow-[0_0_10px_#34d399]"
          : isUpstreamSource ? "!bg-sky-400 !shadow-[0_0_12px_#38bdf8]"
          : isLight ? "!bg-slate-300 group-hover:!bg-slate-500"
          : "!bg-slate-500 group-hover:!bg-slate-300",
        )}
      />
    </div>
  );
}

export default memo(CustomNode);
