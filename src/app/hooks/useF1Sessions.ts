import { useState, useEffect } from 'react';

const BASE = 'https://api.openf1.org/v1';

export interface Session {
  session_key:        number;
  session_name:       string;
  date_start:         string;
  date_end:           string;
  gmt_offset:         string;
  session_type:       string;
  meeting_key:        number;
  location:           string;
  country_name:       string;
  circuit_short_name: string;
  year:               number;
}

export interface Meeting {
  meeting_key:            number;
  meeting_name:           string;
  meeting_official_name:  string;
  location:               string;
  country_name:           string;
  circuit_short_name:     string;
  date_start:             string;
  year:                   number;
}

/**
 * Fetches the 2026 F1 season sessions and meetings from OpenF1.
 * Used by SessionInfo to show live session, upcoming sessions, and race calendar.
 *
 * Place in: src/app/hooks/useF1Sessions.ts
 */
export function useF1Sessions() {
  const [currentSession,   setCurrentSession]   = useState<Session | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [meetings,         setMeetings]         = useState<Meeting[]>([]);
  const [loading,          setLoading]          = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessRes, meetRes] = await Promise.allSettled([
          fetch(`${BASE}/sessions?year=2026`),
          fetch(`${BASE}/meetings?year=2026`),
        ]);

        if (sessRes.status === 'fulfilled' && sessRes.value.ok) {
          const sessions: Session[] = await sessRes.value.json();
          const now = new Date();

          // Find currently live session
          const live = sessions.find(s => {
            const start = new Date(s.date_start);
            const end   = new Date(s.date_end);
            return start <= now && now <= end;
          });
          setCurrentSession(live ?? null);

          // Next upcoming sessions
          const upcoming = sessions
            .filter(s => new Date(s.date_start) > now)
            .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
            .slice(0, 6);
          setUpcomingSessions(upcoming);
        }

        if (meetRes.status === 'fulfilled' && meetRes.value.ok) {
          const data: Meeting[] = await meetRes.value.json();
          setMeetings(data.sort((a, b) =>
            new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
          ));
        }
      } catch {
        // Silent — SessionInfo falls back to hardcoded 2026 calendar
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const iv = setInterval(fetchData, 60_000); // re-check every minute
    return () => clearInterval(iv);
  }, []);

  return { currentSession, upcomingSessions, meetings, loading };
}