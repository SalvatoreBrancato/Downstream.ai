import dagre from "dagre";

const NODE_WIDTH = 300;
const NODE_HEIGHT = 180;
const NODE_SEP = 80;
const RANK_SEP = 110;

/**
 * Calculates auto-layout positions for nodes using dagre.
 * Supports explicit "level" in node.data:
 * - If "level" is missing / null / empty, it respects the natural dagre topological layout.
 * - If "level" is defined, it forces the node into the specified tier/rank row (or column in LR).
 * - Ensures nodes sharing the same level never overlap horizontally.
 * 
 * @param {Array} nodes - Array of React Flow nodes
 * @param {Array} edges - Array of React Flow edges
 * @param {string} direction - 'TB' (top-to-bottom) or 'LR' (left-to-right)
 * @returns {{ nodes: Array, edges: Array }} Layouted nodes and edges
 */
export function getLayoutedElements(nodes, edges, direction = "TB") {
  const isHorizontal = direction === "LR";
  const dagreGraph = new dagre.graphlib.Graph();

  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: NODE_SEP,
    ranksep: RANK_SEP,
    align: "UL",
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  // Check if any node has an explicit level defined
  const hasAnyExplicitLevel = nodes.some((node) => {
    const lvl = node.data?.level;
    return (
      lvl !== undefined &&
      lvl !== null &&
      String(lvl).trim() !== "" &&
      !isNaN(Number(lvl))
    );
  });

  // Mode 1: No explicit level on any node -> 100% natural Dagre layout
  if (!hasAnyExplicitLevel) {
    const layoutedNodes = nodes.map((node) => {
      const pos = dagreGraph.node(node.id);
      return {
        ...node,
        targetPosition: isHorizontal ? "left" : "top",
        sourcePosition: isHorizontal ? "right" : "bottom",
        position: {
          x: Math.round(pos.x - NODE_WIDTH / 2),
          y: Math.round(pos.y - NODE_HEIGHT / 2),
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  }

  // Mode 2: Custom level specified -> align nodes to explicit level and avoid overlaps
  const rankStep = (isHorizontal ? NODE_WIDTH : NODE_HEIGHT) + RANK_SEP;
  const breadthStep = (isHorizontal ? NODE_HEIGHT : NODE_WIDTH) + NODE_SEP;

  // Extract explicit levels to find min reference
  const explicitLevels = nodes
    .filter((node) => {
      const lvl = node.data?.level;
      return (
        lvl !== undefined &&
        lvl !== null &&
        String(lvl).trim() !== "" &&
        !isNaN(Number(lvl))
      );
    })
    .map((node) => Number(node.data.level));

  const minExplicitLevel = Math.min(...explicitLevels);

  // Map each node to its effective level (explicit, or deduced naturally from Dagre)
  const levelGroups = {};
  const dagreCoords = {};

  nodes.forEach((node) => {
    const pos = dagreGraph.node(node.id);
    dagreCoords[node.id] = pos;

    const rawLvl = node.data?.level;
    const hasExp =
      rawLvl !== undefined &&
      rawLvl !== null &&
      String(rawLvl).trim() !== "" &&
      !isNaN(Number(rawLvl));

    let effectiveLevel;
    if (hasExp) {
      effectiveLevel = Number(rawLvl);
    } else {
      // Deduce level from Dagre's natural rank spacing
      const naturalStep = isHorizontal
        ? pos.x - NODE_WIDTH / 2
        : pos.y - NODE_HEIGHT / 2;
      effectiveLevel = Math.round(naturalStep / rankStep) + minExplicitLevel;
    }

    if (!levelGroups[effectiveLevel]) {
      levelGroups[effectiveLevel] = [];
    }

    levelGroups[effectiveLevel].push({
      node,
      breadth: isHorizontal ? pos.y : pos.x,
    });
  });

  const finalPositions = {};

  // For each level group, position nodes on the same rank coordinate and spread breadth
  Object.keys(levelGroups).forEach((lvlKey) => {
    const lvl = Number(lvlKey);
    const items = levelGroups[lvl];

    // Sort items by their natural breadth coordinate to preserve topological order
    items.sort((a, b) => a.breadth - b.breadth);

    const rankPos = (lvl - minExplicitLevel) * rankStep;
    const count = items.length;
    const totalBreadth = (count - 1) * breadthStep;
    const avgBreadth =
      items.reduce((sum, item) => sum + item.breadth, 0) / count;
    const startBreadth = avgBreadth - totalBreadth / 2;

    items.forEach((item, idx) => {
      const breadthPos = startBreadth + idx * breadthStep;
      if (isHorizontal) {
        finalPositions[item.node.id] = {
          x: Math.round(rankPos),
          y: Math.round(breadthPos - NODE_HEIGHT / 2),
        };
      } else {
        finalPositions[item.node.id] = {
          x: Math.round(breadthPos - NODE_WIDTH / 2),
          y: Math.round(rankPos),
        };
      }
    });
  });

  const layoutedNodes = nodes.map((node) => ({
    ...node,
    targetPosition: isHorizontal ? "left" : "top",
    sourcePosition: isHorizontal ? "right" : "bottom",
    position: finalPositions[node.id],
  }));

  return { nodes: layoutedNodes, edges };
}
