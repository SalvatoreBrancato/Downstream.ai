import React, { createContext, useContext, useState, useEffect } from "react";
import initialTelemetry from "@/data/sampleTelemetry.json";

const STORAGE_KEY = "downstream_telemetry_data";
const DIRECTION_KEY = "downstream_telemetry_direction";
const THEME_KEY = "downstream_telemetry_theme";

/**
 * Legge i dati salvati in localStorage se presenti e validi,
 * altrimenti restituisce il dataset di default iniziale.
 */
function getInitialTelemetry() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.agents)) {
        // Se è la vecchia telemetria di default priva di description/tools, aggiorna ai nuovi campioni
        const isLegacySample =
          parsed.agents[0]?.id === "agent_1" &&
          parsed.agents[0]?.role === "Ingestion & Sanitization" &&
          !parsed.agents[0]?.description;
        if (!isLegacySample) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn("Impossibile leggere la telemetria da localStorage:", err);
  }
  return initialTelemetry;
}

function getInitialDirection() {
  try {
    const saved = localStorage.getItem(DIRECTION_KEY);
    if (saved === "TB" || saved === "LR") {
      return saved;
    }
  } catch (err) {
    console.warn("Impossibile leggere la direzione da localStorage:", err);
  }
  return "TB";
}

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") {
      return saved;
    }
  } catch (err) {
    console.warn("Impossibile leggere il tema da localStorage:", err);
  }
  return "dark";
}

const TelemetryContext = createContext(null);

export function TelemetryProvider({ children }) {
  const [telemetryData, setTelemetryData] = useState(getInitialTelemetry);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [layoutDirection, setLayoutDirection] = useState(getInitialDirection);
  const [theme, setTheme] = useState(getInitialTheme);
  const [isSavedInCache, setIsSavedInCache] = useState(false);

  // Auto-save automatico su localStorage ad ogni modifica del JSON dei dati
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(telemetryData));
      setIsSavedInCache(true);
    } catch (err) {
      console.error("Errore durante il salvataggio in localStorage:", err);
    }
  }, [telemetryData]);

  // Auto-save automatico dell'orientamento layout (Verticale/Orizzontale)
  useEffect(() => {
    try {
      localStorage.setItem(DIRECTION_KEY, layoutDirection);
    } catch (err) {
      console.error("Errore salvataggio direzione in localStorage:", err);
    }
  }, [layoutDirection]);

  // State for Inspector Sheet (Offcanvas)
  const [inspectorState, setInspectorState] = useState({
    isOpen: false,
    agent: null,
    tab: "input", // 'input' | 'output' | 'system_prompt'
  });

  const openInspector = (agent, tab = "input") => {
    setInspectorState({
      isOpen: true,
      agent,
      tab,
    });
  };

  const closeInspector = () => {
    setInspectorState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  const setInspectorTab = (tab) => {
    setInspectorState((prev) => ({
      ...prev,
      tab,
    }));
  };

  const setAgentModel = (agentId, modelId) => {
    setTelemetryData((prev) => ({
      ...prev,
      agents: prev.agents.map((agent) =>
        agent.id === agentId ? { ...agent, model_id: modelId } : agent
      ),
    }));
  };

  const toggleLayoutDirection = () => {
    setLayoutDirection((prev) => (prev === "TB" ? "LR" : "TB"));
  };

  const loadCustomTelemetry = (newTelemetry) => {
    if (!newTelemetry.agents || !Array.isArray(newTelemetry.agents)) {
      throw new Error("Il JSON deve contenere un array 'agents'");
    }
    setTelemetryData(newTelemetry);
    setSelectedAgentId(null);
    closeInspector();
  };

  const resetToDefaultTelemetry = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(DIRECTION_KEY);
    } catch (err) {
      console.error(err);
    }
    setTelemetryData(initialTelemetry);
    setLayoutDirection("TB");
    setSelectedAgentId(null);
    closeInspector();
  };

  // Sincronizzazione automatica del tema con la classe 'dark' sull'elemento html
  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch (err) {
      console.error("Errore salvataggio tema in localStorage:", err);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <TelemetryContext.Provider
      value={{
        telemetryData,
        selectedAgentId,
        setSelectedAgentId,
        layoutDirection,
        toggleLayoutDirection,
        theme,
        setTheme,
        toggleTheme,
        inspectorState,
        openInspector,
        closeInspector,
        setInspectorTab,
        setAgentModel,
        loadCustomTelemetry,
        resetToDefaultTelemetry,
        isSavedInCache,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error("useTelemetry must be used within a TelemetryProvider");
  }
  return context;
}
