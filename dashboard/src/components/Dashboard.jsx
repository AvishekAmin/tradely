import React from "react";
import { Route, Routes } from "react-router-dom";

import Funds from "./Funds";
import Explore from "./Explore";
import Holdings from "./Holdings";
import Orders from "./Orders";
import Positions from "./Positions";
import Summary from "./Summary";
import WatchList from "./WatchList";
import { GeneralContextProvider } from "./GeneralContext";

const Dashboard = () => {
  return (
    <GeneralContextProvider>
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-3.5rem)] w-full bg-[#0A0A0A] text-[#EDEDED]">
        {/* Persistent WatchList Sidebar */}
        <aside className="w-full lg:w-80 lg:min-w-[20rem] lg:max-w-xs border-b lg:border-b-0 lg:border-r border-white/10 bg-[#0E0E0E] shrink-0 flex flex-col lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)]">
          <WatchList />
        </aside>

        {/* Dynamic Terminal Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Summary />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/holdings" element={<Holdings />} />
            <Route path="/positions" element={<Positions />} />
            <Route path="/funds" element={<Funds />} />
            <Route path="/explore" element={<Explore />} />
          </Routes>
        </main>
      </div>
    </GeneralContextProvider>
  );
};

export default Dashboard;
