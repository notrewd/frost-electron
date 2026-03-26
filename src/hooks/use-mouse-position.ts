// https://www.joshwcomeau.com/snippets/react-hooks/use-mouse-position/
// modified to use ref instead of state to prevent excessive re-renders

import { useEffect, useRef } from "react";

const useMousePosition = () => {
  const mousePosition = useRef<{
    x: number | null;
    y: number | null;
  }>({
    x: null,
    y: null,
  });

  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      mousePosition.current = { x: ev.clientX, y: ev.clientY };
    };

    window.addEventListener("mousemove", updateMousePosition, {
      passive: true,
    });

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
    };
  }, []);

  return mousePosition;
};

export default useMousePosition;
