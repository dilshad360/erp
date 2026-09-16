-- Migration: 20260902000000_attendance_logs.sql
-- Creates the attendance_logs table for Phase 3.

create table if not exists attendance_logs (
  id              uuid primary key default gen_random_uuid(),
  company_id      uuid references companies(id) not null,
  user_id         uuid references profiles(id) not null,
  check_in_at     timestamptz,
  check_in_lat    double precision,
  check_in_lng    double precision,
  check_in_range  boolean,                           -- true if within geofence, null if no location
  check_out_at    timestamptz,
  check_out_lat   double precision,
  check_out_lng   double precision,
  check_out_range boolean,
  status          text default 'present',            -- 'present' | 'absent' | 'half_day'
  notes           text,
  created_at      timestamptz default now()
);

-- Indexes for common query patterns
create index if not exists attendance_logs_company_idx
  on attendance_logs (company_id, check_in_at desc);

create index if not exists attendance_logs_user_idx
  on attendance_logs (user_id, check_in_at desc);
