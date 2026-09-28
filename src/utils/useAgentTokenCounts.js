import { useEffect, useState } from "react";
import { countTokens } from "@/utils/tokenCounter";
import { payloadText } from "@/utils/modelPricing";

export function useAgentTokenCounts(agent, enabled = true) {
  const input = agent ? payloadText(agent.last_input) : "";
  const output = agent ? payloadText(agent.last_output) : "";
  const prompt = agent?.system_prompt || "";
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled || !agent) return;
    let cancelled = false;
    setCounts(null);
    setError(false);
    Promise.all([countTokens(input), countTokens(output), countTokens(prompt)])
      .then(([inputCount, outputCount, promptCount]) => {
        if (!cancelled) setCounts({ input: inputCount, output: outputCount, system_prompt: promptCount });
      })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [enabled, agent?.id, input, output, prompt]);

  return { counts, error };
}
