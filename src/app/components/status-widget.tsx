import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import svgPaths from "@/imports/界面/svg-rgqpofeemo";
import { DotMatrixBar } from "./dot-matrix-bar";
import { useLoopingPercent } from "./use-looping-percent";

const FONT = "'Alibaba PuHuiTi 2.0', system-ui, sans-serif";

// Notched "fieldset" frame using the exact Figma "Subtract" border path.
// The path already contains the notch gap in the top border sized to the label.
function FieldBox({
  left,
  top,
  width,
  height,
  path,
  children,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
  path: string;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute" style={{ left, top, width, height }}>
      <svg
        className="absolute inset-0 block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox={`0 0 ${width} ${height}`}
      >
        <path d={path} fill="white" />
      </svg>
      {children}
    </div>
  );
}

// Comet-tail dot cluster trailing the model-section stars (Figma Group2/Group3).
// Coordinates are frame-absolute; pass xOffset to shift the second tail (+29px).
const TAIL_DOTS: Array<[number, number, boolean]> = [
  [51.85, 147.73, false], [61.13, 143.99, false], [70.4, 140.24, false],
  [61.88, 145.84, true], [71.15, 142.1, true], [62.63, 147.7, false],
  [71.9, 143.95, false], [50, 148.48, false], [59.27, 144.73, false],
  [68.55, 140.99, false], [60.02, 146.59, true], [69.3, 142.85, true],
  [60.77, 148.44, false], [70.04, 144.7, false], [53.71, 146.98, false],
  [62.98, 143.24, false], [72.26, 139.5, false], [63.73, 145.09, true],
  [73.01, 141.35, true], [64.48, 146.95, false], [73.75, 143.21, false],
  [55.56, 146.23, false], [64.84, 142.49, false], [74.11, 138.75, false],
  [56.31, 148.09, true], [65.59, 144.34, true], [74.86, 140.6, true],
  [66.33, 146.2, false], [75.61, 142.46, false], [57.42, 145.48, false],
  [66.69, 141.74, false], [58.17, 147.34, true], [67.44, 143.6, true],
  [68.19, 145.45, false], [75.97, 138, false], [76.71, 139.85, true],
  [77.46, 141.71, false],
];

function StarTail({ xOffset }: { xOffset: number }) {
  return (
    <>
      {TAIL_DOTS.map(([left, top, dark], i) => (
        <div
          key={i}
          className="absolute flex items-center justify-center"
          style={{ left: left + xOffset, top, width: 1.302, height: 1.302 }}
        >
          <div className="flex-none rotate-[-21.97deg]">
            <div
              className="relative rounded-[1px]"
              style={{
                width: 1,
                height: 1,
                backgroundColor: dark ? "rgba(67,69,79,0.85)" : "rgba(217,217,217,0.45)",
              }}
            />
          </div>
        </div>
      ))}
    </>
  );
}

// Label that sits inside the frame's notch.
function Legend({ left, top, children }: { left: number; top: number; children: React.ReactNode }) {
  return (
    <span
      className="absolute bg-[#080808] px-[2px] whitespace-nowrap text-white"
      style={{ left, top, fontSize: 10, lineHeight: 1 }}
    >
      {children}
    </span>
  );
}

// Live wall clock (dynamic).
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const time = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  return { date, time };
}

