import { useEffect, useState } from "react";
import { Wifi, Signal, ChevronDown, Sparkles } from "lucide-react";
import { DotMatrixBar } from "./dot-matrix-bar";
import { useLoopingPercent } from "./use-looping-percent";

const FONT = "'Alibaba PuHuiTi 2.0', system-ui, sans-serif";

// Notched "fieldset" frame: a bordered rounded rect whose label sits on the
// top border (masked with the widget background to create the notch).
function FieldBox({
  left,
  top,
  width,
  height,
  children,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute rounded-[4px] border border-white/80"
      style={{ left, top, width, height }}
    >
      {children}
    </div>
  );
}

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

  // Dynamic, continuously looping usage percentages (phased so they differ).
  const cpu = useLoopingPercent(4000, 0);
  const gpu = useLoopingPercent(4000, 0.25);
  const mem = useLoopingPercent(4000, 0.5);
  const vram = useLoopingPercent(4000, 0.75);

  // Dynamic data slots (would come from the device / backend in production).
  const deviceName = "[电脑名称]";
  const battery = 100;
  const model = "DEEPSEEK";
  const modelVersion = "DEEPSEEK-v4-pro";
  const balance = "￥ 10.21";

  return (
    <div
      className="relative overflow-hidden bg-[#080808] text-white"
      style={{ width: 320, height: 240, fontFamily: FONT }}
    >
      {/* ---------- Status bar (dynamic clock / battery) ---------- */}
      <span className="absolute" style={{ left: 7, top: 2, fontSize: 10 }}>{date}</span>
      <span className="absolute" style={{ left: 61, top: 2, fontSize: 10 }}>{time}</span>
      <Signal size={9} className="absolute" style={{ left: 236, top: 4 }} />
      <Wifi size={10} className="absolute" style={{ left: 247, top: 3 }} />
      <div
        className="absolute rounded-[2px] border border-white flex items-center px-[1px]"
        style={{ left: 260, top: 4, width: 23, height: 10 }}
      >
        <div className="h-[6px] rounded-[1px] bg-[#d9d9d9]" style={{ width: `${battery}%` }} />
      </div>
      <div className="absolute bg-white rounded-r-sm" style={{ left: 284, top: 6, width: 2, height: 5 }} />
      <span className="absolute" style={{ left: 289, top: 2, fontSize: 10 }}>{battery}%</span>

      {/* ---------- Title row ---------- */}
      <span className="absolute" style={{ left: 7, top: 18, fontSize: 12 }}>电脑状态</span>
      <span className="absolute text-white/70" style={{ left: 63, top: 18, fontSize: 12 }}>{deviceName}</span>
      <button
        className="absolute text-white/80 hover:text-white transition-colors"
        style={{ left: 278, top: 18, fontSize: 12 }}
      >
        [切换]
      </button>

      {/* ---------- Hardware box ---------- */}
      <div
        className="absolute rounded-[4px] border border-white/80"
        style={{ left: 7, top: 39, width: 304, height: 83 }}
      />

      {/* CPU */}
      <FieldBox left={15} top={50} width={134} height={24}>
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
      <FieldBox left={15} top={90} width={134} height={24}>
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
      <FieldBox left={200} top={50} width={103} height={24}>
        <Legend left={13} top={-6}>内存</Legend>
        <span className="absolute text-white/70 whitespace-nowrap" style={{ left: 37, top: -5, fontSize: 4 }}>32G</span>
        <div className="absolute" style={{ left: 8, top: 8, width: 52, height: 12 }}>
          <DotMatrixBar percent={mem} />
        </div>
        <span className="absolute whitespace-nowrap" style={{ left: 66, top: 4, fontSize: 12 }}>{mem}%</span>
      </FieldBox>

      {/* 显存占用 */}
      <FieldBox left={200} top={90} width={103} height={24}>
        <Legend left={13} top={-6}>显存占用</Legend>
        <span className="absolute text-white/70 whitespace-nowrap" style={{ left: 55, top: -5, fontSize: 4 }}>8G</span>
        <div className="absolute" style={{ left: 8, top: 8, width: 52, height: 12 }}>
          <DotMatrixBar percent={vram} />
        </div>
        <span className="absolute whitespace-nowrap" style={{ left: 66, top: 4, fontSize: 12 }}>{vram}%</span>
      </FieldBox>

      {/* ---------- Model section ---------- */}
      <span className="absolute" style={{ left: 7, top: 130, fontSize: 12 }}>当前大模型</span>
      <Sparkles size={9} className="absolute text-[#bebebe]" style={{ left: 70, top: 129 }} />
      <Sparkles size={7} className="absolute text-[#bebebe]" style={{ left: 82, top: 132 }} />

      <div
        className="absolute rounded-[4px] border border-white/80"
        style={{ left: 7, top: 149, width: 304, height: 82 }}
      />

      {/* 大模型 */}
      <FieldBox left={15} top={162} width={137} height={28}>
        <Legend left={13} top={-6}>大模型</Legend>
        <span className="absolute flex items-center gap-1" style={{ left: 13, top: 8, fontSize: 13 }}>
          {model}
          <ChevronDown size={11} className="text-white/70" />
        </span>
      </FieldBox>

      {/* 当前使用 */}
      <FieldBox left={160} top={162} width={143} height={28}>
        <Legend left={13} top={-6}>当前使用</Legend>
        <span className="absolute whitespace-nowrap" style={{ left: 13, top: 8, fontSize: 13 }}>{modelVersion}</span>
      </FieldBox>

      {/* token余额 */}
      <FieldBox left={15} top={199} width={288} height={28}>
        <Legend left={13} top={-6}>token余额</Legend>
        <span className="absolute" style={{ left: 13, top: 8, fontSize: 13 }}>{balance}</span>
      </FieldBox>
    </div>
  );
}
