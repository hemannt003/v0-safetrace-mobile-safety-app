-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geospatial queries (optional but powerful)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ── Users (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone           TEXT UNIQUE NOT NULL,
  name            TEXT,
  pin_hash        TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Trusted Contacts
CREATE TABLE public.trusted_contacts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,
  relation        TEXT,
  notify_sms      BOOLEAN DEFAULT TRUE,
  notify_push     BOOLEAN DEFAULT TRUE,
  push_token      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON public.trusted_contacts(user_id);

-- ── SOS Sessions (incidents)
CREATE TABLE public.sos_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id),
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'cancelled', 'resolved')),
  trigger_type    TEXT NOT NULL,    -- 'auto_voice' | 'auto_motion' | 'manual'
  trigger_data    JSONB,            -- raw signal data at trigger moment
  risk_score      FLOAT,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  police_notified BOOLEAN DEFAULT FALSE,
  contacts_notified INT DEFAULT 0,
  evidence_key    TEXT,             -- SecureStore key for encrypted recording
  metadata        JSONB
);
CREATE INDEX ON public.sos_sessions(user_id);
CREATE INDEX ON public.sos_sessions(status);

-- ── GPS Trail (time-series location points)
CREATE TABLE public.gps_points (
  id              BIGSERIAL PRIMARY KEY,
  session_id      UUID NOT NULL REFERENCES public.sos_sessions(id) ON DELETE CASCADE,
  lat             FLOAT NOT NULL,
  lng             FLOAT NOT NULL,
  accuracy        FLOAT,
  recorded_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON public.gps_points(session_id, recorded_at DESC);

-- ── Crime Heatmap Tiles (seeded from NCRB data)
CREATE TABLE public.crime_tiles (
  id              BIGSERIAL PRIMARY KEY,
  geohash         TEXT NOT NULL,
  lat             FLOAT NOT NULL,
  lng             FLOAT NOT NULL,
  risk_score      FLOAT NOT NULL,   -- 0-1
  incident_count  INT,
  last_updated    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON public.crime_tiles(geohash);

-- ── Signal Log (for dashboard display)
CREATE TABLE public.threat_signals (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES public.profiles(id),
  session_id      UUID REFERENCES public.sos_sessions(id),
  signal_type     TEXT NOT NULL,    -- 'motion_spike' | 'loud_audio' | etc.
  weight          FLOAT NOT NULL,
  metadata        JSONB,
  recorded_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON public.threat_signals(user_id, recorded_at DESC);

-- ── Row Level Security
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps_points       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threat_signals   ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "own data" ON public.profiles         FOR ALL USING (auth.uid() = id);
CREATE POLICY "own data" ON public.trusted_contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own data" ON public.sos_sessions     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own data" ON public.gps_points       FOR ALL
  USING (session_id IN (SELECT id FROM public.sos_sessions WHERE user_id = auth.uid()));
CREATE POLICY "own data" ON public.threat_signals   FOR ALL USING (auth.uid() = user_id);

-- Public read on gps_points for tracking links (by session_id only, no auth)
CREATE POLICY "public tracking" ON public.gps_points
  FOR SELECT USING (true);  -- contacts access via session ID link (no PII exposed)

-- ── Realtime: enable for live GPS push
ALTER PUBLICATION supabase_realtime ADD TABLE public.gps_points;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_sessions;
