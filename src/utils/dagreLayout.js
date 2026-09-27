import dagre from "dagre";

const NODE_WIDTH = 300;
const NODE_HEIGHT = 180;
const NODE_SEP = 80;
const RANK_SEP = 130;

/**
 * Calculates auto-layout positions for nodes and obstacle-avoiding edge corridors.
 * - Aligns and centers all levels/tiers on a common center axis.
 * - Ensures nodes never overlap.
 * - Routes edges through the open corridors between cards without throwing everything to one side.
 * - Staggers horizontal and vertical tracks so edges NEVER collinearly overlap.
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

  const dagreRankStep = (isHorizontal ? NODE_WIDTH : NODE_HEIGHT) + RANK_SEP;
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

  const minExplicitLevel =
    explicitLevels.length > 0 ? Math.min(...explicitLevels) : 0;

  // Map each node to its effective level (explicit, or deduced naturally from Dagre)
  const levelGroups = {};

  nodes.forEach((node) => {
    const pos = dagreGraph.node(node.id);
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
      const naturalStep = isHorizontal
        ? pos.x - NODE_WIDTH / 2
        : pos.y - NODE_HEIGHT / 2;
      effectiveLevel = Math.round(naturalStep / dagreRankStep) + minExplicitLevel;
    }

    if (!levelGroups[effectiveLevel]) {
      levelGroups[effectiveLevel] = [];
    }

    levelGroups[effectiveLevel].push({
      node,
      breadth: isHorizontal ? pos.y : pos.x,
      effectiveLevel,
    });
  });

  // Give edges leaving the same tier separate tracks. Reserve enough room for
  // their labels, expanding the tier gap only when the channel gets crowded.
  const levelByNodeId = Object.fromEntries(
    Object.entries(levelGroups).flatMap(([level, items]) =>
      items.map(({ node }) => [node.id, Number(level)])
    )
  );
  const edgesBySourceLevel = new Map();
  edges.forEach((edge, index) => {
    const level = levelByNodeId[edge.source];
    if (level === undefined) return;
    if (!edgesBySourceLevel.has(level)) edgesBySourceLevel.set(level, []);
    edgesBySourceLevel.get(level).push(index);
  });
  const laneOffsetByEdgeIndex = new Map();
  const rankGapByLevel = new Map();
  edgesBySourceLevel.forEach((indices, level) => {
    // Horizontal labels sit beside their vertical tracks, so they need room
    // for their full text width. Vertical labels only need their height.
    const widestLabel = Math.max(
      0,
      ...indices.map((index) =>
        edges[index].label ? 20 + String(edges[index].label).length * 6.7 : 0
      )
    );
    const trackSpacing = isHorizontal
      ? Math.max(36, widestLabel + 12)
      : 36;
    indices.forEach((edgeIndex, lane) => {
      laneOffsetByEdgeIndex.set(
        edgeIndex,
        (lane - (indices.length - 1) / 2) * trackSpacing
      );
    });
    rankGapByLevel.set(
      level,
      Math.max(
        RANK_SEP,
        (indices.length - 1) * trackSpacing +
          (isHorizontal ? Math.max(64, widestLabel + 24) : 64)
      )
    );
  });
  const gapAfterLevel = (level) => rankGapByLevel.get(level) ?? RANK_SEP;

  // Calculate common center across all levels to keep the entire graph symmetrically centered
  const maxGroupCount = Math.max(
    ...Object.values(levelGroups).map((g) => g.length)
  );
  const maxTotalBreadth = (maxGroupCount - 1) * breadthStep;
  const commonCenter = maxTotalBreadth / 2;

  let minCalculatedBreadth = Infinity;
  const prePositions = {};

  Object.keys(levelGroups).forEach((lvlKey) => {
    const lvl = Number(lvlKey);
    const items = levelGroups[lvl];

    // Sort items by their natural breadth coordinate to preserve topological order
    items.sort((a, b) => a.breadth - b.breadth);

    const count = items.length;
    const totalBreadth = (count - 1) * breadthStep;
    const startBreadth = commonCenter - totalBreadth / 2;

    items.forEach((item, idx) => {
      const bPos = startBreadth + idx * breadthStep;
      if (bPos < minCalculatedBreadth) {
        minCalculatedBreadth = bPos;
      }
      prePositions[item.node.id] = {
        lvl,
        breadthPos: bPos,
        effectiveLevel: item.effectiveLevel,
      };
    });
  });

  const marginBreadth = 80 - Math.min(0, minCalculatedBreadth);
  const marginRank = 60;
  const finalPositions = {};
  const nodeLevels = {};

  Object.keys(prePositions).forEach((nodeId) => {
    const { lvl, breadthPos, effectiveLevel } = prePositions[nodeId];
    const extraGap = Array.from(rankGapByLevel).reduce(
      (sum, [level, gap]) =>
        level >= minExplicitLevel && level < lvl ? sum + gap - RANK_SEP : sum,
      0
    );
    const rankPos = (lvl - minExplicitLevel) * dagreRankStep + extraGap + marginRank;
    const adjustedBreadth = breadthPos + marginBreadth;

    nodeLevels[nodeId] = effectiveLevel;

    if (isHorizontal) {
      finalPositions[nodeId] = {
        x: Math.round(rankPos),
        y: Math.round(adjustedBreadth - NODE_HEIGHT / 2),
      };
    } else {
      finalPositions[nodeId] = {
        x: Math.round(adjustedBreadth - NODE_WIDTH / 2),
        y: Math.round(rankPos),
      };
    }
  });

  const layoutedNodes = nodes.map((node) => ({
    ...node,
    targetPosition: isHorizontal ? "left" : "top",
    sourcePosition: isHorizontal ? "right" : "bottom",
    position: finalPositions[node.id],
  }));

  // Build card representation for obstacle-avoidance corridor calculation
  const cards = layoutedNodes.map((n) => ({
    id: n.id,
    level: nodeLevels[n.id] ?? 0,
    left: n.position.x,
    right: n.position.x + NODE_WIDTH,
    top: n.position.y,
    bottom: n.position.y + NODE_HEIGHT,
    centerX: n.position.x + NODE_WIDTH / 2,
    centerY: n.position.y + NODE_HEIGHT / 2,
  }));

  const cardMap = Object.fromEntries(cards.map((c) => [c.id, c]));

  // Tier boundaries
  const tierMap = {};
  cards.forEach((c) => {
    if (!tierMap[c.level]) {
      tierMap[c.level] = {
        minX: c.left,
        maxX: c.right,
        minY: c.top,
        maxY: c.bottom,
      };
    } else {
      tierMap[c.level].minX = Math.min(tierMap[c.level].minX, c.left);
      tierMap[c.level].maxX = Math.max(tierMap[c.level].maxX, c.right);
      tierMap[c.level].minY = Math.min(tierMap[c.level].minY, c.top);
      tierMap[c.level].maxY = Math.max(tierMap[c.level].maxY, c.bottom);
    }
  });

  function isVerticalClear(x, yStart, yEnd, ignoreIds = []) {
    const minY = Math.min(yStart, yEnd);
    const maxY = Math.max(yStart, yEnd);
    const pad = 12;

    for (const card of cards) {
      if (ignoreIds.includes(card.id)) continue;
      if (x >= card.left - pad && x <= card.right + pad) {
        if (maxY > card.top + 2 && minY < card.bottom - 2) {
          return false;
        }
      }
    }
    return true;
  }

  function isHorizontalClear(y, xStart, xEnd, ignoreIds = []) {
    const minX = Math.min(xStart, xEnd);
    const maxX = Math.max(xStart, xEnd);
    const pad = 12;

    for (const card of cards) {
      if (ignoreIds.includes(card.id)) continue;
      if (y >= card.top - pad && y <= card.bottom + pad) {
        if (maxX > card.left + 2 && minX < card.right - 2) {
          return false;
        }
      }
    }
    return true;
  }

  function findBestCorridorX(sourceX, targetX, yStart, yEnd, ignoreIds) {
    if (isVerticalClear(targetX, yStart, yEnd, ignoreIds)) {
      return targetX;
    }
    if (isVerticalClear(sourceX, yStart, yEnd, ignoreIds)) {
      return sourceX;
    }

    const candidates = new Set();
    const sorted = [...cards].sort((a, b) => a.left - b.left);

    let minLeft = Infinity;
    let maxRight = -Infinity;

    for (let i = 0; i < sorted.length; i++) {
      const c1 = sorted[i];
      if (c1.left < minLeft) minLeft = c1.left;
      if (c1.right > maxRight) maxRight = c1.right;

      for (let j = i + 1; j < sorted.length; j++) {
        const c2 = sorted[j];
        if (c1.level === c2.level && c2.left > c1.right) {
          candidates.add((c1.right + c2.left) / 2);
        }
      }
    }

    candidates.add(minLeft - 50);
    candidates.add(maxRight + 50);

    const clearList = Array.from(candidates).filter((x) =>
      isVerticalClear(x, yStart, yEnd, ignoreIds)
    );

    if (clearList.length === 0) {
      return targetX >= sourceX ? maxRight + 50 : minLeft - 50;
    }

    clearList.sort((a, b) => Math.abs(a - targetX) - Math.abs(b - targetX));
    return clearList[0];
  }

  function findBestCorridorY(sourceY, targetY, xStart, xEnd, ignoreIds) {
    if (isHorizontalClear(targetY, xStart, xEnd, ignoreIds)) {
      return targetY;
    }
    if (isHorizontalClear(sourceY, xStart, xEnd, ignoreIds)) {
      return sourceY;
    }

    const candidates = new Set();
    const sorted = [...cards].sort((a, b) => a.top - b.top);

    let minTop = Infinity;
    let maxBottom = -Infinity;

    for (let i = 0; i < sorted.length; i++) {
      const c1 = sorted[i];
      if (c1.top < minTop) minTop = c1.top;
      if (c1.bottom > maxBottom) maxBottom = c1.bottom;

      for (let j = i + 1; j < sorted.length; j++) {
        const c2 = sorted[j];
        if (c1.level === c2.level && c2.top > c1.bottom) {
          candidates.add((c1.bottom + c2.top) / 2);
        }
      }
    }

    candidates.add(minTop - 50);
    candidates.add(maxBottom + 50);

    const clearList = Array.from(candidates).filter((y) =>
      isHorizontalClear(y, xStart, xEnd, ignoreIds)
    );

    if (clearList.length === 0) {
      return targetY >= sourceY ? maxBottom + 50 : minTop - 50;
    }

    clearList.sort((a, b) => Math.abs(a - targetY) - Math.abs(b - targetY));
    return clearList[0];
  }

  // Generate clean, non-overlapping corridor-routed edges
  const layoutedEdges = edges.map((edge, idx) => {
    const sCard = cardMap[edge.source];
    const tCard = cardMap[edge.target];
    if (!sCard || !tCard) return edge;

    const sL = sCard.level;
    const tL = tCard.level;
    const trackOffset = laneOffsetByEdgeIndex.get(idx) ?? 0;

    let points = [];
    let labelPos = { x: 0, y: 0 };

    if (!isHorizontal) {
      // Top-to-Bottom (TB) Mode
      const sx = sCard.centerX;
      const sy = sCard.bottom;
      const tx = tCard.centerX;
      const ty = tCard.top;

      const sTier = tierMap[sL];
      const nextTier = tierMap[sL + 1] || { minY: sy + gapAfterLevel(sL) };
      const exitChannelBase = (sTier.maxY + nextTier.minY) / 2;
      const exitY = Math.round(exitChannelBase + trackOffset);

      const levelDiff = tL - sL;

      if (levelDiff <= 0) {
        // A same-tier or backward edge must go around the target before
        // approaching its top handle. Otherwise it crosses the target card.
        const corridorX = levelDiff === 0
          ? tx >= sx
            ? tCard.left - NODE_SEP / 2
            : tCard.right + NODE_SEP / 2
          : tx >= sx
            ? Math.max(...cards.map((card) => card.right)) + NODE_SEP / 2
            : Math.min(...cards.map((card) => card.left)) - NODE_SEP / 2;
        const entryY = tCard.top - NODE_SEP / 2;
        points = [
          { x: sx, y: sy },
          { x: sx, y: exitY },
          { x: corridorX, y: exitY },
          { x: corridorX, y: entryY },
          { x: tx, y: entryY },
          { x: tx, y: ty },
        ];
        labelPos = { x: (sx + corridorX) / 2, y: exitY };
      } else if (levelDiff === 1) {
        // Direct adjacent tier
        points = [
          { x: sx, y: sy },
          { x: sx, y: exitY },
          { x: tx, y: exitY },
          { x: tx, y: ty },
        ];
        labelPos = { x: (sx + tx) / 2, y: exitY };
      } else {
        // Skipping tiers or same tier
        const prevTier = tierMap[tL - 1] || { maxY: ty - gapAfterLevel(tL - 1) };
        const tTier = tierMap[tL] || { minY: ty };
        const entryChannelBase = (prevTier.maxY + tTier.minY) / 2;
        const entryY = Math.round(entryChannelBase + trackOffset);

        const corridorBase = findBestCorridorX(sx, tx, sy, ty, [sCard.id, tCard.id]);
        const corridorTrack = Math.round(corridorBase + ((idx % 3) - 1) * 12);

        if (corridorBase === tx) {
          // Direct vertical drop is completely clear
          points = [
            { x: sx, y: sy },
            { x: sx, y: exitY },
            { x: tx, y: exitY },
            { x: tx, y: ty },
          ];
          labelPos = { x: (sx + tx) / 2, y: exitY };
        } else {
          // Passes through clear corridor between cards
          points = [
            { x: sx, y: sy },
            { x: sx, y: exitY },
            { x: corridorTrack, y: exitY },
            { x: corridorTrack, y: entryY },
            { x: tx, y: entryY },
            { x: tx, y: ty },
          ];
          labelPos = { x: (sx + corridorTrack) / 2, y: exitY };
        }
      }
    } else {
      // Left-to-Right (LR) Mode
      const sx = sCard.right;
      const sy = sCard.centerY;
      const tx = tCard.left;
      const ty = tCard.centerY;

      const sTier = tierMap[sL];
      const nextTier = tierMap[sL + 1] || { minX: sx + gapAfterLevel(sL) };
      const exitChannelBase = (sTier.maxX + nextTier.minX) / 2;
      const exitX = Math.round(exitChannelBase + trackOffset);

      const levelDiff = tL - sL;

      if (levelDiff <= 0) {
        // In LR mode the input handle is on the left. Approach it from the
        // left, including when source and target share a tier.
        const exitCorridorX = levelDiff === 0
          ? exitX
          : Math.max(...cards.map((card) => card.right)) + NODE_SEP / 2;
        const corridorY = levelDiff === 0
          ? ty >= sy
            ? tCard.top - NODE_SEP / 2
            : tCard.bottom + NODE_SEP / 2
          : ty >= sy
            ? Math.max(...cards.map((card) => card.bottom)) + NODE_SEP / 2
            : Math.min(...cards.map((card) => card.top)) - NODE_SEP / 2;
        const entryX = tCard.left - NODE_SEP / 2;
        points = [
          { x: sx, y: sy },
          { x: exitCorridorX, y: sy },
          { x: exitCorridorX, y: corridorY },
          { x: entryX, y: corridorY },
          { x: entryX, y: ty },
          { x: tx, y: ty },
        ];
        labelPos = { x: exitCorridorX, y: (sy + corridorY) / 2 };
      } else if (levelDiff === 1) {
        points = [
          { x: sx, y: sy },
          { x: exitX, y: sy },
          { x: exitX, y: ty },
          { x: tx, y: ty },
        ];
        labelPos = { x: exitX, y: (sy + ty) / 2 };
      } else {
        const prevTier = tierMap[tL - 1] || { maxX: tx - gapAfterLevel(tL - 1) };
        const tTier = tierMap[tL] || { minX: tx };
        const entryChannelBase = (prevTier.maxX + tTier.minX) / 2;
        const entryX = Math.round(entryChannelBase + trackOffset);

        const corridorBase = findBestCorridorY(sy, ty, sx, tx, [sCard.id, tCard.id]);
        const corridorTrack = Math.round(corridorBase + ((idx % 3) - 1) * 12);

        if (corridorBase === ty) {
          points = [
            { x: sx, y: sy },
            { x: exitX, y: sy },
            { x: exitX, y: ty },
            { x: tx, y: ty },
          ];
          labelPos = { x: exitX, y: (sy + ty) / 2 };
        } else {
          points = [
            { x: sx, y: sy },
            { x: exitX, y: sy },
            { x: exitX, y: corridorTrack },
            { x: entryX, y: corridorTrack },
            { x: entryX, y: ty },
            { x: tx, y: ty },
          ];
          labelPos = { x: exitX, y: (sy + corridorTrack) / 2 };
        }
      }
    }

    return {
      ...edge,
      type: "smartEdge",
      data: {
        ...(edge.data || {}),
        points,
        labelPos,
        sourceLevel: sL,
        targetLevel: tL,
        direction,
        edgeIndex: idx,
      },
    };
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
}
