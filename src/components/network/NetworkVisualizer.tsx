'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { Offender, SyndicateLink } from '@/lib/data';
import { computeConvexHull, SIGNAL_METADATA } from '@/lib/syndicateAnalysis';
import { ZoomIn, ZoomOut, RotateCcw, Play, Pause, Users } from 'lucide-react';

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface Node {
  id: string;
  name: string;
  alias: string;
  riskScore: number;
  status: 'Active' | 'Parole' | 'Incarcerated';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  syndicateColor: string;
  syndicateId: string;
  degree: number;
}

interface VisLink {
  source: string;
  target: string;
  score: number;
  signals: string[];
  linkType: 'strong' | 'moderate' | 'weak';
}

const STATUS_COLORS = {
  "Active": { color: "#ef4444", glow: "rgba(239, 68, 68, 0.6)" },
  "Parole": { color: "#f59e0b", glow: "rgba(245, 158, 11, 0.6)" },
  "Incarcerated": { color: "#3b82f6", glow: "rgba(59, 130, 246, 0.4)" }
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function NetworkVisualizer() {
  const {
    offenders, setSelectedOffenderId, resolvedTheme,
    syndicateLinks, syndicateClusters, centralityMap,
    linkStrengthFilter, activeSignalFilters,
    highlightedNodeId, setHighlightedNodeId,
    selectedSyndicateId,
  } = useApp();

  const selectedSyndicate = syndicateClusters.find(c => c.id === selectedSyndicateId);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Simulation State
  const nodesRef = useRef<Node[]>([]);
  const linksRef = useRef<VisLink[]>([]);
  const nodeMapRef = useRef<Map<string, Node>>(new Map());
  const isSimulatingRef = useRef<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Interactive Viewport States
  const [scale, setScale] = useState<number>(1.0);
  const scaleRef = useRef<number>(1.0);
  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Mouse Interactivity Refs
  const draggedNodeRef = useRef<Node | null>(null);
  const hoveredNodeRef = useRef<Node | null>(null);
  const isDraggingCanvasRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Animation tick counter for particle effects
  const tickCountRef = useRef<number>(0);

  // Filters applied to links (refs for render loop access)
  const strengthFilterRef = useRef<number>(linkStrengthFilter);
  const signalFiltersRef = useRef<string[]>(activeSignalFilters);
  const highlightedRef = useRef<string | null>(highlightedNodeId);
  const selectedSyndicateRef = useRef<string | null>(selectedSyndicateId);

  useEffect(() => { strengthFilterRef.current = linkStrengthFilter; }, [linkStrengthFilter]);
  useEffect(() => { signalFiltersRef.current = activeSignalFilters; }, [activeSignalFilters]);
  useEffect(() => { highlightedRef.current = highlightedNodeId; }, [highlightedNodeId]);
  useEffect(() => { selectedSyndicateRef.current = selectedSyndicateId; }, [selectedSyndicateId]);

  // Build a lookup of offender → syndicate cluster
  const offenderClusterMap = useRef<Map<string, { syndicateId: string; color: string }>>(new Map());
  const clusterCentersRef = useRef<Map<string, { cx: number; cy: number }>>(new Map());

  // 1. Initialize Nodes & Links
  const setupNodesAndLinks = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = canvas.width;
    const h = canvas.height;

    // Build cluster lookup
    const clusterMap = new Map<string, { syndicateId: string; color: string }>();
    syndicateClusters.forEach(cluster => {
      cluster.members.forEach(memberId => {
        clusterMap.set(memberId, { syndicateId: cluster.id, color: cluster.color });
      });
    });
    offenderClusterMap.current = clusterMap;

    // Create node objects with positions in a circular spread per cluster
    const clusterCenters = new Map<string, { cx: number; cy: number }>();
    const clusterCount = syndicateClusters.filter(c => c.members.length > 1).length;
    syndicateClusters.filter(c => c.members.length > 1).forEach((cluster, idx) => {
      const angle = (idx / Math.max(1, clusterCount)) * 2 * Math.PI;
      const spreadRadius = Math.min(w, h) * 0.25;
      clusterCenters.set(cluster.id, {
        cx: w / 2 + Math.cos(angle) * spreadRadius,
        cy: h / 2 + Math.sin(angle) * spreadRadius,
      });
    });
    clusterCentersRef.current = clusterCenters;

    const clusterMemberCount = new Map<string, number>();

    const MAX_NODES_PER_SYNDICATE = 30;

    const activeMembers = new Set<string>();
    if (selectedSyndicateId) {
      const selectedCluster = syndicateClusters.find(c => c.id === selectedSyndicateId);
      if (selectedCluster) {
        if (selectedCluster.members.length <= MAX_NODES_PER_SYNDICATE) {
          selectedCluster.members.forEach(memberId => activeMembers.add(memberId));
        } else {
          // Select the top-N most connected members by degree centrality
          const ranked = selectedCluster.members
            .map(id => ({ id, degree: centralityMap.get(id)?.degree || 0 }))
            .sort((a, b) => b.degree - a.degree)
            .slice(0, MAX_NODES_PER_SYNDICATE);
          ranked.forEach(({ id }) => activeMembers.add(id));
        }
      }
    }

    const nodes: Node[] = offenders
      .filter(o => activeMembers.has(o.id))
      .map(o => {
      const clusterInfo = clusterMap.get(o.id);
      const centrality = centralityMap.get(o.id);
      const degree = centrality?.degree || 0;
      const syndicateId = clusterInfo?.syndicateId || 'none';
      const syndicateColor = clusterInfo?.color || '#64748b';

      // Position near cluster center or random if isolated
      const center = clusterCenters.get(syndicateId);
      const cx = center ? center.cx : w / 2;
      const cy = center ? center.cy : h / 2;

      // Node radius scaled by degree centrality (min 14, max 32)
      const baseRadius = 14;
      const maxExtraRadius = 18;
      const normalizedDegree = centrality?.normalizedDegree || 0;
      const radius = baseRadius + normalizedDegree * maxExtraRadius;

      // Track index of member inside its cluster to position systematically
      const memberIdx = clusterMemberCount.get(syndicateId) || 0;
      clusterMemberCount.set(syndicateId, memberIdx + 1);

      // Systematically distribute nodes in a spiral to prevent overlaps and initial congestion
      const totalMembersInCluster = activeMembers.size || 1;
      const goldenAngle = 2.399963; // golden angle in radians for even spiral
      const angle = memberIdx * goldenAngle;
      const distFromCenter = 120 + Math.sqrt(memberIdx) * 80;

      return {
        id: o.id,
        name: o.name,
        alias: o.alias,
        riskScore: o.riskScore,
        status: o.status,
        x: cx + Math.cos(angle) * distFromCenter,
        y: cy + Math.sin(angle) * distFromCenter,
        vx: 0,
        vy: 0,
        radius,
        syndicateColor,
        syndicateId,
        degree,
      };
    });

    // Convert syndicate links to vis links
    const links: VisLink[] = syndicateLinks
      .filter(sl => activeMembers.has(sl.source) && activeMembers.has(sl.target))
      .map(sl => ({
        source: sl.source,
        target: sl.target,
        score: sl.score,
        signals: sl.signals,
        linkType: sl.linkType,
      }));

    nodesRef.current = nodes;
    linksRef.current = links;
    // Rebuild persistent nodeMap for O(1) lookups in render loop
    const nMap = new Map<string, Node>();
    nodes.forEach(n => nMap.set(n.id, n));
    nodeMapRef.current = nMap;
  }, [offenders, syndicateLinks, syndicateClusters, centralityMap, selectedSyndicateId]);

  // 2. Physics & Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container || !canvas) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      // Update cluster centers based on new dimensions
      const w = canvas.width;
      const h = canvas.height;
      const clusterCenters = new Map<string, { cx: number; cy: number }>();
      const clusterCount = syndicateClusters.filter(c => c.members.length > 1).length;
      syndicateClusters.filter(c => c.members.length > 1).forEach((cluster, idx) => {
        const angle = (idx / Math.max(1, clusterCount)) * 2 * Math.PI;
        const spreadRadius = Math.min(w, h) * 0.25;
        clusterCenters.set(cluster.id, {
          cx: w / 2 + Math.cos(angle) * spreadRadius,
          cy: h / 2 + Math.sin(angle) * spreadRadius,
        });
      });
      clusterCentersRef.current = clusterCenters;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    setupNodesAndLinks();

    let animationId: number;

    const tick = () => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      const nodes = nodesRef.current;
      const allLinks = linksRef.current;
      const nodeMap = nodeMapRef.current;
      tickCountRef.current++;

      // Throttle physics to every 2nd frame for performance
      const runPhysics = tickCountRef.current % 2 === 0;

      // ─── FILTER LINKS by strength and signal type ──────────────────
      const minStrength = strengthFilterRef.current;
      const enabledSignals = new Set(signalFiltersRef.current);
      const filteredLinks = allLinks.filter(link => {
        if (link.score < minStrength) return false;
        return link.signals.some(s => enabledSignals.has(s));
      });

      // Stable base set: always the top-N strongest links (used for PHYSICS)
      // This never changes on hover, so the layout stays stable
      const MAX_BASE_LINKS = 40;
      let physicsLinks: VisLink[];
      if (filteredLinks.length > MAX_BASE_LINKS) {
        const sorted = [...filteredLinks].sort((a, b) => b.score - a.score);
        physicsLinks = sorted.slice(0, MAX_BASE_LINKS);
      } else {
        physicsLinks = filteredLinks;
      }

      // Render links = physics links + capped hover extras (visual only, no forces)
      const MAX_HOVER_EXTRAS = 8;
      let visibleLinks: VisLink[];
      const hoveredId = hoveredNodeRef.current?.id || null;
      if (hoveredId && filteredLinks.length > MAX_BASE_LINKS) {
        const baseKeys = new Set(physicsLinks.map(l => `${l.source}_${l.target}`));
        const extraHoverLinks = filteredLinks
          .filter(link =>
            (link.source === hoveredId || link.target === hoveredId) &&
            !baseKeys.has(`${link.source}_${link.target}`)
          )
          .sort((a, b) => b.score - a.score)
          .slice(0, MAX_HOVER_EXTRAS);
        visibleLinks = [...physicsLinks, ...extraHoverLinks];
      } else {
        visibleLinks = physicsLinks;
      }

      // ─── HIGHLIGHT LOGIC ──────────────────────────────────────────
      const hlId = highlightedRef.current;
      const selSyn = selectedSyndicateRef.current;
      let highlightSet: Set<string> | null = null;

      if (hlId) {
        // Show highlighted node + its 1-hop and 2-hop neighborhood
        highlightSet = new Set<string>([hlId]);
        // 1-hop
        visibleLinks.forEach(link => {
          if (link.source === hlId) highlightSet!.add(link.target);
          if (link.target === hlId) highlightSet!.add(link.source);
        });
        // 2-hop
        const oneHop = new Set(highlightSet);
        visibleLinks.forEach(link => {
          if (oneHop.has(link.source)) highlightSet!.add(link.target);
          if (oneHop.has(link.target)) highlightSet!.add(link.source);
        });
      } else if (selSyn) {
        // Show only nodes in the selected syndicate
        const cluster = syndicateClusters.find(c => c.id === selSyn);
        if (cluster) {
          highlightSet = new Set(cluster.members);
        }
      }

      // ─── PHYSICS SIMULATION ────────────────────────────────────────
      if (isSimulatingRef.current && runPhysics) {
        // A. Repulsive Force (Coulomb) — strong repulsion to spread nodes apart
        for (let i = 0; i < nodes.length; i++) {
          const n1 = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            if (dist < 600) {
              const force = (80000 / (dist * dist + 1000));
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              n1.vx -= fx;
              n1.vy -= fy;
              n2.vx += fx;
              n2.vy += fy;
            }
          }
        }

        // A2. Collision Resolution Force (guarantees nodes never overlap)
        for (let i = 0; i < nodes.length; i++) {
          const n1 = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = n1.radius + n2.radius + 15; // sum of radii + 15px padding
            if (dist < minDist) {
              const overlap = minDist - dist;
              const force = overlap * 0.4; // strong push
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              n1.vx -= fx;
              n1.vy -= fy;
              n2.vx += fx;
              n2.vy += fy;
            }
          }
        }

        // B. Attractive Force along PHYSICS links only (not hover extras)
        physicsLinks.forEach(link => {
          const n1 = nodeMap.get(link.source);
          const n2 = nodeMap.get(link.target);
          if (!n1 || !n2) return;

          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          const springDist = 250 + (1 - link.score) * 100; // much longer rest distance to spread out
          const k = 0.008; // weaker spring constant
          const force = (dist - springDist) * k;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          n1.vx += fx;
          n1.vy += fy;
          n2.vx -= fx;
          n2.vy -= fy;
        });

        // C. Center Gravity (pull nodes towards their syndicate cluster centers)
        nodes.forEach(node => {
          const center = clusterCentersRef.current.get(node.syndicateId);
          const targetX = center ? center.cx : w / 2;
          const targetY = center ? center.cy : h / 2;
          const dx = targetX - node.x;
          const dy = targetY - node.y;
          node.vx += dx * 0.002;
          node.vy += dy * 0.002;
        });

        // D. Update positions with damping
        // Pin dragged and hovered nodes so they don't fly away from the cursor
        nodes.forEach(node => {
          if (node === draggedNodeRef.current) return;
          if (node === hoveredNodeRef.current) {
            node.vx = 0;
            node.vy = 0;
            return;
          }
          node.x += node.vx;
          node.y += node.vy;
          node.vx *= 0.82;
          node.vy *= 0.82;
          node.x = Math.max(40, Math.min(w - 40, node.x));
          node.y = Math.max(40, Math.min(h - 40, node.y));
        });
      }

      // ─── RENDERING ─────────────────────────────────────────────────
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(panRef.current.x, panRef.current.y);
      ctx.scale(scaleRef.current, scaleRef.current);

      // A. Draw Cluster Convex Hulls
      const clusterNodeMap = new Map<string, { x: number; y: number }[]>();
      nodes.forEach(node => {
        if (node.syndicateId === 'none') return;
        if (!clusterNodeMap.has(node.syndicateId)) clusterNodeMap.set(node.syndicateId, []);
        clusterNodeMap.get(node.syndicateId)!.push({ x: node.x, y: node.y });
      });

      clusterNodeMap.forEach((points, clusterId) => {
        if (points.length < 3) return;
        
        // Dim hull if not in highlight set
        const cluster = syndicateClusters.find(c => c.id === clusterId);
        if (!cluster) return;

        const isClusterHighlighted = !highlightSet || cluster.members.some(m => highlightSet!.has(m));
        const hullAlpha = isClusterHighlighted ? 0.06 : 0.015;

        const hull = computeConvexHull(points);
        if (hull.length < 3) return;

        // Expand hull outward by padding
        const padding = 35;
        const cx = hull.reduce((s, p) => s + p.x, 0) / hull.length;
        const cy = hull.reduce((s, p) => s + p.y, 0) / hull.length;
        const expandedHull = hull.map(p => {
          const dx = p.x - cx;
          const dy = p.y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          return { x: p.x + (dx / dist) * padding, y: p.y + (dy / dist) * padding };
        });

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(expandedHull[0].x, expandedHull[0].y);
        for (let i = 1; i < expandedHull.length; i++) {
          ctx.lineTo(expandedHull[i].x, expandedHull[i].y);
        }
        ctx.closePath();

        ctx.fillStyle = cluster.color + (isClusterHighlighted ? '18' : '08');
        ctx.fill();
        ctx.strokeStyle = cluster.color + (isClusterHighlighted ? '40' : '15');
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      });

      // B. Draw Links
      visibleLinks.forEach(link => {
        const n1 = nodeMap.get(link.source);
        const n2 = nodeMap.get(link.target);
        if (!n1 || !n2) return;

        // Dim logic
        const isLinkHighlighted = !highlightSet || (highlightSet.has(link.source) && highlightSet.has(link.target));
        const dimFactor = isLinkHighlighted ? 1.0 : 0.08;

        // Link thickness based on score
        const baseWidth = 0.8;
        const maxWidth = 3.5;
        const lineWidth = baseWidth + (link.score / 1.0) * (maxWidth - baseWidth);

        // Link color from primary signal
        const primarySignal = link.signals[0];
        const signalInfo = SIGNAL_METADATA[primarySignal];
        const linkColor = signalInfo?.color || '#94a3b8';

        ctx.save();
        ctx.globalAlpha = dimFactor;

        // Dash pattern for weak links
        if (link.linkType === 'weak') {
          ctx.setLineDash([4, 4]);
        } else if (link.linkType === 'moderate') {
          ctx.setLineDash([8, 3]);
        }

        ctx.strokeStyle = linkColor;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Particle flow animation for strong links
        if (link.linkType === 'strong' && isLinkHighlighted) {
          const t = (tickCountRef.current % 120) / 120;
          const px = n1.x + (n2.x - n1.x) * t;
          const py = n1.y + (n2.y - n1.y) * t;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = linkColor;
          ctx.fill();
        }

        ctx.restore();
      });

      // C. Draw Nodes
      nodes.forEach(node => {
        const isHovered = hoveredNodeRef.current?.id === node.id;
        const isNodeHighlighted = !highlightSet || highlightSet.has(node.id);
        const dimFactor = isNodeHighlighted ? 1.0 : 0.12;
        const statusTheme = STATUS_COLORS[node.status] || { color: '#fff', glow: 'rgba(255,255,255,0.2)' };

        ctx.save();
        ctx.globalAlpha = dimFactor;

        // Cluster color fill (no shadowBlur — it's extremely expensive on canvas)
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.syndicateColor;
        ctx.fill();

        // Lightweight glow ring instead of expensive shadow
        if (isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 5, 0, Math.PI * 2);
          ctx.strokeStyle = node.syndicateColor + '60';
          ctx.lineWidth = 4;
          ctx.stroke();
        }

        // Status ring (outer ring showing Active/Parole/Incarcerated)
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = statusTheme.color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // White outline on hover
        if (isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + 6, 0, Math.PI * 2);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Inner label text
        ctx.fillStyle = '#ffffff';
        ctx.font = isHovered ? "bold 10px 'Inter', sans-serif" : "9px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelText = node.alias.length > 6 ? node.alias.substring(0, 5) + '…' : node.alias;
        ctx.fillText(labelText, node.x, node.y);

        // Degree badge (small circle with number)
        if (node.degree > 0 && dimFactor > 0.5) {
          const badgeX = node.x + node.radius * 0.7;
          const badgeY = node.y - node.radius * 0.7;
          ctx.beginPath();
          ctx.arc(badgeX, badgeY, 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fill();
          ctx.strokeStyle = node.syndicateColor;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = "bold 7px 'Inter', sans-serif";
          ctx.fillText(String(node.degree), badgeX, badgeY);
        }

        ctx.restore();

        // Hover tooltip (enriched)
        if (isHovered && dimFactor > 0.5) {
          ctx.save();
          ctx.globalAlpha = 1;

          const cluster = syndicateClusters.find(c => c.members.includes(node.id));
          const centrality = centralityMap.get(node.id);

          const line1 = `${node.name}`;
          const line2 = `Risk: ${node.riskScore}% | Status: ${node.status}`;
          const line3 = cluster && cluster.members.length > 1 ? `Syndicate: ${cluster.name}` : 'Isolated Node';
          const line4 = `Degree: ${node.degree} | Betweenness: ${(centrality?.betweenness || 0).toFixed(1)}`;

          const lines = [line1, line2, line3, line4];
          let maxTextWidth = 0;
          lines.forEach((line, i) => {
            ctx.font = i === 0 
              ? "bold 9px 'JetBrains Mono', monospace" 
              : "9px 'JetBrains Mono', monospace";
            const w = ctx.measureText(line).width;
            if (w > maxTextWidth) maxTextWidth = w;
          });

          const boxW = maxTextWidth + 20;
          const lineH = 14;
          const boxH = lines.length * lineH + 12;
          // Constrain box positions to stay within visible canvas boundaries (accounting for scale and pan)
          const padding = 10;
          const minBoxX = (padding - panRef.current.x) / scaleRef.current;
          const maxBoxX = (w - padding - panRef.current.x) / scaleRef.current - boxW;
          const minBoxY = (padding - panRef.current.y) / scaleRef.current;
          const maxBoxY = (h - padding - panRef.current.y) / scaleRef.current - boxH;

          let boxX = node.x - boxW / 2;
          boxX = Math.max(minBoxX, Math.min(maxBoxX, boxX));

          let boxY = node.y - node.radius - boxH - 12;
          if (boxY < minBoxY) {
            boxY = node.y + node.radius + 12;
          }
          boxY = Math.max(minBoxY, Math.min(maxBoxY, boxY));

          ctx.fillStyle = resolvedTheme === 'light' ? 'rgba(255, 255, 255, 0.96)' : 'rgba(8, 12, 24, 0.96)';
          ctx.strokeStyle = node.syndicateColor + '80';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxW, boxH, 6);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          lines.forEach((line, i) => {
            ctx.font = i === 0 ? "bold 9px 'JetBrains Mono', monospace" : "9px 'JetBrains Mono', monospace";
            if (i === 2 && cluster) ctx.fillStyle = cluster.color;
            else ctx.fillStyle = resolvedTheme === 'light' ? '#0f172a' : '#e2e8f0';
            ctx.fillText(line, boxX + boxW / 2, boxY + 10 + i * lineH);
          });

          ctx.restore();
        }
      });

      ctx.restore(); // Reset transform matrix

      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [offenders, resolvedTheme, syndicateLinks, syndicateClusters, centralityMap, setupNodesAndLinks]);

  // Synchronize scaleRef
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // 3. Mouse Interaction Listeners
  const getMouseCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldX = (mouseX - panRef.current.x) / scaleRef.current;
    const worldY = (mouseY - panRef.current.y) / scaleRef.current;
    return { x: worldX, y: worldY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMouseCoords(e);
    const clickedNode = nodesRef.current.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius;
    });

    if (clickedNode) {
      draggedNodeRef.current = clickedNode;
      clickedNode.vx = 0;
      clickedNode.vy = 0;
    } else {
      isDraggingCanvasRef.current = true;
      dragStartRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMouseCoords(e);

    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = x;
      draggedNodeRef.current.y = y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      return;
    }

    if (isDraggingCanvasRef.current) {
      panRef.current = {
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      };
      return;
    }

    const hoverNode = nodesRef.current.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius;
    });

    hoveredNodeRef.current = hoverNode || null;
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNodeRef.current) {
      const { x, y } = getMouseCoords(e);
      const dx = draggedNodeRef.current.x - x;
      const dy = draggedNodeRef.current.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 2) {
        // Click → toggle highlight + open dossier
        const clickedId = draggedNodeRef.current.id;
        if (highlightedNodeId === clickedId) {
          setHighlightedNodeId(null);
        } else {
          setHighlightedNodeId(clickedId);
        }
        setSelectedOffenderId(clickedId);
      }
      draggedNodeRef.current = null;
    }
    isDraggingCanvasRef.current = false;
  };

  const handleMouseLeave = () => {
    draggedNodeRef.current = null;
    isDraggingCanvasRef.current = false;
    hoveredNodeRef.current = null;
  };

  // 4. Zoom & Pan
  const handleZoomIn = () => setScale(s => Math.min(s + 0.15, 2.5));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.15, 0.3));
  const handleReset = () => {
    setScale(1.0);
    panRef.current = { x: 0, y: 0 };
    setHighlightedNodeId(null);
    setupNodesAndLinks();
  };

  const handleToggleSimulation = () => {
    isSimulatingRef.current = !isSimulatingRef.current;
    setIsPlaying(isSimulatingRef.current);
  };

  return (
    <div className="canvas-container glass-panel" ref={containerRef}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        id="networkCanvas"
      />

      {selectedSyndicate && (
        <div style={{
          position: 'absolute',
          top: '1.25rem',
          left: '1.25rem',
          zIndex: 5,
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          background: 'rgba(8, 12, 24, 0.65)',
          padding: '0.75rem 1.25rem',
          borderRadius: '8px',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          maxWidth: '80%',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: selectedSyndicate.color,
              boxShadow: `0 0 12px ${selectedSyndicate.color}`,
              flexShrink: 0,
            }} />
            <h2 style={{
              margin: 0,
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontFamily: "var(--font-family-title, 'Inter', sans-serif)",
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
            }}>
              {selectedSyndicate.name}
            </h2>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.7rem',
            color: 'var(--text-muted, #94a3b8)',
            fontFamily: "var(--font-family-sans, 'Inter', sans-serif)",
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ color: '#fff', fontWeight: 600 }}>{selectedSyndicate.members.length}</span> Members
            </span>
            <span style={{ opacity: 0.35 }}>|</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              Avg Risk: <span style={{ color: 'var(--color-blue, #3b82f6)', fontWeight: 600 }}>{selectedSyndicate.avgRiskScore}%</span>
            </span>
            <span style={{ opacity: 0.35 }}>|</span>
            <span>Focus: <span style={{ color: 'var(--color-yellow, #f59e0b)', fontWeight: 600 }}>{selectedSyndicate.primaryCrimeType}</span></span>
            <span style={{ opacity: 0.35 }}>|</span>
            <span>Region: <span style={{ color: '#a855f7', fontWeight: 600 }}>{selectedSyndicate.geographicFocus}</span></span>
          </div>
        </div>
      )}

      {!selectedSyndicateId && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          color: 'var(--text-muted)',
          textAlign: 'center',
          padding: '2rem',
          zIndex: 10,
          pointerEvents: 'none',
          borderRadius: '12px',
        }}>
          <Users size={48} style={{ color: 'var(--color-blue)', marginBottom: '1.25rem', opacity: 0.85 }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1.2rem', fontWeight: 600 }}>Syndicate Network Inquest</h3>
          <p style={{ fontSize: '0.8rem', maxWidth: '340px', margin: 0, lineHeight: 1.5, color: 'var(--text-dark)' }}>
            Select a syndicate profile from the <strong>Detected Syndicates</strong> catalog on the left to analyze its connection graphs, hubs, and communication pathways.
          </p>
        </div>
      )}

      {/* Network Zoom and Simulation Controls */}
      <div className="network-controls">
        <button
          className="network-ctrl-btn"
          title={isPlaying ? "Pause Simulation" : "Resume Simulation"}
          onClick={handleToggleSimulation}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button className="network-ctrl-btn" title="Zoom In" onClick={handleZoomIn}>
          <ZoomIn size={14} />
        </button>
        <button className="network-ctrl-btn" title="Zoom Out" onClick={handleZoomOut}>
          <ZoomOut size={14} />
        </button>
        <button className="network-ctrl-btn" title="Reset Force Graph" onClick={handleReset}>
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Highlight Clear Button */}
      {highlightedNodeId && (
        <button
          className="network-ctrl-btn"
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            fontSize: '0.65rem',
            padding: '0.3rem 0.6rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
          }}
          onClick={() => setHighlightedNodeId(null)}
          title="Clear node highlight"
        >
          ✕ Clear Highlight
        </button>
      )}
    </div>
  );
}
