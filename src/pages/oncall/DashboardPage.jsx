import React, { useEffect, useState } from 'react';
import { supabase } from "../../supabaseClient";
import dayjs from 'dayjs';
import { EventsPerDayChart } from '../../components/charts/EventsPerDayChart';
import { EventsByHourChart } from '../../components/charts/EventsByHourChart';
import { EventTable } from '../../components/EventTable';

export const DashboardPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [fromDate, setFromDate] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [aliasFilter, setAliasFilter] = useState('');
  const [sevFilter, setSevFilter] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    let query = supabase
      .from('events')
      .select('*')
      .gte('event_date', fromDate)
      .lte('event_date', toDate)
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true });

    if (aliasFilter) {
      query = query.ilike('alias', `%${aliasFilter}%`);
    }
    if (sevFilter !== '') {
      query = query.eq('sev', sevFilter === 'true');
    }

    const { data, error } = await query;
    if (error) {
      console.error(error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => {
    fetchEvents();
  };

  return (
    <div className="page">
      <section className="filters-card card">
        <h3>Filters</h3>
        <div className="filters-row">
          <label>
            From
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </label>
          <label>
            Alias
            <input
              type="text"
              placeholder="giroutyl"
              value={aliasFilter}
              onChange={(e) => setAliasFilter(e.target.value)}
            />
          </label>
          <label>
            SEV
            <select
              value={sevFilter}
              onChange={(e) => setSevFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="true">SEV only</option>
              <option value="false">Non-SEV only</option>
            </select>
          </label>
          <button className="btn-primary" onClick={handleApplyFilters}>
            Apply
          </button>
        </div>
      </section>

      {loading ? (
        <div>Loading events...</div>
      ) : (
        <>
          <section className="grid-2">
            <EventsPerDayChart events={events} />
            <EventsByHourChart events={events} />
          </section>
          <section>
            <EventTable events={events} />
          </section>
        </>
      )}
    </div>
  );
};
