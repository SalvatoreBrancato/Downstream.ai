import React from "react";
import { Plus, Trash2 } from "lucide-react";

const inputClass = "w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";
const labelClass = "space-y-1 text-xs font-medium text-slate-600 dark:text-slate-300";

function payloadToText(value) {
  return typeof value === "string" ? value : JSON.stringify(value ?? {}, null, 2);
}

export function makePayloadDrafts(data) {
  return data.agents.map((agent) => ({
    last_input: payloadToText(agent?.last_input),
    last_output: payloadToText(agent?.last_output),
  }));
}

export function validateSchema(data) {
  if (!Array.isArray(data?.agents)) return "The schema must contain an agents array.";
  if (data.agents.some((agent) => !agent || typeof agent !== "object" || Array.isArray(agent))) {
    return "Each element in agents must be an object.";
  }
  const ids = data.agents.map((agent) => String(agent.id ?? "").trim());
  if (ids.some((id) => !id)) return "Each agent must have an ID.";
  if (new Set(ids).size !== ids.length) return "Agent IDs must be unique.";
  for (let i = 0; i < data.agents.length; i++) {
    if (!String(data.agents[i].name ?? "").trim()) return `Enter the name for agent ${ids[i]}.`;
    const level = data.agents[i].level;
    if (level !== undefined && level !== null && level !== "" && (!Number.isFinite(Number(level)) || Number(level) < 0)) {
      return `The level of agent ${ids[i]} must be at least 0.`;
    }
    if (data.agents[i].tools != null && !Array.isArray(data.agents[i].tools)) {
      return `Agent ${ids[i]} tools must be an array.`;
    }
  }
  if (data.flows != null && !Array.isArray(data.flows)) return "flows must be an array.";
  for (const flow of data.flows ?? []) {
    if (!flow || typeof flow !== "object") return "Each connection must be an object.";
    if (!ids.includes(flow.source)) {
      return `The connection '${flow.source} -> ${flow.target}' references a non-existent source: '${flow.source}'.`;
    }
    if (!ids.includes(flow.target)) {
      return `The connection '${flow.source} -> ${flow.target}' references a non-existent target: '${flow.target}'.`;
    }
  }
  return null;
}

