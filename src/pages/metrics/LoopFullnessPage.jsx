import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { supabase } from "../../supabaseClient";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";

import { Doughnut, Line } from "react-chartjs-2";

/* ----------------------------------------------------------
   SAFE / LOCALIZED BACKGROUND SHADING PLUGIN
---------------------------------------------------------- */
const backgroundZonesPlugin = {
  id: "backgroundZones",
  beforeDraw: (chart) => {
    // ONLY run if explicitly enabled for this chart:
    const enabled =
      chart?.config?.options?.plugins?.backgroundZones?.enabled;
    if (!enabled) return;

    const { ctx, chartArea, scales } = chart;
    if (!chartArea || !scales?.y) return;

    const { left, right } = chartArea;
    const yScale = scales.y;

    const drawBand = (from, to, color) => {
      const y1 = yScale.getPixelForValue(from);
      const y2 = yScale.getPixelForValue(to);
      ctx.save();
      ctx.fillStyle = color;
      ctx.fillRect(left, Math.min(y1, y2), right - left, Math.abs(y1 - y2));
      ctx.restore();
    };

    drawBand(0, 60, "rgba(34,197,94,0.08)");
    drawBand(60, 80, "rgba(250,204,21,0.08)");
    drawBand(80, 100, "rgba(239,68,68,0.08)");
  },
};

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  backgroundZonesPlugin
);

/* ----------------------------------------------------------
   Helper functions
---------------------------------------------------------- */

function toLocalInputValue(date) {
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  );
}

function interpolateColor(color1, color2, factor) {
  const c1 = color1.match(/\d+/g).map(Number);
  const c2 = color2.match(/\d+/g).map(Number);
  const result = c1.map((v, i) => Math.round(v + (c2[i] - v) * factor));
  return `rgb(${result[0]}, ${result[1]}, ${result[2]})`;
}

function fullnessToColor(value) {
  const green = "rgb(34,197,94)";
  const yellow = "rgb(250,204,21)";
  const red = "rgb(239,68,68)";

  if (value <= 70) return interpolateColor(green, yellow, value / 70);
  return interpolateColor(yellow, red, (value - 70) / 30);
}

