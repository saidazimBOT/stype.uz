-- ═══════════════════════════════════════════════════════════════════════
-- CHALLENGE INVITES — Do'stlarni o'yinga chaqirish tizimi
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS challenge_invites (
  id TEXT PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_username TEXT NOT NULL DEFAULT '',
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_username TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'racing', 'finished')),
  text_seed TEXT NOT NULL DEFAULT '',
  lang TEXT NOT NULL DEFAULT 'en',
  duration INTEGER NOT NULL DEFAULT 15,
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000),
  updated_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000),
  -- Natijalar
  from_wpm INTEGER,
  from_accuracy INTEGER,
  from_finished_at BIGINT,
  to_wpm INTEGER,
  to_accuracy INTEGER,
  to_finished_at BIGINT
);

-- Indekslar
CREATE INDEX IF NOT EXISTS idx_challenge_invites_from ON challenge_invites(from_user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_invites_to ON challenge_invites(to_user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_invites_status ON challenge_invites(status);

-- RLS — foydalanuvchi faqat o'ziga yuborilgan yoki o'zi yuborgan invitation'larni ko'radi
ALTER TABLE challenge_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenges" ON challenge_invites
  FOR SELECT USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
  );

CREATE POLICY "Users can create challenges" ON challenge_invites
  FOR INSERT WITH CHECK (
    auth.uid() = from_user_id
  );

CREATE POLICY "Users can update own challenges" ON challenge_invites
  FOR UPDATE USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
  );

-- ═══════════════════════════════════════════════════════════════════════
-- TOURNAMENTS — Turnir tizimi
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  mode TEXT NOT NULL DEFAULT 'sprint' CHECK (mode IN ('sprint', 'marathon', 'accuracy', 'endless')),
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'finished')),
  lang TEXT NOT NULL DEFAULT 'en',
  duration INTEGER NOT NULL DEFAULT 15,
  start_time BIGINT NOT NULL,
  end_time BIGINT NOT NULL,
  participant_count INTEGER NOT NULL DEFAULT 0,
  prize_coins INTEGER NOT NULL DEFAULT 0,
  participant_user_ids UUID[] DEFAULT '{}',
  created_by TEXT NOT NULL DEFAULT '',
  rewards_distributed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000),
  updated_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)
);

-- Indekslar
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_time ON tournaments(start_time);
CREATE INDEX IF NOT EXISTS idx_tournaments_created_at ON tournaments(created_at);

-- RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tournaments" ON tournaments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create tournaments" ON tournaments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update tournaments" ON tournaments
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete tournaments" ON tournaments
  FOR DELETE USING (auth.role() = 'authenticated');

-- ═══════════════════════════════════════════════════════════════════════
-- TOURNAMENT PARTICIPANTS — Turnir ishtirokchilari
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL DEFAULT '',
  wpm INTEGER NOT NULL DEFAULT 0,
  accuracy INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  time INTEGER NOT NULL DEFAULT 0,
  joined_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000),
  color TEXT NOT NULL DEFAULT '',
  avatar TEXT NOT NULL DEFAULT ''
);

-- Indekslar
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_user ON tournament_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_wpm ON tournament_participants(wpm DESC);

-- RLS
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tournament participants" ON tournament_participants
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join tournaments" ON tournament_participants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own tournament results" ON tournament_participants
  FOR UPDATE USING (auth.uid() = user_id);
