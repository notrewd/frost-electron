import { EdgeLabelRenderer } from "@xyflow/react";

export interface EdgeLabelData {
  label?: string;
  sourceCardinality?: string;
  targetCardinality?: string;
}

interface EdgeLabelProps {
  labelX: number;
  labelY: number;
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  data?: EdgeLabelData;
  className?: string;
}

export function EdgeLabel({
  labelX,
  labelY,
  sx,
  sy,
  tx,
  ty,
  data,
  className,
}: EdgeLabelProps) {
  if (!data?.label && !data?.sourceCardinality && !data?.targetCardinality) {
    return null;
  }

  // Calculate angles to place cardinalities near edge tips correctly
  // Distance from node edge
  const CARD_OFFSET = 30;

  // Source vector
  const sourceVecX = tx - sx;
  const sourceVecY = ty - sy;
  const sourceLen =
    Math.sqrt(sourceVecX * sourceVecX + sourceVecY * sourceVecY) || 1;
  const sNormX = sourceVecX / sourceLen;
  const sNormY = sourceVecY / sourceLen;

  const scX = sx + sNormX * CARD_OFFSET;
  const scY = sy + sNormY * CARD_OFFSET;

  // Target vector
  const tNormX = -sNormX;
  const tNormY = -sNormY;

  const tcX = tx + tNormX * CARD_OFFSET;
  const tcY = ty + tNormY * CARD_OFFSET;

  return (
    <EdgeLabelRenderer>
      {data?.sourceCardinality && (
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${scX}px,${scY}px)`,
            pointerEvents: "all",
            zIndex: 10,
          }}
          className="text-xs font-mono text-muted-foreground bg-background/80 px-1 rounded backdrop-blur-sm"
        >
          {data.sourceCardinality}
        </div>
      )}

      {data?.label && (
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
            zIndex: 10,
          }}
          className={
            className ||
            "text-xs font-semibold px-2 py-0.5 bg-background border rounded shadow-sm"
          }
        >
          {data.label}
        </div>
      )}

      {data?.targetCardinality && (
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${tcX}px,${tcY}px)`,
            pointerEvents: "all",
            zIndex: 10,
          }}
          className="text-xs font-mono text-muted-foreground bg-background/80 px-1 rounded backdrop-blur-sm"
        >
          {data.targetCardinality}
        </div>
      )}
    </EdgeLabelRenderer>
  );
}

