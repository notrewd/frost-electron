import { useEffect, useRef } from "react";
import useFlowStore from "@/stores/flow-store";

const PADDING = 40;
const TOP_PADDING = 40;

/**
 * Centralized hook that keeps every group node tightly wrapped around
 * its children.  Processes groups bottom-up so nested groups are sized
 * before their parent groups measure them.
 *
 * Two modes:
 *   - **Expand-only** (while any node is being dragged): the group only
 *     grows to accommodate children that move outside its current bounds.
 *     Children are never shifted, so the drag feels smooth.
 *   - **Full recenter** (idle): children are re-centered with uniform
 *     padding and the group is tight-fitted.
 *
 * A geometry fingerprint prevents the hook from firing when only
 * selection / other visual-only properties change.
 */
export function useGroupAutoResize() {
  const isUpdatingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const prevGeometryRef = useRef("");

  useEffect(() => {
    function buildGeometryKey(nodes: any[]): string {
      let key = "";
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        key += n.id;
        key += n.position.x;
        key += n.position.y;
        key += n.measured?.width ?? n.style?.width ?? 0;
        key += n.measured?.height ?? n.style?.height ?? 0;
        key += n.parentId ?? "";
        key += n.type ?? "";
      }
      return key;
    }

    function recalculate() {
      if (isUpdatingRef.current) return;

      const { nodes } = useFlowStore.getState();

      // Fast exit: only recalculate when geometry actually changed
      const geoKey = buildGeometryKey(nodes);
      if (geoKey === prevGeometryRef.current) return;
      prevGeometryRef.current = geoKey;

      const groups = nodes.filter((n) => n.type === "group");
      if (groups.length === 0) return;

      const isDragging = nodes.some((n) => n.dragging);

      // ------- Build depth map for bottom-up ordering -------
      const depthMap = new Map<string, number>();
      function getDepth(nodeId: string): number {
        if (depthMap.has(nodeId)) return depthMap.get(nodeId)!;
        const node = nodes.find((n) => n.id === nodeId);
        if (!node?.parentId) {
          depthMap.set(nodeId, 0);
          return 0;
        }
        const depth = getDepth(node.parentId) + 1;
        depthMap.set(nodeId, depth);
        return depth;
      }
      groups.forEach((g) => getDepth(g.id));

      const sortedGroups = [...groups].sort(
        (a, b) => (depthMap.get(b.id) || 0) - (depthMap.get(a.id) || 0),
      );

      // ------- Working maps (mutated as inner groups are resolved) -------
      const posMap = new Map(
        nodes.map((n) => [n.id, { x: n.position.x, y: n.position.y }]),
      );
      const sizeMap = new Map(
        nodes.map((n) => [
          n.id,
          {
            w: Number(n.measured?.width || n.style?.width || 200),
            h: Number(n.measured?.height || n.style?.height || 200),
          },
        ]),
      );
      const styleMap = new Map(
        nodes.map((n) => [n.id, n.style ? { ...n.style } : {}]),
      );

      let needsUpdate = false;
      const updates = new Map<
        string,
        { position?: { x: number; y: number }; style?: Record<string, any> }
      >();

      for (const group of sortedGroups) {
        const children = nodes.filter((n) => n.parentId === group.id);
        if (children.length === 0) continue;

        const minX = Math.min(...children.map((c) => posMap.get(c.id)!.x));
        const minY = Math.min(...children.map((c) => posMap.get(c.id)!.y));
        const maxX = Math.max(
          ...children.map((c) => posMap.get(c.id)!.x + sizeMap.get(c.id)!.w),
        );
        const maxY = Math.max(
          ...children.map((c) => posMap.get(c.id)!.y + sizeMap.get(c.id)!.h),
        );

        const currentWidth = Number(styleMap.get(group.id)?.width) || 200;
        const currentHeight = Number(styleMap.get(group.id)?.height) || 200;
        const gPos = posMap.get(group.id)!;

        if (isDragging) {
          // ---- DRAG MODE ----
          // Expand left/top when children exceed bounds, and always
          // tight-fit right/bottom so the group also shrinks during drag.
          let expandLeft = 0;
          let expandTop = 0;

          if (minX < PADDING) expandLeft = PADDING - minX;
          if (minY < TOP_PADDING) expandTop = TOP_PADDING - minY;

          // Tight-fit: use the actual needed size (not max with current)
          const neededWidth = Math.max(200, maxX + expandLeft + PADDING);
          const neededHeight = Math.max(200, maxY + expandTop + PADDING);

          const THRESHOLD = 0.5;
          if (
            expandLeft < THRESHOLD &&
            expandTop < THRESHOLD &&
            Math.abs(neededWidth - currentWidth) < THRESHOLD &&
            Math.abs(neededHeight - currentHeight) < THRESHOLD
          ) {
            continue;
          }

          needsUpdate = true;

          const newGroupPos = {
            x: gPos.x - expandLeft,
            y: gPos.y - expandTop,
          };
          const newGroupStyle = {
            ...styleMap.get(group.id),
            width: neededWidth,
            height: neededHeight,
            border: "none",
            background: "transparent",
          };
          posMap.set(group.id, newGroupPos);
          sizeMap.set(group.id, { w: neededWidth, h: neededHeight });
          styleMap.set(group.id, newGroupStyle);
          updates.set(group.id, {
            position: newGroupPos,
            style: newGroupStyle,
          });

          // Shift ALL children to compensate for group position change
          if (expandLeft > 0 || expandTop > 0) {
            for (const child of children) {
              const cPos = posMap.get(child.id)!;
              const newChildPos = {
                x: cPos.x + expandLeft,
                y: cPos.y + expandTop,
              };
              posMap.set(child.id, newChildPos);
              const existing = updates.get(child.id);
              updates.set(child.id, { ...existing, position: newChildPos });
            }
          }
        } else {
          // ---- FULL RECENTER MODE ----
          // Tight-fit the group around children with uniform padding.
          const targetWidth = Math.max(200, maxX - minX + PADDING * 2);
          const targetHeight = Math.max(
            200,
            maxY - minY + PADDING + TOP_PADDING,
          );

          const shiftX = PADDING - minX;
          const shiftY = TOP_PADDING - minY;

          const THRESHOLD = 0.5;
          if (
            Math.abs(shiftX) < THRESHOLD &&
            Math.abs(shiftY) < THRESHOLD &&
            Math.abs(currentWidth - targetWidth) < THRESHOLD &&
            Math.abs(currentHeight - targetHeight) < THRESHOLD
          ) {
            continue;
          }

          needsUpdate = true;

          const newGroupPos = { x: gPos.x - shiftX, y: gPos.y - shiftY };
          const newGroupStyle = {
            ...styleMap.get(group.id),
            width: targetWidth,
            height: targetHeight,
            border: "none",
            background: "transparent",
          };
          posMap.set(group.id, newGroupPos);
          sizeMap.set(group.id, { w: targetWidth, h: targetHeight });
          styleMap.set(group.id, newGroupStyle);
          updates.set(group.id, {
            position: newGroupPos,
            style: newGroupStyle,
          });

          for (const child of children) {
            const cPos = posMap.get(child.id)!;
            const newChildPos = { x: cPos.x + shiftX, y: cPos.y + shiftY };
            posMap.set(child.id, newChildPos);
            const existing = updates.get(child.id);
            updates.set(child.id, { ...existing, position: newChildPos });
          }
        }
      }

      if (!needsUpdate) return;

      isUpdatingRef.current = true;

      useFlowStore.getState().setNodes((currentNodes) =>
        currentNodes.map((node) => {
          const upd = updates.get(node.id);
          if (!upd) return node;
          return {
            ...node,
            ...(upd.position ? { position: upd.position } : {}),
            ...(upd.style ? { style: upd.style } : {}),
          };
        }),
      );

      // Let the store settle before allowing the next pass
      requestAnimationFrame(() => {
        isUpdatingRef.current = false;
      });
    }

    const unsubscribe = useFlowStore.subscribe(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(recalculate);
    });

    // Initial calculation
    recalculate();

    return () => {
      unsubscribe();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);
}
