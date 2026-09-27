import React from "react";
import { BaseEdge, EdgeLabelRenderer } from "@xyflow/react";
import { useTelemetry } from "@/context/TelemetryContext";
import { cn } from "@/lib/utils";

/**
 * Creates an SVG path string from an array of waypoints,
 * with smooth quadratic bezier rounded corners at every bend.
 */
function createRoundedPath(points, radius = 12) {
  if (!points || points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };

    const len1 = Math.hypot(v1.x, v1.y);
    const len2 = Math.hypot(v2.x, v2.y);

    if (len1 === 0 || len2 === 0) continue;

    const r = Math.min(radius, len1 / 2, len2 / 2);

    const pStart = {
      x: curr.x - (v1.x / len1) * r,
      y: curr.y - (v1.y / len1) * r,
    };
    const pEnd = {
      x: curr.x + (v2.x / len2) * r,
      y: curr.y + (v2.y / len2) * r,
    };

    d += ` L ${pStart.x} ${pStart.y} Q ${curr.x} ${curr.y} ${pEnd.x} ${pEnd.y}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/**
 * SmartEdge component:
 * - Uses corridor-routed waypoints passing between cards.
 * - Staggers horizontal and vertical tracks so edges and labels NEVER overlap.
 * - Renders dynamic auto-fitting HTML label containers with EdgeLabelRenderer
 *   so label badges adapt 100% to the text length without clipping or overflowing.
 */
export default function SmartEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
  label,
  data = {},
}) {
  const { theme, selectedAgentId } = useTelemetry();
  const isLight = theme === "light";

  const isOutgoing = Boolean(selectedAgentId && source === selectedAgentId);
  const isIncoming = Boolean(selectedAgentId && target === selectedAgentId);

  let path = "";
  let labelX = (sourceX + targetX) / 2;
  let labelY = (sourceY + targetY) / 2;

  if (Array.isArray(data.points) && data.points.length >= 2) {
    path = createRoundedPath(data.points, 12);
    if (data.labelPos) {
      labelX = data.labelPos.x;
      labelY = data.labelPos.y;
    }
  } else {
    // Fallback: standard clean rounded step
    const midY = (sourceY + targetY) / 2;
    const fallbackPoints = [
      { x: sourceX, y: sourceY },
      { x: sourceX, y: midY },
      { x: targetX, y: midY },
      { x: targetX, y: targetY },
    ];
    path = createRoundedPath(fallbackPoints, 12);
    labelX = (sourceX + targetX) / 2;
    labelY = midY;
  }

  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} />

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
            className={cn(
              "nodrag nopan inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-mono tracking-tight whitespace-nowrap transition-all duration-200 select-none shadow-sm border",
              isOutgoing
                ? isLight
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-emerald-500/10 font-semibold"
                  : "bg-[#064e3b]/95 text-emerald-300 border-emerald-500/60 shadow-[0_0_12px_rgba(52,211,153,0.3)] font-semibold"
                : isIncoming
                  ? isLight
                    ? "bg-sky-50 text-sky-800 border-sky-300 shadow-sky-500/10 font-semibold"
                    : "bg-[#082f49]/95 text-sky-300 border-sky-400/60 shadow-[0_0_12px_rgba(56,189,248,0.3)] font-semibold"
                  : isLight
                    ? "bg-white/95 text-slate-700 border-slate-200 shadow-sm hover:border-slate-300"
                    : "bg-slate-900/95 text-slate-300 border-slate-700/80 shadow-md hover:border-slate-600"
            )}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
