import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: "#171717",
      titleColor: "#EDEDED",
      bodyColor: "#94A3B8",
      borderColor: "rgba(255, 255, 255, 0.1)",
      borderWidth: 1,
      padding: 10,
      cornerRadius: 8,
    },
  },
  cutout: "55%",
};

export function DoughnutChart({ data, options = defaultOptions, className = "" }) {
  return (
    <div className={`w-full h-full flex items-center justify-center relative ${className}`}>
      <Doughnut data={data} options={options} />
    </div>
  );
}

export default DoughnutChart;