export default function SchemaForm({ data, onChange, payloadDrafts, onPayloadDraftsChange }) {
  const agents = data.agents ?? [];
  const flows = data.flows ?? [];

  const updateAgent = (index, patch) => {
    const next = [...agents];
    const oldId = next[index].id;
    next[index] = { ...next[index], ...patch };
    const nextFlows = oldId !== next[index].id
      ? flows.map((flow) => ({
          ...flow,
          source: flow.source === oldId ? next[index].id : flow.source,
          target: flow.target === oldId ? next[index].id : flow.target,
        }))
      : flows;
    onChange({ ...data, agents: next, flows: nextFlows });
  };

  const addAgent = () => {
    let number = 1;
    while (agents.some((agent) => agent.id === `agent_${number}`)) number++;
    const agent = {
      id: `agent_${number}`, name: "", description: "", level: 0,
      web_search: false, tools: [], system_prompt: "", last_input: {}, last_output: {},
    };
    onChange({ ...data, agents: [...agents, agent] });
    onPayloadDraftsChange([...payloadDrafts, { last_input: "{}", last_output: "{}" }]);
  };

  const removeAgent = (index) => {
    const id = agents[index].id;
    onChange({
      ...data,
      agents: agents.filter((_, i) => i !== index),
      flows: flows.filter((flow) => flow.source !== id && flow.target !== id),
    });
    onPayloadDraftsChange(payloadDrafts.filter((_, i) => i !== index));
  };

  const addFlow = (agentId, direction) => {
    const other = agents.find((agent) => agent.id !== agentId);
    if (!other) return;
    const flow = direction === "incoming"
      ? { source: other.id, target: agentId, label: "" }
      : { source: agentId, target: other.id, label: "" };
    onChange({ ...data, flows: [...flows, flow] });
  };

  const updateFlow = (index, patch) => {
    onChange({ ...data, flows: flows.map((flow, i) => i === index ? { ...flow, ...patch } : flow) });
  };

  const removeFlow = (index) => {
    onChange({ ...data, flows: flows.filter((_, i) => i !== index) });
  };

  const updateTool = (agentIndex, toolIndex, patch) => {
    const tools = [...(agents[agentIndex].tools ?? [])];
    tools[toolIndex] = { ...tools[toolIndex], ...patch };
    updateAgent(agentIndex, { tools });
  };

  const updatePayload = (agentIndex, field, text) => {
    const next = [...payloadDrafts];
    next[agentIndex] = { ...next[agentIndex], [field]: text };
    onPayloadDraftsChange(next);
    let value = text;
    if (/^\s*[\[{]/.test(text)) {
      try {
        value = JSON.parse(text);
      } catch {
        // Incomplete or non-JSON content is valid plain text.
      }
    }
    updateAgent(agentIndex, { [field]: value });
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 p-4 dark:bg-slate-950">
      <div className="mx-auto max-w-xl space-y-4 pb-6">
        {agents.map((agent, index) => (
          <section key={index} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Agent {index + 1}{agent.name ? ` · ${agent.name}` : ""}</h3>
              <button type="button" onClick={() => removeAgent(index)} aria-label={`Delete agent ${index + 1}`} className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className={labelClass}>ID<input className={inputClass} value={agent.id ?? ""} onChange={(e) => updateAgent(index, { id: e.target.value })} /></label>
              <label className={labelClass}>Name<input className={inputClass} value={agent.name ?? ""} onChange={(e) => updateAgent(index, { name: e.target.value })} /></label>
              <label className={`${labelClass} sm:col-span-2`}>Description<textarea className={`${inputClass} min-h-16 resize-y`} value={agent.description ?? ""} onChange={(e) => updateAgent(index, { description: e.target.value })} /></label>
              <label className={labelClass}>Level<input
                type="number"
                min="0"
                placeholder="0"
                className={`${inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:m-0`}
                value={agent.level ?? ""}
                onFocus={() => updateAgent(index, { level: "" })}
                onBlur={() => {
                  if (agent.level === "" || agent.level === undefined || agent.level === null) {
                    updateAgent(index, { level: 0 });
                  }
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  updateAgent(index, {
                    level: val === "" ? "" : Math.max(0, parseInt(val, 10) || 0),
                  });
                }}
              /></label>
              <label className="flex items-end gap-2 pb-2 text-xs font-medium text-slate-600 dark:text-slate-300"><input type="checkbox" checked={Boolean(agent.web_search)} onChange={(e) => updateAgent(index, { web_search: e.target.checked })} /> Web search</label>
              <label className={`${labelClass} sm:col-span-2`}>System prompt<textarea className={`${inputClass} min-h-24 resize-y`} value={agent.system_prompt ?? ""} onChange={(e) => updateAgent(index, { system_prompt: e.target.value })} /></label>
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
              <div className="flex items-center justify-between"><h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200">Tools</h4><button type="button" onClick={() => updateAgent(index, { tools: [...(agent.tools ?? []), { name: "", description: "" }] })} className="flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400"><Plus className="h-3.5 w-3.5" /> Tool</button></div>
              {(agent.tools ?? []).map((tool, toolIndex) => (
                <div key={toolIndex} className="flex gap-2">
                  <input aria-label="Tool name" placeholder="Name" className={inputClass} value={tool.name ?? ""} onChange={(e) => updateTool(index, toolIndex, { name: e.target.value })} />
                  <input aria-label="Tool description" placeholder="Description" className={inputClass} value={tool.description ?? ""} onChange={(e) => updateTool(index, toolIndex, { description: e.target.value })} />
                  <button type="button" aria-label="Delete tool" onClick={() => updateAgent(index, { tools: agent.tools.filter((_, i) => i !== toolIndex) })} className="text-slate-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              {[["last_input", "Input"], ["last_output", "Output"]].map(([field, label]) => {
                const value = payloadDrafts[index]?.[field] ?? payloadToText(agent[field]);
                return <label key={field} className={labelClass}>{label}
                  <textarea className={`${inputClass} min-h-20 resize-y font-mono text-xs`} value={value} onChange={(e) => updatePayload(index, field, e.target.value)} />
                </label>;
              })}
            </div>

            {[["incoming", "Incoming from", "source"], ["outgoing", "Outgoing to", "target"]].map(([direction, title, key]) => (
              <div key={direction} className="mt-4 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
                <div className="flex items-center justify-between"><h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200">{title}</h4><button type="button" disabled={agents.length < 2} onClick={() => addFlow(agent.id, direction)} className="flex items-center gap-1 text-xs text-sky-600 disabled:opacity-40 dark:text-sky-400"><Plus className="h-3.5 w-3.5" /> Connection</button></div>
                {flows.map((flow, flowIndex) => ({ flow, flowIndex })).filter(({ flow }) => direction === "incoming" ? flow.target === agent.id : flow.source === agent.id).map(({ flow, flowIndex }) => (
                  <div key={flowIndex} className="flex gap-2">
                    <select aria-label={title} className={inputClass} value={flow[key]} onChange={(e) => updateFlow(flowIndex, { [key]: e.target.value })}>
                      {agents.filter((item) => item.id !== agent.id).map((item) => <option key={item.id} value={item.id}>{item.name || item.id}</option>)}
                    </select>
                    <input aria-label="Connection label" placeholder="Label" className={inputClass} value={flow.label ?? ""} onChange={(e) => updateFlow(flowIndex, { label: e.target.value })} />
                    <button type="button" aria-label="Delete connection" onClick={() => removeFlow(flowIndex)} className="text-slate-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
            ))}
          </section>
        ))}
        <button type="button" onClick={addAgent} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-sky-400 p-4 text-sm font-semibold text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/30"><Plus className="h-4 w-4" /> Add Agent</button>
      </div>
    </div>
  );
}
