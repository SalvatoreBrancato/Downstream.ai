# Downstream AI

An interactive map for understanding how agents in a multi-agent system are connected. Load a JSON file, inspect each agent's input, output, prompt and tools, and follow the incoming and outgoing connections without drawing the graph by hand.

![Downstream AI graph](./docs/demo-screenshot.png)

## What it does

- Arranges agents automatically from their connections and optional `level` values. Switch between vertical and horizontal layouts.
- Highlights an agent's incoming and outgoing connections when you select it.
- Shows the agent's latest input, latest output, system prompt and tools in an inspector.
- Lets you paste, edit, upload and export the graph JSON. The editor offers a JSON code view and a form for agents and connections.
- Saves the applied graph, layout direction and theme in your browser's `localStorage`.

Downstream AI displays a graph and the input/output snapshots provided in the JSON. It does not collect live execution traces from an agent framework.

## Run locally

```bash
git clone https://github.com/SalvatoreBrancato/Downstream.ai.git
cd Downstream.ai
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173/`).

To check the production build locally:

```bash
npm run build
npm run preview
```

## Use your own graph

Open **Upload / Edit JSON** to paste a configuration, select a `.json` file, or switch to **Form** to add agents and connect them with **Arriva da** and **Invia a**. Both views edit the same draft. Choose **Apply Changes** to update the graph. Click an agent to highlight its connections; use its Input, Output, Prompt and Tools buttons to inspect its data. **Reset to Sample** loads the included example.

The smallest useful configuration has an `agents` array and a `flows` array:

```json
{
  "agents": [
    {
      "id": "researcher",
      "name": "Researcher",
      "level": 0,
      "description": "Collects source material",
      "system_prompt": "Find relevant information.",
      "last_input": { "topic": "Example" },
      "last_output": { "notes": "Summary of findings" },
      "web_search": true,
      "tools": [
        { "name": "search", "description": "Searches the web" }
      ]
    },
    {
      "id": "writer",
      "name": "Writer",
      "level": 1,
      "last_input": { "notes": "Summary of findings" },
      "last_output": { "draft": "First draft" }
    }
  ],
  "flows": [
    { "source": "researcher", "target": "writer", "label": "Research notes" }
  ]
}
```

| Field | Purpose |
| --- | --- |
| `agents` | Array of agents. Each agent needs a unique `id`; `name` is the displayed title. |
| `flows` | Directed connections. `source` and `target` refer to agent IDs; `label` is optional. |
| `level` | Optional numeric tier. Agents on the same tier are placed together. |
| `description`, `system_prompt` | Optional agent details. |
| `last_input`, `last_output` | Optional payload snapshots shown in the inspector. |
| `web_search`, `tools` | Optional capability indicator and list of tools. |

See [sampleTelemetry.json](./src/data/sampleTelemetry.json) for a larger example. Before applying or exporting, the app checks agent IDs, names, nonnegative levels, and connection references. Input and output can contain plain text or structured JSON values.

## Data and privacy

Graph JSON is parsed in the browser and the applied graph is stored in that browser's `localStorage`. The app has no backend endpoint for uploading graph data. The page does request Google Fonts, and Monaco's default loader requests editor assets from a CDN. Keep this in mind when using sensitive prompts or payloads, especially on a shared browser.

## Built with

[React](https://react.dev/), [Vite](https://vite.dev/), [React Flow](https://reactflow.dev/), [Dagre](https://github.com/dagrejs/dagre), [Monaco Editor](https://github.com/suren-atoyan/monaco-react) and [Tailwind CSS](https://tailwindcss.com/).
