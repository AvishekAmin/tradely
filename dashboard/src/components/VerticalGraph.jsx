import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      labels: {
        color: "#94A3B8",
        font: {
          family: "'Inter', sans-serif",
          size: 11,
          weight: "500",
        },
      },
    },
    title: {
      display: false,
      text: "Holdings Performance",
      color: "#EDEDED",
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
  scales: {
    x: {
      ticks: {
        color: "#94A3B8",
        font: { family: "'Inter', sans-serif", size: 11 },
      },
      grid: {
        color: "rgba(255, 255, 255, 0.05)",
      },
    },
    y: {
      ticks: {
        color: "#94A3B8",
        font: { family: "'Inter', sans-serif", size: 11 },
      },
      grid: {
        color: "rgba(255, 255, 255, 0.05)",
      },
    },
  },
};

export function VerticalGraph({ data }) {
  return (
    <div className="w-full h-64">
      <Bar options={options} data={data} />
    </div>
  );
}

export default VerticalGraph;
