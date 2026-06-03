'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Offender } from '@/lib/data';
import { ZoomIn, ZoomOut, RotateCcw, Play, Pause } from 'lucide-react';

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
}

interface Link {
  source: string;
  target: string;
}

const STATUS_COLORS = {
  "Active": { color: "#ef4444", glow: "rgba(239, 68, 68, 0.6)" },
  "Parole": { color: "#f59e0b", glow: "rgba(245, 158, 11, 0.6)" },
  "Incarcerated": { color: "#3b82f6", glow: "rgba(59, 130, 246, 0.4)" }
};

export default function NetworkVisualizer() {
  const { offenders, setSelectedOffenderId, resolvedTheme } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Simulation State
  const nodesRef = useRef<Node[]>([]);
  const linksRef = useRef<Link[]>([]);
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

  // 1. Initialize Nodes & Links
  const setupNodesAndLinks = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = canvas.width;
    const h = canvas.height;

    // Create node objects with random positions near center
    const nodes: Node[] = offenders.map(o => ({
      id: o.id,
      name: o.name,
      alias: o.alias,
      riskScore: o.riskScore,
      status: o.status,
      x: w / 2 + (Math.random() - 0.5) * 200,
      y: h / 2 + (Math.random() - 0.5) * 200,
      vx: 0,
      vy: 0,
      radius: 20
    }));

    // Generate links from offender associate arrays
    const links: Link[] = [];
    offenders.forEach(o => {
      o.associates.forEach(assocId => {
        // Prevent duplicate undirected links
        const exists = links.some(l => 
          (l.source === o.id && l.target === assocId) || 
          (l.source === assocId && l.target === o.id)
        );
        const targetExists = offenders.some(other => other.id === assocId);
        if (!exists && targetExists) {
          links.push({ source: o.id, target: assocId });
        }
      });
    });

    nodesRef.current = nodes;
    linksRef.current = links;
  };

  // 2. Physics & Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle canvas resizing
    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container || !canvas) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
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
      const links = linksRef.current;

      // --- PHYSICS SIMULATION ---
      if (isSimulatingRef.current) {
        // A. Repulsive Force between nodes (Coulomb repulsive force)
        for (let i = 0; i < nodes.length; i++) {
          const n1 = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            if (dist < 320) {
              const force = (3000 / (dist * dist)); // Strength of repulsiveness
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              // Distribute forces opposite
              n1.vx -= fx;
              n1.vy -= fy;
              n2.vx += fx;
              n2.vy += fy;
            }
          }
        }

        // B. Attractive Force along links (Hooke's spring pull)
        links.forEach(link => {
          const n1 = nodes.find(n => n.id === link.source);
          const n2 = nodes.find(n => n.id === link.target);
          if (!n1 || !n2) return;

          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          // Resting spring distance of 140px
          const springDist = 140;
          const k = 0.015; // Spring constant
          const force = (dist - springDist) * k;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          n1.vx += fx;
          n1.vy += fy;
          n2.vx -= fx;
          n2.vy -= fy;
        });

        // C. Center Gravity force (prevents drifting off-screen)
        nodes.forEach(node => {
          const dx = w / 2 - node.x;
          const dy = h / 2 - node.y;
          const gravity = 0.005;

          node.vx += dx * gravity;
          node.vy += dy * gravity;
        });

        // D. Update node positions with Frictional damping
        nodes.forEach(node => {
          if (node === draggedNodeRef.current) return; // Locked to mouse drag

          node.x += node.vx;
          node.y += node.vy;

          // Damping friction
          node.vx *= 0.85;
          node.vy *= 0.85;

          // Bound coordinates inside canvas (roughly)
          node.x = Math.max(40, Math.min(w - 40, node.x));
          node.y = Math.max(40, Math.min(h - 40, node.y));
        });
      }

      // --- RENDERING ROUTINE ---
      ctx.clearRect(0, 0, w, h);

      // Save context state for camera transform
      ctx.save();
      ctx.translate(panRef.current.x, panRef.current.y);
      ctx.scale(scaleRef.current, scaleRef.current);

      // A. Draw Links
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'; // always use light lines since canvas background is always dark
      ctx.lineWidth = 1.5;
      links.forEach(link => {
        const n1 = nodes.find(n => n.id === link.source);
        const n2 = nodes.find(n => n.id === link.target);
        if (!n1 || !n2) return;

        // Draw connections
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
      });

      // B. Draw Nodes
      nodes.forEach(node => {
        const isHovered = hoveredNodeRef.current?.id === node.id;
        const theme = STATUS_COLORS[node.status] || { color: '#fff', glow: 'rgba(255,255,255,0.2)' };

        ctx.save();

        // Node Glow Ring
        ctx.shadowColor = theme.color;
        ctx.shadowBlur = isHovered ? 16 : 8;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = theme.color;
        ctx.fill();

        ctx.restore();

        // Node outline
        ctx.strokeStyle = isHovered 
          ? '#ffffff' // always use white/light outline since canvas background is always dark
          : 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner Initial Label text
        ctx.fillStyle = '#ffffff';
        ctx.font = isHovered ? "bold 11px 'Inter', sans-serif" : "10px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.alias, node.x, node.y);

        // Hover overlay info box
        if (isHovered) {
          ctx.save();
          ctx.fillStyle = resolvedTheme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(8, 12, 20, 0.95)';
          ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
          ctx.lineWidth = 1;

          const labelText = `${node.name} (${node.riskScore}% Risk)`;
          const textWidth = ctx.measureText(labelText).width;
          const boxW = textWidth + 16;
          const boxH = 20;
          const boxX = node.x - boxW / 2;
          const boxY = node.y - node.radius - 28;

          ctx.beginPath();
          ctx.roundRect(boxX, boxY, boxW, boxH, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = resolvedTheme === 'light' ? '#0f172a' : '#ffffff';
          ctx.font = "9px 'JetBrains Mono', monospace";
          ctx.fillText(labelText, node.x, boxY + 10);
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
  }, [offenders, resolvedTheme]);

  // Synchronize scaleRef for physics rendering thread
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  // 3. Mouse Interaction Listeners
  const getMouseCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Convert client coords into canvas coords adjusted for current pan and zoom
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldX = (mouseX - panRef.current.x) / scaleRef.current;
    const worldY = (mouseY - panRef.current.y) / scaleRef.current;
    
    return { x: worldX, y: worldY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMouseCoords(e);
    
    // Find if a node was clicked
    const clickedNode = nodesRef.current.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist <= node.radius;
    });

    if (clickedNode) {
      draggedNodeRef.current = clickedNode;
      // Anchor the position
      clickedNode.vx = 0;
      clickedNode.vy = 0;
    } else {
      isDraggingCanvasRef.current = true;
      dragStartRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMouseCoords(e);

    // 1. Drag Node
    if (draggedNodeRef.current) {
      draggedNodeRef.current.x = x;
      draggedNodeRef.current.y = y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      return;
    }

    // 2. Drag Viewport
    if (isDraggingCanvasRef.current) {
      panRef.current = {
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      };
      return;
    }

    // 3. Hover Node Check
    const hoverNode = nodesRef.current.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius;
    });

    hoveredNodeRef.current = hoverNode || null;
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNodeRef.current) {
      // Trigger offender inspect on simple click (drag distance ~ 0)
      const { x, y } = getMouseCoords(e);
      const dx = draggedNodeRef.current.x - x;
      const dy = draggedNodeRef.current.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 2) {
        setSelectedOffenderId(draggedNodeRef.current.id);
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

  // 4. Zoom & Pan operations
  const handleZoomIn = () => setScale(s => Math.min(s + 0.15, 2.0));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.15, 0.5));
  const handleReset = () => {
    setScale(1.0);
    panRef.current = { x: 0, y: 0 };
    setupNodesAndLinks(); // Re-randomize positions
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
    </div>
  );
}
