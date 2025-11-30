import React, { useEffect, useState } from 'react';
import { supabase } from "../../supabaseClient";
import { EventTable } from "../../components/EventTable";

export const AdminPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
      .order('event_time', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
      console.error(error);
      alert('Delete failed.');
    } else {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
  };

  return (
    <div className="page">
      <h2>Admin</h2>
      <p>SUPER users can delete events here.</p>
      {loading ? (
        <div>Loading events...</div>
      ) : (
        <EventTable
          events={events}
          showAdminActions={true}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};
