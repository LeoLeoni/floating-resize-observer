import React, { useRef, useState } from "react";
import useResizeObserver from "use-resize-observer";

const getRandom = () => Math.floor(Math.random() * (400 - 40) + 40);

const Observable: React.FC = () => {
  const [observedSize, setObservedSize] = useState({ height: 0, width: 0 });
  const [size, setSize] = useState({ width: 200, height: 200 });
  const ref = useRef<HTMLDivElement>();

  useResizeObserver<HTMLDivElement>({
    ref,
    onResize: setObservedSize,
    round: Math.ceil,
  });

  const randomizeSize = () => {
    setSize({
      height: getRandom(),
      width: getRandom(),
    });
  };

  const header = `Observed height: ${observedSize.height} width: ${observedSize.width}`;
  return (
    <div style={{ width: "100%", height: "100%" }}>
      <h2>{header}</h2>
      <button onClick={randomizeSize}>Randomize Size</button>
      <div
        ref={ref}
        style={{
          backgroundColor: "darkred",
          height: size.height,
          width: size.width,
        }}
      />
    </div>
  );
};

export default Observable;
