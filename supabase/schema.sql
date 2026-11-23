-- =====================================================================
-- COM5 – Plateforme participative · Schéma de base de données
-- À exécuter une fois dans Supabase > SQL Editor (ou via `npm run db:migrate`).
-- Idempotent : peut être relancé sans perte de données.
-- =====================================================================

create extension if not exists pgcrypto;

-- Configuration des commissions (modifiable depuis l'espace admin, sans rebuild)
create table if not exists commissions (
  slug         text primary key,
  sort_order   int  not null default 0,
  name         text not null,
  short_name   text not null,
  tagline      text not null default '',
  description  text not null default '',
  image        text not null default '',
  image_alt    text not null default '',
  categories   jsonb not null default '[]'::jsonb,
  extra_fields jsonb not null default '[]'::jsonb,
  updated_at   timestamptz not null default now()
);

-- Réglages divers (liste des génies / départements…)
create table if not exists settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Une contribution = un envoi de formulaire (une ou plusieurs propositions)
create table if not exists submissions (
  id              uuid primary key default gen_random_uuid(),
  commission_slug text not null references commissions(slug) on update cascade,
  full_name       text,
  department      text,
  is_anonymous    boolean not null default false,
  created_at      timestamptz not null default now()
);
create index if not exists submissions_commission_idx on submissions(commission_slug);
create index if not exists submissions_created_idx on submissions(created_at desc);

create table if not exists proposals (
  id              uuid primary key default gen_random_uuid(),
  submission_id   uuid not null references submissions(id) on delete cascade,
  commission_slug text not null references commissions(slug) on update cascade,
  position        int  not null default 1,
  category_id     text not null,
  category_label  text not null,          -- libellé figé au moment de l'envoi
  title           text not null,
  description     text not null,
  objective       text,
  organization    text,
  budget_type     text not null default 'unspecified'
                  check (budget_type in ('unspecified','none','unknown','amount')),
  budget_amount   text,
  period          text,
  inclusion       text,
  special_note    text,
  extra           jsonb not null default '{}'::jsonb,  -- champs propres à la commission
  created_at      timestamptz not null default now()
);
create index if not exists proposals_commission_idx on proposals(commission_slug);
create index if not exists proposals_submission_idx on proposals(submission_id);
create index if not exists proposals_created_idx on proposals(created_at desc);

-- Journal anti-abus (IP hachées + salées, jamais en clair)
create table if not exists rate_events (
  id         bigserial primary key,
  kind       text not null,
  ip_hash    text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_events_lookup_idx on rate_events(kind, ip_hash, created_at desc);

-- ---------------------------------------------------------------------
-- Sécurité : RLS activé SANS aucune policy.
-- => les clés publiques Supabase (anon / authenticated) n'ont accès à RIEN.
-- Seul le serveur Next.js (connexion Postgres directe, côté serveur) lit/écrit.
-- ---------------------------------------------------------------------
alter table commissions  enable row level security;
alter table settings     enable row level security;
alter table submissions  enable row level security;
alter table proposals    enable row level security;
alter table rate_events  enable row level security;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on commissions, settings, submissions, proposals, rate_events from anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on commissions, settings, submissions, proposals, rate_events from authenticated;
  end if;
end $$;
