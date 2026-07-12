interface DotMatrixBarProps {
  /** 0 - 100 fill percentage */
  percent: number;
}

// Halftone dotted texture used for the unfilled part of the track (spec: 未启动).
const dotTexture = {
  backgroundImage:
    "radial-gradient(circle at center, rgba(217,217,217,0.45) 0.5px, transparent 0.6px), radial-gradient(circle at center, rgba(67,69,79,0.85) 0.5px, transparent 0.6px)",
  backgroundSize: "2px 4px, 2px 4px",
  backgroundPosition: "0 0, 0 2px",
};

// Solid vertical bars used for the filled part of the track (spec: 满载).
const barTexture = {
  backgroundImage:
    "repeating-linear-gradient(90deg, #d9d9d9 0 4px, transparent 4px 6px)",
};

/**
 * Dot-matrix progress bar matching "进度条状态规格":
 * empty = dotted track, filled = solid vertical bars, driven by `percent`.
 */
export function DotMatrixBar({ percent }: DotMatrixBarProps) {
  const fill = Math.max(0, Math.min(100, percent));
  return (
    <div className="relative size-full overflow-hidden" style={dotTexture}>
      {fill > 0 && (
        <div
          className="absolute inset-y-0 left-0"
          style={{ ...barTexture, width: `${fill}%` }}
        />
      )}
    </div>
  );
}
