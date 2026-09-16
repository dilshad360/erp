-- Migration: 20260902000002_functions_haversine_checkin.sql
-- Haversine distance function + record_check_in RPC for geofenced attendance.

-- ── Haversine distance (meters between two lat/lng points) ──────────────────
create or replace function haversine_distance(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
) returns double precision as $$
declare
  r   double precision := 6371000; -- Earth radius in metres
  phi1 double precision := radians(lat1);
  phi2 double precision := radians(lat2);
  dphi double precision := radians(lat2 - lat1);
  dlam double precision := radians(lng2 - lng1);
  a   double precision;
begin
  a := sin(dphi/2)^2 + cos(phi1) * cos(phi2) * sin(dlam/2)^2;
  return r * 2 * atan2(sqrt(a), sqrt(1 - a));
end;
$$ language plpgsql immutable;

-- ── record_check_in RPC ──────────────────────────────────────────────────────
-- Atomically inserts an attendance_logs row with geofence check.
-- p_lat / p_lng can be NULL when the employee denies location.
-- Returns the new attendance_log id.
create or replace function record_check_in(
  p_user_id uuid,
  p_lat     double precision,
  p_lng     double precision
) returns uuid as $$
declare
  v_company   record;
  v_distance  double precision;
  v_in_range  boolean;
  v_log_id    uuid;
begin
  -- Fetch company associated with this user
  select c.* into v_company
  from companies c
  inner join profiles pr on pr.company_id = c.id
  where pr.id = p_user_id;

  if not found then
    raise exception 'Company not found for user %', p_user_id;
  end if;

  -- Determine geofence status
  if p_lat is not null and p_lng is not null and v_company.office_lat is not null then
    v_distance := haversine_distance(p_lat, p_lng, v_company.office_lat, v_company.office_lng);
    v_in_range := v_distance <= v_company.geofence_radius_m;
  elsif v_company.office_lat is null then
    -- No geofence configured — treat as in-range
    v_in_range := true;
  else
    -- Location denied by employee
    v_in_range := null;
  end if;

  insert into attendance_logs (
    company_id,
    user_id,
    check_in_at,
    check_in_lat,
    check_in_lng,
    check_in_range
  ) values (
    v_company.id,
    p_user_id,
    now(),
    p_lat,
    p_lng,
    v_in_range
  )
  returning id into v_log_id;

  return v_log_id;
end;
$$ language plpgsql security definer;
