import InterfaceFrame from "../imports/界面";
import ProgressStatesFrame from "../imports/进度条状态规格";
import { ScaledFrame } from "./components/scaled-frame";

export default function App() {
  return (
    <div className="size-full min-h-screen bg-black flex flex-wrap items-start justify-center gap-12 p-8">
      <ScaledFrame width={318} height={240} scale={2}>
        <InterfaceFrame />
      </ScaledFrame>

      <ScaledFrame width={240} height={212} scale={2}>
        <ProgressStatesFrame />
      </ScaledFrame>
    </div>
  );
}
