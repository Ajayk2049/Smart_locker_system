import React from "react";

interface BoxBgProps {
  children?: React.ReactNode;
}

export function BoxBg({ children }: BoxBgProps) {
  return (
    <div
      className="relative w-[90vw] md:w-[45vh] h-[70vh] md:h-[65vh] max-w-[420px] max-h-[600px] min-w-[280px] min-h-[400px] flex flex-col p-5 sm:p-8 drop-shadow-2xl bg-center bg-no-repeat font-sans text-[#3D2310]"
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
