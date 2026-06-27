import React from "react";
import { Truck, Scan, Unlock, Package, Lock, BellRing, Phone } from "lucide-react";

export function HowItWorks() {
  return (
    <div className="flex-1 flex flex-col justify-between py-0 w-full font-sans text-[#3D2310]">
      <div className="text-center font-merriweather mb-0">
        <h2 className="text-[2.8vh] font-black text-[#3D2310]">How It Works</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-[2vh] md:gap-x-[2.5vh] gap-y-[1vh] md:gap-y-[1.8vh] flex-1 mt-3">
        {/* Step 1 */}
        <div className="bg-transparent rounded-xl p-1  flex flex-col items-center text-center justify-center rotate-[-0.5deg] hover:rotate-0 hover:scale-102 transition-transform duration-200">
          <Truck className="w-[3.5vh] h-[3.5vh] text-[#3D2310] mb-1.5" />
          <h4 className="font-extrabold text-[1.1vh] md:text-[1.4vh] mb-0.5 uppercase">Courier Arrives</h4>
          <p className="text-[1.3vh] md:text-[1.7vh] text-[#3D2310]/80 leading-snug">Courier Arrives At Your DoorStep.</p>
        </div>

        {/* Step 2 */}
        <div className="bg-transparent rounded-xl p-1  flex flex-col items-center text-center justify-center rotate-[0.5deg] hover:rotate-0 hover:scale-102 transition-transform duration-200">
          <Phone className="w-[3.5vh] h-[3.5vh] text-[#3D2310] mb-1.5" />
          <h4 className="font-extrabold text-[1.1vh] md:text-[1.4vh] mb-0.5 uppercase">Phone Call</h4>
          <p className="text-[1.3vh] md:text-[1.7vh] text-[#3D2310]/80 leading-snug">You Get A Call To Recieve Parcel.</p>
        </div>

        {/* Step 3 */}
        <div className="bg-transparent rounded-xl p-1  flex flex-col items-center text-center justify-center rotate-[-1deg] hover:rotate-0 hover:scale-102 transition-transform duration-200">
          <Unlock className="w-[3.5vh] h-[3.5vh] text-[#3D2310] mb-1.5" />
          <h4 className="font-extrabold text-[1.1vh] md:text-[1.4vh] mb-0.5 uppercase">Door Unlock</h4>
          <p className="text-[1.3vh] md:text-[1.7vh] text-[#3D2310]/80 leading-snug">You Unlock The SmartBox With Your Phone.</p>
        </div>

        {/* Step 4 */}
        <div className="bg-transparent rounded-xl p-1  flex flex-col items-center text-center justify-center rotate-[1deg] hover:rotate-0 hover:scale-102 transition-transform duration-200">
          <Package className="w-[3.5vh] h-[3.5vh] text-[#3D2310] mb-1.5" />
          <h4 className="font-extrabold text-[1.1vh] md:text-[1.4vh] mb-0.5 uppercase">Place Parcel</h4>
          <p className="text-[1.3vh] md:text-[1.7vh] text-[#3D2310]/80 leading-snug">Courier places the parcel inside.</p>
        </div>

        {/* Step 5 */}
        <div className="bg-transparent rounded-xl p-1  flex flex-col items-center text-center justify-center rotate-[-0.5deg] hover:rotate-0 hover:scale-102 transition-transform duration-200">
          <Lock className="w-[3.5vh] h-[3.5vh] text-[#3D2310] mb-1.5" />
          <h4 className="font-extrabold text-[1.1vh] md:text-[1.4vh] mb-0.5 uppercase">Close & Lock</h4>
          <p className="text-[1.3vh] md:text-[1.7vh] text-[#3D2310]/80 leading-snug">The door is Pushed and Is Closed By Courier.</p>
        </div>

        {/* Step 6 */}
        <div className="bg-transparent rounded-xl p-1  flex flex-col items-center text-center justify-center rotate-[0.5deg] hover:rotate-0 hover:scale-102 transition-transform duration-200">
          <BellRing className="w-[3.5vh] h-[3.5vh] text-[#3D2310] mb-1.5" />
          <h4 className="font-extrabold text-[1.1vh] md:text-[1.4vh] mb-0.5 uppercase">Get Notified</h4>
          <p className="text-[1.3vh] md:text-[1.7vh] text-[#3D2310]/80 leading-snug">You Get Notification When Door Is Locked.</p>
        </div>
      </div>
    </div>
  );
}
