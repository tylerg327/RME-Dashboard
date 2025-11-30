// src/components/charts/EventsPerDayChart.jsx
import React, { useMemo } from "react";
import dayjs from "dayjs";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const EventsPerDayChart = ({ events }) => {
  const { counts, maxCount } = useMemo(() => {
    const weekdayCounts = Array(7).fill(0);
    events.forEach((ev) => {
      if (!ev.event_date) return;
      const d = dayjs(ev.event_date);
      if (!d.isValid()) return;
      const weekday = d.day(); // 0 = Sunday, 6 = Saturday
      weekdayCounts[weekday] += 1;
    });
    const max = Math.max(...weekdayCounts, 0);
    return { counts: weekdayCounts, maxCount: max };
  }, [events]);

  // Helper to get a blue intensity based on count
  const getCellStyle = (count) => {
    if (maxCount === 0) {
      // no events at all – light border only
      return {
        backgroundColor: "rgba(37, 99, 235, 0.05)",
        border: "1px solid rgba(148, 163, 184, 0.5)",
      };
    }
    // scale alpha between 0.15 and 1.0
    const alpha = 0.15 + (count / maxCount) * 0.85;
    return {
      backgroundColor: `rgba(37, 99, 235, ${alpha})`,
      border: "1px solid rgba(15, 23, 42, 0.1)",
      color: "#f9fafb",
    };
  };

  return (
    <div className="card">
      <h3>Events by Weekday (Heatmap)</h3>
      <p style={{ fontSize: "0.8rem", marginTop: 4, marginBottom: 12 }}>
        Aggregated across the selected date range. Each cell shows total events
        on that weekday (all Mondays, all Tuesdays, etc.).
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          gap: "8px",
        }}
      >
        {DAY_LABELS.map((label, idx) => {
          const count = counts[idx];
          const style = getCellStyle(count);
          return (
            <div
              key={label}
              style={{
                ...style,
                borderRadius: 6,
                padding: "8px 4px",
                textAlign: "center",
                minHeight: 60,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                {count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
