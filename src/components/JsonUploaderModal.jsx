import React, { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTelemetry } from "@/context/TelemetryContext";
import {
  Upload,
  FolderOpen,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  FileCode,
  Download,
  Sparkles,
  X,
  Trash2,
  Code2,
  AlignLeft,
} from "lucide-react";
import sampleData from "@/data/sampleTelemetry.json";

/**
 * JsonUploaderModal renders a full-height offcanvas drawer.
 * Runs Monaco Editor in native uncontrolled mode to eliminate any React re-render
 * race conditions (no cursor jumping, no deletion glitches, instant 60fps typing).
 * Also provides an alternative standard Textarea view for maximum reliability.
 */
export default function JsonUploaderModal({ isOpen, onClose }) {
  const {
    telemetryData,
    loadCustomTelemetry,
    resetToDefaultTelemetry,
    theme,
  } = useTelemetry();

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [editorMode, setEditorMode] = useState("monaco"); // 'monaco' | 'textarea'
  const [textareaContent, setTextareaContent] = useState("");

  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const modalContainerRef = useRef(null);

  // Sync content ONLY when the modal opens (never during typing!)
  useEffect(() => {
    if (isOpen) {
      const formatted = JSON.stringify(telemetryData, null, 2);
      setTextareaContent(formatted);

      if (editorRef.current) {
        editorRef.current.setValue(formatted);
        setTimeout(() => {
          editorRef.current?.focus();
        }, 100);
      }
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  // Isolate all keyboard events from escaping to document/window while modal is open
  useEffect(() => {
    if (!isOpen || !modalContainerRef.current) return;
    const el = modalContainerRef.current;
    const handleKeyCapture = (e) => {
      // Allow Escape key to close modal
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Stop keyboard event from bubbling/escaping to global document listeners
      e.stopPropagation();
    };
    el.addEventListener("keydown", handleKeyCapture, true);
    el.addEventListener("keyup", handleKeyCapture, true);
    return () => {
      el.removeEventListener("keydown", handleKeyCapture, true);
      el.removeEventListener("keyup", handleKeyCapture, true);
    };
  }, [isOpen, onClose]);

  // Handle Monaco editor mount
  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    const formatted = JSON.stringify(telemetryData, null, 2);
    editor.setValue(formatted);
    setTimeout(() => {
      editor.focus();
    }, 100);
  };

  // Helper to extract current value from active editor mode
  const getCurrentValue = () => {
    if (editorMode === "monaco" && editorRef.current) {
      return editorRef.current.getValue();
    }
    return textareaContent;
  };

  // Helper to set value on both editors
  const setCurrentValue = (text) => {
    setTextareaContent(text);
    if (editorRef.current) {
      editorRef.current.setValue(text);
    }
  };

  // Switch between Monaco Editor and native Textarea
  const handleToggleMode = (mode) => {
    if (mode === editorMode) return;
    if (mode === "textarea") {
      const val = editorRef.current ? editorRef.current.getValue() : textareaContent;
      setTextareaContent(val);
    } else {
      if (editorRef.current) {
        editorRef.current.setValue(textareaContent);
      }
    }
    setEditorMode(mode);
  };

  // 1. File Upload from disk (.json)
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readFile(file);
    e.target.value = "";
  };

  const readFile = (file) => {
    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      setError("The selected file must have a .json extension");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const parsed = JSON.parse(text);
        if (!parsed.agents || !Array.isArray(parsed.agents)) {
          throw new Error("JSON must contain an 'agents' array");
        }
        const formatted = JSON.stringify(parsed, null, 2);
        setCurrentValue(formatted);
        setError(null);
        setSuccess(`File "${file.name}" loaded successfully!`);
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError(`JSON file error: ${err.message}`);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the selected file");
    };
    reader.readAsText(file);
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  // Format JSON to 2 spaces indentation
  const handleFormat = () => {
    try {
      const current = getCurrentValue();
      const parsed = JSON.parse(current);
      const formatted = JSON.stringify(parsed, null, 2);
      setCurrentValue(formatted);
      setError(null);
    } catch (err) {
      setError(`Syntax error during formatting: ${err.message}`);
    }
  };

  // Clear editor with a clean minimal template
  const handleClear = () => {
    const blankTemplate = JSON.stringify(
      {
        agents: [
          {
            id: "agent_1",
            name: "New Agent",
            level: 0,
            system_prompt: "Enter system prompt here...",
            last_input: {},
            last_output: {},
          },
        ],
        flows: [],
      },
      null,
      2
    );
    setCurrentValue(blankTemplate);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // Download JSON to file
  const handleDownload = () => {
    try {
      const current = getCurrentValue();
      const blob = new Blob([current], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "multi-agent-telemetry.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  // Apply to graph
  const handleApply = () => {
    try {
      const current = getCurrentValue();
      const parsed = JSON.parse(current);
      loadCustomTelemetry(parsed);
      setSuccess("Graph updated successfully!");
      setError(null);
      setTimeout(() => {
        setSuccess(null);
        onClose();
      }, 600);
    } catch (err) {
      setError(`JSON syntax error: ${err.message}`);
    }
  };

  // Reset to default sample and clear local cache
  const handleResetToSample = () => {
    resetToDefaultTelemetry();
    const formatted = JSON.stringify(sampleData, null, 2);
    setCurrentValue(formatted);
    setError(null);
    setSuccess("Reset to default sample and cleared local cache");
    setTimeout(() => setSuccess(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={modalContainerRef}
      className="fixed inset-0 z-50 flex select-text"
      onKeyDownCapture={(e) => {
        if (e.key !== "Escape") {
          e.stopPropagation();
        }
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sliding Offcanvas Drawer from Left */}
      <div className="relative z-50 w-full sm:max-w-2xl bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-left duration-300">
        {/* Drawer Header */}
        <div className="p-5 pb-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-500 dark:text-sky-400">
                <FileCode className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Load / Edit JSON Configuration
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Directly edit JSON code or load a ready-made configuration file.
                </p>
              </div>
            </div>

            {/* Browse File and Close */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,application/json"
                className="hidden"
              />
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs gap-1.5 border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-300 hover:bg-sky-500/20"
                title="Select a .json file from your computer"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </Button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                title="Close drawer (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              {/* Toggle Monaco vs Textarea */}
              <div className="inline-flex rounded-md p-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleToggleMode("monaco")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    editorMode === "monaco"
                      ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                  title="Monaco code editor with syntax highlighting"
                >
                  <Code2 className="w-3 h-3" />
                  <span>Monaco</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleMode("textarea")}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    editorMode === "textarea"
                      ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                  title="Native simple text editor"
                >
                  <AlignLeft className="w-3 h-3" />
                  <span>Text</span>
                </button>
              </div>

              <Badge variant="purple" className="font-mono text-[10px]">
                Supports &quot;level&quot;
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleFormat}
                className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 transition-colors"
                title="Format and indent JSON"
              >
                <Sparkles className="w-3 h-3 text-sky-500 dark:text-sky-400" />
                <span>Format</span>
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                title="Clear with a minimal template"
              >
                <Trash2 className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                <span>Clear</span>
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors"
                title="Export JSON to file"
              >
                <Download className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="mx-5 mt-2.5 p-2.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/80 rounded-lg flex items-center gap-2 text-xs text-red-600 dark:text-red-300">
            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {success && (
          <div className="mx-5 mt-2.5 p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 rounded-lg flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{success}</span>
          </div>
        )}

        {/* Editor Area with Drag & Drop */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex-1 w-full relative min-h-0 my-2 border-y border-slate-200 dark:border-slate-800 transition-all ${
            theme === "light" ? "bg-white" : "bg-[#1e1e1e]"
          } ${
            isDragging ? "ring-2 ring-sky-400 bg-sky-50 dark:bg-sky-950/20" : ""
          }`}
        >
          {isDragging && (
            <div className="absolute inset-0 z-20 bg-sky-950/80 backdrop-blur-sm border-2 border-dashed border-sky-400 flex flex-col items-center justify-center pointer-events-none text-sky-200">
              <Upload className="w-10 h-10 mb-2 animate-bounce" />
              <p className="text-sm font-semibold">
                Drop the JSON file here to upload
              </p>
            </div>
          )}

          {editorMode === "monaco" ? (
            <Editor
              height="100%"
              language="json"
              theme={theme === "light" ? "light" : "vs-dark"}
              defaultValue={JSON.stringify(telemetryData, null, 2)}
              onMount={handleEditorDidMount}
              options={{
                readOnly: false,
                domReadOnly: false,
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                automaticLayout: true,
                lineNumbers: "on",
                tabSize: 2,
                formatOnPaste: true,
                formatOnType: false,
                quickSuggestions: false,
                suggestOnTriggerCharacters: false,
                acceptSuggestionOnEnter: "off",
                selectOnLineNumbers: true,
              }}
            />
          ) : (
            <textarea
              value={textareaContent}
              onChange={(e) => setTextareaContent(e.target.value)}
              placeholder="Paste or type your JSON here..."
              spellCheck="false"
              className="w-full h-full p-4 font-mono text-xs bg-transparent border-0 outline-none resize-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 leading-relaxed select-text"
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetToSample}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white gap-1.5"
            title="Restore default sample configuration"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Sample
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="text-xs bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-md shadow-sky-500/20"
            >
              Apply Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
