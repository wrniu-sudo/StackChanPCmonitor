import type { ReactNode } from "react";

interface ScaledFrameProps {
  width: number;
  height: number;
  scale?: number;
  children: ReactNode;
}

/**
 * Renders an imported Figma frame (which relies on absolute positioning inside
 * a fixed-size `size-full` container) at its native dimensions, scaled up so
 * the pixel-exact design stays faithful while remaining readable.
 */
export function ScaledFrame({ width, height, scale = 2, children }: ScaledFrameProps) {
  return (
    <div style={{ width: width * scale, height: height * scale }}>
      <div
        style={{
          width,
          height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
