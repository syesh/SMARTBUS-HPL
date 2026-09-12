-- Enable PostGIS for geospatial features
create extension if not exists postgis;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users table (Extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  email text unique not null,
  phone text,
  role text check (role in ('admin', 'driver', 'student', 'parent')) not null,
  college_id text,
  push_token text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Drivers
create table public.drivers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  license_number text,
  assigned_bus_id uuid -- Will be foreign key after buses table
);

-- 3. Buses
create table public.buses (
  id uuid default uuid_generate_v4() primary key,
  registration_number text unique not null,
  name text,
  capacity integer,
  driver_id uuid references public.drivers on delete set null,
  status text check (status in ('active', 'inactive', 'maintenance')) default 'inactive'
);

-- Add foreign key to drivers
alter table public.drivers add constraint fk_drivers_bus foreign key (assigned_bus_id) references public.buses(id) on delete set null;

-- 4. Routes
create table public.routes (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  start_point text not null,
  destination text not null,
  distance_km numeric,
  estimated_duration_mins integer
);

-- 5. Boarding Points
create table public.boarding_points (
  id uuid default uuid_generate_v4() primary key,
  route_id uuid references public.routes on delete cascade not null,
  name text not null,
  location geography(point) not null, -- Stores Lat/Lng
  geofence_radius_meters integer default 100,
  sequence_order integer not null
);

-- 6. Students
create table public.students (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  bus_id uuid references public.buses on delete set null,
  route_id uuid references public.routes on delete set null,
  boarding_point_id uuid references public.boarding_points on delete set null
);

-- 7. Parents
create table public.parents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  student_id uuid references public.students on delete cascade not null
);

-- 8. Trips
create table public.trips (
  id uuid default uuid_generate_v4() primary key,
  bus_id uuid references public.buses on delete set null,
  driver_id uuid references public.drivers on delete set null,
  route_id uuid references public.routes on delete set null,
  status text check (status in ('scheduled', 'active', 'completed', 'cancelled', 'delayed', 'paused')) default 'scheduled',
  start_time timestamp with time zone,
  end_time timestamp with time zone
);

-- 9. GPS Locations (For historical data and offline sync buffering)
create table public.gps_locations (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips on delete cascade not null,
  location geography(point) not null,
  speed numeric,
  heading numeric,
  accuracy numeric,
  battery_level integer,
  network_status text,
  recorded_at timestamp with time zone not null, -- To handle offline buffered times
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. Notifications
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users on delete cascade not null,
  trip_id uuid references public.trips on delete set null,
  type text not null,
  priority text check (priority in ('normal', 'important', 'high')) default 'normal',
  title text not null,
  message text not null,
  read_status boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security)
alter table public.users enable row level security;
alter table public.buses enable row level security;
alter table public.routes enable row level security;
alter table public.trips enable row level security;
alter table public.gps_locations enable row level security;

-- Setup RLS Policies (Drafts - to be refined for production)
-- Users can see their own data
create policy "Users can view own data" on public.users for select using (auth.uid() = id);
-- Everyone can read buses
create policy "Anyone can view buses" on public.buses for select using (true);
-- Everyone can read routes
create policy "Anyone can view routes" on public.routes for select using (true);
-- Drivers can insert GPS locations
create policy "Drivers can insert gps locations" on public.gps_locations for insert with check (true);
-- Everyone can view GPS locations
create policy "Anyone can view gps locations" on public.gps_locations for select using (true);

-- Enable Realtime for live tracking tables
alter publication supabase_realtime add table public.gps_locations;
alter publication supabase_realtime add table public.trips;
alter publication supabase_realtime add table public.buses;
