import { memo } from 'react';
import {
  BaseEdge,
  useInternalNode,
  type EdgeProps,
  getStraightPath,
  getSmoothStepPath,
} from "@xyflow/react";

import { getEdgeParams, getSmartBezierPath } from "../../lib/utils";
import DiamondFilled from "../ui/icons/markers/diamond-filled";
import { useSettingsStore } from "@/stores/settings-store";
import { useShallow } from "zustand/react/shallow";
import { EdgeLabel } from "./edge-label-renderer";

function CompositionEdge({ id, source, target, style, data }: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
    sourceNode,
    targetNode,
  );

  const { edgeStyle, showEdgeLabels } =
    useSettingsStore(
      useShallow((state) => ({
        edgeStyle: state.edge_style,
        showEdgeLabels: state.show_edge_labels,
      })),
    );

  let path, labelX, labelY;
  if (edgeStyle === "straight") {
    [path, labelX, labelY] = getStraightPath({
      sourceX: sx,
      sourceY: sy,
      targetX: tx,
      targetY: ty,
    });
  } else if (edgeStyle === "smoothstep") {
    [path, labelX, labelY] = getSmoothStepPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: sourcePos,
      targetPosition: targetPos,
      targetX: tx,
      targetY: ty,
    });
  } else {
    [path, labelX, labelY] = getSmartBezierPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: sourcePos,
      targetPosition: targetPos,
      targetX: tx,
      targetY: ty,
    });
  }return (
    <>
      <DiamondFilled />
      <BaseEdge
        id={id}
        className="react-flow__edge-path"
        path={path}
        markerEnd={"url(#diamond-filled)"}
        style={style}
      />
      {showEdgeLabels && (
        <EdgeLabel
          labelX={labelX}
          labelY={labelY}
          sx={sx}
          sy={sy}
          tx={tx}
          ty={ty}
          data={data}
        />
      )}
    </>
  );
}

export default memo(CompositionEdge);






