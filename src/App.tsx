import React, { useState } from "react";
import { FloatingWindow } from "./FloatingWindow";
import Observable from "./Observable";

const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleWindow = () => setIsOpen((open) => !open);
  return (
    <>
      <FloatingWindow isOpen={isOpen} setIsOpen={setIsOpen}>
        <Observable />
      </FloatingWindow>
      <button onClick={toggleWindow}>
        {isOpen ? "Close Window" : "Open Window"}
      </button>
      <Observable />
    </>
  );
};

export default App;
