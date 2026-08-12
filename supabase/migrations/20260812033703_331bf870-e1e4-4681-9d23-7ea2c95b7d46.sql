CREATE TABLE public.giveaway_launch_config (
  id text PRIMARY KEY,
  launch_enabled boolean NOT NULL DEFAULT false,
  supplier_confirmed boolean NOT NULL DEFAULT false,
  opens_at timestamptz NOT NULL,
  closes_at timestamptz NOT NULL,
  terms_version text NOT NULL,
  prize_sku text NOT NULL,
  prize_name text NOT NULL,
  prize_value_aud numeric(10,2) NOT NULL,
  supplier_confirmation_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.giveaway_launch_config TO service_role;
ALTER TABLE public.giveaway_launch_config ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.giveaway_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id text NOT NULL REFERENCES public.giveaway_launch_config(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  email_normalized text NOT NULL,
  state_territory text NOT NULL,
  age_confirmed boolean NOT NULL,
  response text NOT NULL,
  response_word_count integer NOT NULL,
  terms_accepted boolean NOT NULL,
  terms_version text NOT NULL,
  terms_accepted_at timestamptz NOT NULL DEFAULT now(),
  marketing_consent boolean NOT NULL DEFAULT false,
  marketing_consent_at timestamptz,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  ip_hash text,
  user_agent text,
  eligibility_status text NOT NULL DEFAULT 'pending',
  exclusion_reason text,
  score_safety numeric(5,2),
  score_relevance numeric(5,2),
  score_clarity numeric(5,2),
  score_total numeric(6,2),
  judge_name text,
  judged_at timestamptz,
  winner_status text NOT NULL DEFAULT 'none',
  contact_attempts integer NOT NULL DEFAULT 0,
  contact_outcome text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT giveaway_entries_word_count_max CHECK (response_word_count BETWEEN 1 AND 25),
  CONSTRAINT giveaway_entries_age_required CHECK (age_confirmed IS TRUE),
  CONSTRAINT giveaway_entries_terms_required CHECK (terms_accepted IS TRUE),
  CONSTRAINT giveaway_entries_state_valid CHECK (state_territory IN ('ACT','NSW','NT','QLD','SA','TAS','VIC','WA')),
  CONSTRAINT giveaway_entries_eligibility_valid CHECK (eligibility_status IN ('pending','eligible','excluded')),
  CONSTRAINT giveaway_entries_winner_valid CHECK (winner_status IN ('none','provisional','confirmed','forfeited','runner_up'))
);

CREATE UNIQUE INDEX giveaway_entries_unique_email_per_giveaway
  ON public.giveaway_entries (giveaway_id, email_normalized);
CREATE INDEX giveaway_entries_created_at_idx ON public.giveaway_entries (created_at DESC);
CREATE INDEX giveaway_entries_ip_hash_idx ON public.giveaway_entries (ip_hash, created_at DESC);

GRANT ALL ON public.giveaway_entries TO service_role;
ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_giveaway_entries_updated_at
  BEFORE UPDATE ON public.giveaway_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_giveaway_launch_config_updated_at
  BEFORE UPDATE ON public.giveaway_launch_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.giveaway_launch_config
  (id, launch_enabled, supplier_confirmed, opens_at, closes_at, terms_version, prize_sku, prize_name, prize_value_aud)
VALUES
  ('recovery-kit-2026-08', false, false,
   '2026-08-17 09:00:00+08', '2026-08-30 23:59:59+08',
   'v1.0-2026-08',
   'AOB-RK407',
   'Air On Board 20T Soft Shackle & 8T Snatch Ring Recovery Kit',
   87.90);