export const LoopFullnessPage = () => {
  const [latest, setLatest] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [gradientMode, setGradientMode] = useState(false);

  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

  const [startTime, setStartTime] = useState(toLocalInputValue(sixHoursAgo));
  const [endTime, setEndTime] = useState(toLocalInputValue(now));

  const [searchTime, setSearchTime] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState("");

  const chartRef = useRef(null);

  /* Load latest row */
  const loadLatest = useCallback(async () => {
    const { data } = await supabase
      .from("loop_fullness_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(1);

    if (data?.length) setLatest(data[0]);
  }, []);

  /* Load range */
  const loadRange = useCallback(async () => {
    let query = supabase
      .from("loop_fullness_logs")
      .select("*")
      .order("timestamp", { ascending: true });

    if (startTime)
      query = query.gte("timestamp", new Date(startTime).toISOString());

    if (endTime)
      query = query.lte("timestamp", new Date(endTime).toISOString());

    const { data } = await query;
    setLogs(data || []);
  }, [startTime, endTime]);

  /* Load all */
  const loadAll = useCallback(async () => {
    await Promise.all([loadLatest(), loadRange()]);
    setLoading(false);
  }, [loadLatest, loadRange]);

  /* Auto refresh */
  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, 60000);
    return () => clearInterval(id);
  }, [loadAll]);

  /* Instant updates when timeframe changes */
  useEffect(() => {
    loadRange();
  }, [startTime, endTime, loadRange]);

  /* Gauge setup */
  const gaugeOptions = {
    cutout: "70%",
    plugins: { legend: { display: false } },
  };

  const makeGaugeData = (value) => ({
    labels: ["Used", "Remaining"],
    datasets: [
      {
        data: [value, 100 - value],
        backgroundColor: [fullnessToColor(value), "rgba(148,163,184,0.2)"],
        borderWidth: 0,
      },
    ],
  });

  /* Line chart setup */
  const standardColors = {
    west: "rgb(30, 64, 175)",
    east: "rgb(56, 189, 248)",
  };

  /* Build datasets: Standard or Gradient */
  const buildDatasets = () => {
    const base = [
      {
        label: "West Loop %",
        data: logs.map((r) => r.west_fullness),
        borderWidth: 3,
        tension: 0.25,
        pointRadius: 1,
        borderColor: gradientMode ? undefined : standardColors.west,
      },
      {
        label: "East Loop %",
        data: logs.map((r) => r.east_fullness),
        borderWidth: 3,
        tension: 0.25,
        pointRadius: 1,
        borderColor: gradientMode ? undefined : standardColors.east,
      },
    ];

    // Add thresholds only in Standard mode
    if (!gradientMode) {
      base.push(
        {
          label: "60% Threshold",
          data: logs.map(() => 60),
          borderColor: "rgb(234,179,8)",
          borderWidth: 2,
          borderDash: [6, 6],
          pointRadius: 0,
        },
        {
          label: "80% Threshold",
          data: logs.map(() => 80),
          borderColor: "rgb(220,38,38)",
          borderWidth: 2,
          borderDash: [6, 6],
          pointRadius: 0,
        }
      );
    }

    return base;
  };

  const lineData = {
    labels: logs.map((r) =>
      new Date(r.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    ),
    datasets: buildDatasets(),
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      backgroundZones: { enabled: !gradientMode },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: { stepSize: 10 },
      },
    },
  };

  /* Apply gradient colors */
  useEffect(() => {
    if (!gradientMode || !chartRef.current) return;

    const chart = chartRef.current;
    const ctx = chart.ctx;

    const gradient = ctx.createLinearGradient(0, 0, 0, chart.height);
    gradient.addColorStop(0, "rgb(239,68,68)");
    gradient.addColorStop(0.5, "rgb(250,204,21)");
    gradient.addColorStop(1, "rgb(34,197,94)");

    chart.data.datasets[0].borderColor = gradient;
    chart.data.datasets[1].borderColor = gradient;

    chart.update();
  }, [gradientMode, logs]);

  /* Search specific time */
  async function handleSearch(e) {
    e.preventDefault();
    setSearchError("");
    setSearchResult(null);

    if (!searchTime) {
      setSearchError("Select a date and time.");
      return;
    }

    const iso = new Date(searchTime).toISOString();

    const { data } = await supabase
      .from("loop_fullness_logs")
      .select("*")
      .lte("timestamp", iso)
      .order("timestamp", { ascending: false })
      .limit(1);

    if (!data?.length) {
      setSearchError("No reading found.");
      return;
    }

    setSearchResult(data[0]);
  }

  if (loading) return <p>Loading metrics...</p>;

  const east = latest?.east_fullness ?? 0;
  const west = latest?.west_fullness ?? 0;

  /* ----------------------------------------------------------
     Render
  ---------------------------------------------------------- */
  return (
    <div className="card">
      <h1>Shipping Loop Fullness</h1>
      <p>Live PLC readings updated every minute.</p>

      {/* Gauges row */}
      <div
        style={{
          display: "flex",
          gap: "40px",
          flexWrap: "wrap",
          marginTop: "20px",
        }}
      >
        <div style={{ textAlign: "center", flex: "1 1 250px" }}>
          <h3>West Loop</h3>
          <div style={{ width: "200px", margin: "0 auto" }}>
            <Doughnut data={makeGaugeData(west)} options={gaugeOptions} />
          </div>
          <div style={{ marginTop: "8px", fontSize: "1.2rem" }}>{west}%</div>
        </div>

        <div style={{ textAlign: "center", flex: "1 1 250px" }}>
          <h3>East Loop</h3>
          <div style={{ width: "200px", margin: "0 auto" }}>
            <Doughnut data={makeGaugeData(east)} options={gaugeOptions} />
          </div>
          <div style={{ marginTop: "8px", fontSize: "1.2rem" }}>{east}%</div>
        </div>
      </div>

      {/* Timeframe */}
      <div className="card" style={{ marginTop: "24px", padding: "16px" }}>
        <h3>Timeframe</h3>
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <label>
            Start
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </label>

          <label>
            End
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* iOS toggle */}
      <div style={{ marginTop: "20px", marginBottom: "12px" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
          }}
        >
          <span>Standard</span>

          <div
            onClick={() => setGradientMode((prev) => !prev)}
            style={{
              width: "50px",
              height: "26px",
              background: gradientMode ? "#4ade80" : "#94a3b8",
              borderRadius: "20px",
              position: "relative",
              transition: "background 0.25s",
            }}
          >
            <div
              style={{
                width: "22px",
                height: "22px",
                background: "white",
                borderRadius: "50%",
                position: "absolute",
                top: "2px",
                left: gradientMode ? "26px" : "2px",
                transition: "left 0.25s",
              }}
            ></div>
          </div>

          <span>Gradient</span>
        </label>
      </div>

      {/* Line chart */}
      <div style={{ marginTop: "24px", height: "350px", width: "100%" }}>
        <h3>History</h3>
        {logs.length ? (
          <Line ref={chartRef} data={lineData} options={lineOptions} />
        ) : (
          <p>No data.</p>
        )}
      </div>

      {/* Search */}
      <div
        className="card"
        style={{ marginTop: "24px", padding: "16px", maxWidth: "450px" }}
      >
        <h3>Search By Time</h3>
        <form
          onSubmit={handleSearch}
          style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
        >
          <input
            type="datetime-local"
            value={searchTime}
            onChange={(e) => setSearchTime(e.target.value)}
          />
          <button className="btn-primary" type="submit">
            Search
          </button>
        </form>

        {searchError && (
          <p style={{ color: "var(--danger)", marginTop: "8px" }}>
            {searchError}
          </p>
        )}

        {searchResult && (
          <div style={{ marginTop: "12px" }}>
            <p>
              <strong>
                {new Date(searchResult.timestamp).toLocaleString()}
              </strong>
            </p>
            <p>West: {searchResult.west_fullness}%</p>
            <p>East: {searchResult.east_fullness}%</p>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ marginTop: "24px" }}>
        <h3>Logs</h3>
        {logs.length ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ textAlign: "center" }}>Timestamp</th>
                  <th style={{ textAlign: "center" }}>West (%)</th>
                  <th style={{ textAlign: "center" }}>East (%)</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((r) => (
                  <tr key={r.id}>
                    <td style={{ textAlign: "center" }}>
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td style={{ textAlign: "center" }}>{r.west_fullness}</td>
                    <td style={{ textAlign: "center" }}>{r.east_fullness}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No data.</p>
        )}
      </div>
    </div>
  );
};
