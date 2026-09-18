import React from "react";
import Menu from "./Menu";

const TopBar = () => {
  return (
    <div className="topbar-container">
      <div className="indices-container">
        <div className="nifty">
          <p className="index">NIFTY 50</p>
          <p className="index-points">24,850.30</p>
          <p className="percent profit">+0.42%</p>
        </div>
        <div className="sensex">
          <p className="index">SENSEX</p>
          <p className="index-points">81,420.50</p>
          <p className="percent profit">+0.38%</p>
        </div>
      </div>

      <Menu />
    </div>
  );
};

export default TopBar;
