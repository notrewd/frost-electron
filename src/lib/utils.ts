import {
  MarkerType,
  Position,
  type InternalNode,
  type XYPosition,
  type Node,
  type Edge,
  getBezierPath,
} from "@xyflow/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertProjectNameToFileName(name: string) {
  if (!name || name.trim().length === 0) {
    return "untitled.frost";
  }

  if (!name.trim().includes(" ")) {
    return name.endsWith(".fr") ? name.trim() : `${name.trim()}.fr`;
  }

  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .concat(".fr");
}

export function generateUniqueParameterId() {
  return `param-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function generateUniqueAttributeId() {
  return `attr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function generateUniqueMethodId() {
  return `method-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// this helper function returns the intersection point
// of the line between the center of the intersectionNode and the target node
function getNodeIntersection(
  intersectionNode: InternalNode,
  targetNode: InternalNode,
) {
  // https://math.stackexchange.com/questions/1724792/an-algorithm-for-finding-the-intersection-point-between-a-center-of-vision-and-a
  const w =
    (intersectionNode.measured?.width ?? intersectionNode.width ?? 150) / 2;
  const h =
    (intersectionNode.measured?.height ?? intersectionNode.height ?? 50) / 2;

  const intersectionNodePosition =
    intersectionNode.internals?.positionAbsolute ||
    (intersectionNode as any).positionAbsolute ||
    intersectionNode.position;
  const targetPosition =
    targetNode.internals?.positionAbsolute ||
    (targetNode as any).positionAbsolute ||
    targetNode.position;

  const x2 = intersectionNodePosition.x + w;
  const y2 = intersectionNodePosition.y + h;
  const x1 =
    targetPosition.x +
    (targetNode.measured?.width ?? targetNode.width ?? 150) / 2;
  const y1 =
    targetPosition.y +
    (targetNode.measured?.height ?? targetNode.height ?? 50) / 2;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1);
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x2;
  const y = h * (-xx3 + yy3) + y2;

  return { x, y };
}

// returns the position (top,right,bottom or right) passed node compared to the intersection point
function getEdgePosition(node: InternalNode, intersectionPoint: XYPosition) {
  const nPos =
    node.internals?.positionAbsolute ||
    (node as any).positionAbsolute ||
    node.position;
  const nx = Math.round(nPos.x);
  const ny = Math.round(nPos.y);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);

  const width = Math.round(node.measured?.width ?? node.width ?? 150);
  const height = Math.round(node.measured?.height ?? node.height ?? 50);

  if (px <= nx + 1) {
    return Position.Left;
  }
  if (px >= nx + width - 1) {
    return Position.Right;
  }
  if (py <= ny + 1) {
    return Position.Top;
  }
  if (py >= ny + height - 1) {
    return Position.Bottom;
  }

  return Position.Top;
}

// returns the parameters (sx, sy, tx, ty, sourcePos, targetPos) you need to create an edge
export function getEdgeParams(source: InternalNode, target: InternalNode) {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
  const targetPos = getEdgePosition(target, targetIntersectionPoint);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  };
}

export function getSmartBezierPath({
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
}: {
  sourceX: number;
  sourceY: number;
  sourcePosition?: Position;
  targetX: number;
  targetY: number;
  targetPosition?: Position;
}) {
  const lineLength = 20;

  let tx_offset = targetX;
  let ty_offset = targetY;
  if (targetPosition === Position.Left) tx_offset -= lineLength;
  if (targetPosition === Position.Right) tx_offset += lineLength;
  if (targetPosition === Position.Top) ty_offset -= lineLength;
  if (targetPosition === Position.Bottom) ty_offset += lineLength;

  let sx_offset = sourceX;
  let sy_offset = sourceY;
  if (sourcePosition === Position.Left) sx_offset -= lineLength;
  if (sourcePosition === Position.Right) sx_offset += lineLength;
  if (sourcePosition === Position.Top) sy_offset -= lineLength;
  if (sourcePosition === Position.Bottom) sy_offset += lineLength;

  const [bezierPath, labelX, labelY] = getBezierPath({
    sourceX: sx_offset,
    sourceY: sy_offset,
    sourcePosition,
    targetX: tx_offset,
    targetY: ty_offset,
    targetPosition,
  });

  const path = `M ${sourceX} ${sourceY} L ${sx_offset} ${sy_offset} ${bezierPath.substring(bezierPath.indexOf("C"))} L ${targetX} ${targetY}`;

  return [path, labelX, labelY] as [string, number, number];
}

export function createNodesAndEdges() {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  nodes.push({ id: "target", data: { label: "Target" }, position: center });

  for (let i = 0; i < 8; i++) {
    const degrees = i * (360 / 8);
    const radians = degrees * (Math.PI / 180);
    const x = 250 * Math.cos(radians) + center.x;
    const y = 250 * Math.sin(radians) + center.y;

    nodes.push({ id: `${i}`, data: { label: "Source" }, position: { x, y } });

    edges.push({
      id: `edge-${i}`,
      target: "target",
      source: `${i}`,
      type: "floating",
      markerEnd: {
        type: MarkerType.Arrow,
      },
    });
  }

  return { nodes, edges };
}

function hexToHsl(hex: string) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h, s, l };
}

function hslToHex(h: number, s: number, l: number) {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getThemeColorCounterpart(hex: string, isDark: boolean) {
  if (!hex || !hex.startsWith("#")) return hex;
  let { h, s, l } = hexToHsl(hex);

  if (isDark) {
    l += 0.3;
  } else {
    l -= 0.3;
  }

  return hslToHex(h, s, Math.max(0, Math.min(1, l)));
}
