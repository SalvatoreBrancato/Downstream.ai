import React, { useState } from "react";
import { TelemetryProvider } from "@/context/TelemetryContext";
import Header from "@/components/Header";
import TelemetryMap from "@/components/TelemetryMap";
import InspectorSheet from "@/components/InspectorSheet";
import JsonUploaderModal from "@/components/JsonUploaderModal";

export default function App() {
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);

  return (
    <TelemetryProvider>
      <div className="flex flex-col h-screen w-screen bg-slate-950 overflow-hidden">
        {/* Navigation / Top Header */}
        <Header onOpenJsonModal={() => setIsJsonModalOpen(true)} />

        {/* Main Flow Canvas */}
        <main className="flex-1 w-full h-[calc(100vh-3.5rem)] relative">
          <TelemetryMap />
        </main>

        {/* Offcanvas Drawer for Data Inspection with Monaco Editor */}
        <InspectorSheet />

        {/* Modal for Custom JSON Configuration */}
        <JsonUploaderModal
          isOpen={isJsonModalOpen}
          onClose={() => setIsJsonModalOpen(false)}
        />
      </div>
    </TelemetryProvider>
  );
}
