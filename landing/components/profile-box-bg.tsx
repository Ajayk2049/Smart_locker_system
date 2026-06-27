import React from "react";

interface ProfileBoxBgProps {
  children?: React.ReactNode;
}

export function ProfileBoxBg({ children }: ProfileBoxBgProps) {
  return (
    <div
      className="relative flex flex-col p-5 sm:p-6 drop-shadow-2xl bg-center bg-no-repeat font-sans text-[#3D2310] w-[90vw] md:w-[60vh] h-[82vh] max-w-[550px] max-h-[750px] min-w-[280px] md:min-w-[380px] min-h-[550px]"
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
