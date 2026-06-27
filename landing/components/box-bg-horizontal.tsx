import React from "react";

interface BoxBgHorizontalProps {
  children?: React.ReactNode;
}

export function BoxBgHorizontal({ children }: BoxBgHorizontalProps) {
  return (
    <div
      className="relative flex flex-col p-4 sm:p-8 drop-shadow-2xl bg-center bg-no-repeat font-sans text-[#3D2310] w-[95vw] md:w-[75vh] h-[65vh] md:h-[45vh] max-w-[700px] max-h-[600px] md:max-h-[420px] min-w-[280px] md:min-w-[450px] min-h-[280px]"
      style={{
        backgroundImage: "url('/boxbg.png')",
        backgroundSize: "100% 100%",
        backgroundPosition: "center"
      }}
    >
      {children}
    </div>
  );
}
