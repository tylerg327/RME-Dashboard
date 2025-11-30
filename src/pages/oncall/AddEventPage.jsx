import React, { useState } from 'react';
import dayjs from 'dayjs';
import { supabase } from "../../supabaseClient";
import { useAuth } from '../../context/AuthContext';

export const AddEventPage = () => {
  const { user } = useAuth();
  const [eventDate, setEventDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [eventTime, setEventTime] = useState(dayjs().format('HH:mm'));
  const [alias, setAlias] = useState('');
  const [pagerAlias, setPagerAlias] = useState('');
  const [issue, setIssue] = useState('');
  const [sev, setSev] = useState(false);
  const [pagedBeforeSev, setPagedBeforeSev] = useState(false);
  const [requiredOnSite, setRequiredOnSite] = useState(false);
  const [simT, setSimT] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setMessage('You must be signed in.');
      return;
    }
    setSaving(true);
    setMessage('');

    const payload = {
      event_date: eventDate,
      event_time: eventTime,
      alias: alias || null,
      pager_alias: pagerAlias || null,
      issue: issue || null,
      sev,
      paged_before_sev: pagedBeforeSev,
      required_on_site: requiredOnSite,
      sim_t: simT || null,
      created_by: user.id,
    };

    const { error } = await supabase.from('events').insert([payload]);
    if (error) {
      console.error(error);
      setMessage('Failed to save event.');
    } else {
      setMessage('Event saved.');
      // Keep date/time, clear text-ish fields
      setIssue('');
      setSimT('');
    }
    setSaving(false);
  };

  return (
    <div className="page">
      <div className="card">
        <h2>Add Event</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Date
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </label>
          <label>
            Time
            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              required
            />
          </label>
          <label>
            Alias
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
            />
          </label>
          <label>
            Pager Alias
            <input
              type="text"
              value={pagerAlias}
              onChange={(e) => setPagerAlias(e.target.value)}
            />
          </label>
          <label className="span-2">
            Issue
            <textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              rows={3}
            />
          </label>
          <label>
            SEV
            <input
              type="checkbox"
              checked={sev}
              onChange={(e) => setSev(e.target.checked)}
            />
          </label>
          <label>
            Paged Before SEV
            <input
              type="checkbox"
              checked={pagedBeforeSev}
              onChange={(e) => setPagedBeforeSev(e.target.checked)}
            />
          </label>
          <label>
            Required On-Site
            <input
              type="checkbox"
              checked={requiredOnSite}
              onChange={(e) => setRequiredOnSite(e.target.checked)}
            />
          </label>
          <label className="span-2">
            Sim-T URL
            <input
              type="url"
              value={simT}
              onChange={(e) => setSimT(e.target.value)}
              placeholder="https://t.corp.amazon.com/..."
            />
          </label>
          <div className="span-2">
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Event'}
            </button>
            {message && <div className="info-text">{message}</div>}
          </div>
        </form>
      </div>
    </div>
  );
};
