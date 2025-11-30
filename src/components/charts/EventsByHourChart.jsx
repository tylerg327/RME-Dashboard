// src/components/charts/EventsByHourChart.jsx
import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register needed pieces ONCE
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const EventsByHourChart = ({ events }) => {
  const { labels, values } = useMemo(() => {
    const counts = Array(24).fill(0);
    events.forEach((ev) => {
      if (!ev.event_time) return;
      const hourStr = String(ev.event_time).split(":")[0];
      const hour = parseInt(hourStr, 10);
      if (!Number.isNaN(hour) && hour >= 0 && hour < 24) {
        counts[hour] += 1;
      }
    });
    return {
      labels: counts.map((_, h) => `${h.toString().padStart(2, "0")}:00`),
      values: counts,
    };
  }, [events]);

  const data = {
    labels,
    datasets: [
      {
        label: "Events",
        data: values,
        backgroundColor: "#2563eb", // match button blue
        borderColor: "#1d4ed8",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
  };

  return (
    <div className="card">
      <h3>Events by Hour</h3>
      <Bar data={data} options={options} />
    </div>
  );
};