export function StatusWidget() {
  const { date, time } = useClock();

  // Pressed state for the [切换] button (turns text #4E4E4E while pressed).
  const [switchPressed, setSwitchPressed] = useState(false);

  // Dynamic, continuously looping usage percentages (phased so they differ).
  const cpu = useLoopingPercent(4000, 0);
  const gpu = useLoopingPercent(4000, 0.25);
  const mem = useLoopingPercent(4000, 0.5);
  const vram = useLoopingPercent(4000, 0.75);

  // Dynamic data slots (would come from the device / backend in production).
  const deviceName = "[电脑名称]";
  const battery = 100;
  const mainModel = "DEEPSEEK"; // 大模型
  const subModel = "DEEPSEEK-v4-pro"; // 子模型

  // Bottom category is dynamic/swappable — later this may be replaced with a
  // different category (label + value) rather than being hard-coded to token余额.
  const activeCategory = { label: "token余额", value: "￥ 10.21" };

  // Battery: number of filled segments (design shows 4 segment bars).
  const batterySegments = Math.round((battery / 100) * 4);

  return (
    <div
      className="relative overflow-hidden bg-[#080808] text-white"
      style={{ width: 320, height: 240, fontFamily: FONT }}
    >
      {/* ---------- Status bar (dynamic clock / battery) ---------- */}
      <span className="absolute" style={{ left: 7, top: 2, fontSize: 10 }}>{date}</span>
      <span className="absolute" style={{ left: 61, top: 2, fontSize: 10 }}>{time}</span>

      {/* WiFi icon — exact Figma paths */}
      <div className="absolute" style={{ left: 240, top: 4, width: 13.5723, height: 10 }}>
        <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.5723 10">
          <path d={svgPaths.p37642b80} fill="white" />
          <path d={svgPaths.p207c25b0} fill="white" />
          <path d={svgPaths.p1fb2c600} fill="white" />
        </svg>
      </div>

      {/* Battery: border + 4 segment bars (exact design) */}
      <div
        className="absolute rounded-[2px] border border-solid border-white"
        style={{ left: 260, top: 4, width: 23, height: 10 }}
      />
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="absolute rounded-[1px]"
          style={{
            left: 262 + i * 5,
            top: 6,
            width: 4,
            height: 6,
            backgroundColor: i < batterySegments ? "#d9d9d9" : "transparent",
          }}
        />
      ))}
      <span className="absolute" style={{ left: 285, top: 2, fontSize: 10 }}>{battery}%</span>

      {/* ---------- Title row ---------- */}
      <span className="absolute" style={{ left: 7, top: 18, fontSize: 12 }}>电脑状态</span>
      <span className="absolute text-white/70" style={{ left: 63, top: 18, fontSize: 12 }}>{deviceName}</span>

      {/* Decorative stars near device name / [切换] (exact Figma paths) */}
      <div className="absolute" style={{ left: 115, top: 17, width: 6, height: 6 }}>
        <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={svgPaths.p253e4400} fill="#BEBEBE" />
        </svg>
      </div>
      <div className="absolute" style={{ left: 272, top: 21, width: 6, height: 6 }}>
        <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 6">
          <path d={svgPaths.p253e4400} fill="#BEBEBE" />
        </svg>
      </div>
      <div className="absolute" style={{ left: 278, top: 14, width: 10, height: 10 }}>
        <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
          <path d={svgPaths.p3df5c800} fill="#BEBEBE" />
        </svg>
      </div>

      <button
        className="absolute transition-colors"
        style={{ left: 278, top: 18, fontSize: 12, color: switchPressed ? "#4E4E4E" : "white", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT }}
        onPointerDown={() => setSwitchPressed(true)}
        onPointerUp={() => setSwitchPressed(false)}
        onPointerLeave={() => setSwitchPressed(false)}
      >
        [切换]
      </button>

      {/* ---------- Hardware box ---------- */}
      <div
        className="absolute rounded-[4px] border border-solid border-white"
        style={{ left: 7, top: 39, width: 304, height: 83 }}
      />

      {/* CPU */}
      <FieldBox left={15} top={50} width={134} height={24} path={svgPaths.p1101100}>
        <Legend left={13} top={-6}>CPU</Legend>
        <span className="absolute text-white/70 whitespace-nowrap" style={{ left: 42, top: -5, fontSize: 4 }}>
          AMD Ryzen 9 8945HX with Radeon Graphics
        </span>
        <div className="absolute" style={{ left: 8, top: 8, right: 6, height: 12 }}>
          <DotMatrixBar percent={cpu} />
        </div>
      </FieldBox>
      <span className="absolute" style={{ left: 154, top: 52, fontSize: 12 }}>{cpu}%</span>

      {/* GPU */}
      <FieldBox left={15} top={90} width={134} height={24} path={svgPaths.p1101100}>
        <Legend left={13} top={-6}>GPU</Legend>
        <span className="absolute text-white/70 whitespace-nowrap" style={{ left: 42, top: -5, fontSize: 4 }}>
          NVIDIA GeForce RTX 5060 Laptop GPU
        </span>
        <div className="absolute" style={{ left: 8, top: 8, right: 6, height: 12 }}>
          <DotMatrixBar percent={gpu} />
        </div>
      </FieldBox>
      <span className="absolute" style={{ left: 154, top: 92, fontSize: 12 }}>{gpu}%</span>

      {/* 内存 */}
      <FieldBox left={200} top={50} width={103} height={24} path={svgPaths.p2cbdf00}>
        <Legend left={13} top={-6}>内存</Legend>
        <span className="absolute text-white/70 whitespace-nowrap" style={{ left: 37, top: -5, fontSize: 4 }}>32G</span>
        <div className="absolute" style={{ left: 8, top: 8, width: 52, height: 12 }}>
          <DotMatrixBar percent={mem} />
        </div>
        <span className="absolute whitespace-nowrap" style={{ left: 66, top: 4, fontSize: 12 }}>{mem}%</span>
      </FieldBox>

      {/* 显存占用 */}
      <FieldBox left={200} top={90} width={103} height={24} path={svgPaths.p298eb200}>
        <Legend left={13} top={-6}>显存占用</Legend>
        <span className="absolute text-white/70 whitespace-nowrap" style={{ left: 55, top: -5, fontSize: 4 }}>8G</span>
        <div className="absolute" style={{ left: 8, top: 8, width: 52, height: 12 }}>
          <DotMatrixBar percent={vram} />
        </div>
        <span className="absolute whitespace-nowrap" style={{ left: 66, top: 4, fontSize: 12 }}>{vram}%</span>
      </FieldBox>

      {/* ---------- Model section ---------- */}
      <span className="absolute" style={{ left: 7, top: 130, fontSize: 12 }}>当前大模型</span>
      {/* Comet-tail dot trails behind the two stars (Figma Group2/Group3) */}
      <StarTail xOffset={0} />
      <StarTail xOffset={29} />
      {/* Decorative stars (exact Figma paths) */}
      <div className="absolute" style={{ left: 72, top: 133, width: 14, height: 14 }}>
        <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
          <path d={svgPaths.p5a82670} fill="#BEBEBE" />
        </svg>
      </div>
      <div className="absolute" style={{ left: 101, top: 133, width: 14, height: 14 }}>
        <svg className="absolute inset-0 block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
          <path d={svgPaths.p5a82670} fill="#BEBEBE" />
        </svg>
      </div>

      <div
        className="absolute rounded-[4px] border border-solid border-white"
        style={{ left: 7, top: 149, width: 304, height: 82 }}
      />

      {/* 大模型 (main model) */}
      <FieldBox left={15} top={162} width={137} height={28} path={svgPaths.p3bb67800}>
        <Legend left={13} top={-6}>大模型</Legend>
        <span className="absolute whitespace-nowrap" style={{ left: 13, top: 8, fontSize: 13 }}>
          {mainModel}
        </span>
        {/* Dropdown arrow: right-aligned inside the field, 4px from the edge */}
        <ChevronDown
          size={11}
          className="absolute text-white/70"
          style={{ right: 4, top: "50%", transform: "translateY(-50%)" }}
        />
      </FieldBox>

      {/* 子模型 (sub model) */}
      <FieldBox left={160} top={162} width={143} height={28} path={svgPaths.p209c1a00}>
        <Legend left={13} top={-6}>子模型</Legend>
        <span className="absolute whitespace-nowrap" style={{ left: 13, top: 8, fontSize: 13 }}>{subModel}</span>
      </FieldBox>

      {/* Dynamic/swappable category (currently token余额) */}
      <FieldBox left={15} top={199} width={288} height={28} path={svgPaths.p3bc1ce80}>
        <Legend left={13} top={-6}>{activeCategory.label}</Legend>
        <span className="absolute" style={{ left: 13, top: 8, fontSize: 13 }}>{activeCategory.value}</span>
      </FieldBox>
    </div>
  );
}
