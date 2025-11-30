import React from "react";
import dayjs from "dayjs";

const formatTimeToAmPm = (time) => {
  if (!time) return "";
  const [hourStr, minuteStr = "00"] = String(time).split(":");
  let hour = parseInt(hourStr, 10);
  if (Number.isNaN(hour)) return time; // fallback

  const suffix = hour >= 12 ? "PM" : "AM";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;

  const minutes = minuteStr.padStart(2, "0");
  return `${hour}:${minutes} ${suffix}`;
};

export const EventTable = ({
  events,
  showAdminActions = false,
  onDelete,
}) => {
  return (
    <div className="card">
      <h3>Events</h3>
      <div className="table-wrapper">
        <table className="events-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Alias</th>
              <th>Pager</th>
              <th>Issue</th>
              <th>SEV</th>
              <th>Paged Before SEV</th>
              <th>Req. On-Site</th>
              <th>Sim-T</th>
              {showAdminActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id}>
                <td>{dayjs(ev.event_date).format("YYYY-MM-DD")}</td>
                <td>{formatTimeToAmPm(ev.event_time)}</td>
                <td>{ev.alias}</td>
                <td>{ev.pager_alias}</td>
                <td className="issue-cell">{ev.issue}</td>
                <td>{ev.sev ? "Yes" : "No"}</td>
                <td>{ev.paged_before_sev ? "Yes" : "No"}</td>
                <td>{ev.required_on_site ? "Yes" : "No"}</td>
                <td>
                  {ev.sim_t ? (
                    <a href={ev.sim_t} target="_blank" rel="noreferrer">
                      Link
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                {showAdminActions && (
                  <td>
                    <button
                      className="btn-danger"
                      onClick={() => onDelete && onDelete(ev.id)}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={showAdminActions ? 10 : 9}>No events.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
