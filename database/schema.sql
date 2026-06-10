-- Mengaktifkan modul geospasial di dalam Supabase / PostgreSQL
create extension if not exists postgis;

-- 1. PROFIL PENGGUNA (Terhubung ke UUID Supabase Auth)
create table if not exists profiles (
    id uuid references auth.users on delete cascade primary key,
    username text unique,
    campus_affiliation text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABEL TEMPAT (Menyimpan data inti lokasi)
create table if not exists places (
    id int primary key generated always as identity,
    name text not null,
    description text,
    geom geometry(Point, 4326) not null, -- Titik Lokasi PostGIS (Lon, Lat)
    avg_price_tier int check (avg_price_tier between 1 and 4),
    google_place_id text unique, -- Untuk penyimpanan lokal data Google API secara aman
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Membuat indeks spasial untuk kalkulasi radius cepat
create index if not exists places_geo_index on places using gist(geom);

-- 3. TABEL TAG (Quiet, Good Wi-Fi, Many charging ports, 24 hours, Printer nearby)
create table if not exists tags (
    id int primary key generated always as identity,
    tag_name text unique not null
);

-- 4. TABEL RELASI PLACE_TAGS (Dengan Skor Kepercayaan/Skor Validasi)
create table if not exists place_tags (
    place_id int references places(id) on delete cascade,
    tag_id int references tags(id) on delete cascade,
    confidence_score int default 1, -- Ditambahkan oleh upvote komunitas
    primary key (place_id, tag_id)
);

-- 5. TABEL ULASAN
create table if not exists reviews (
    id int primary key generated always as identity,
    place_id int references places(id) on delete cascade,
    user_id uuid references profiles(id) on delete set null,
    rating int check (rating between 1 and 5),
    comment text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. SEED DATA AWAL UNTUK TAG
insert into tags (tag_name) values
('Quiet'),
('Good Wi-Fi'),
('Many charging ports'),
('24 hours'),
('Printer nearby')
on conflict (tag_name) do nothing;

-- 7. FUNGSI UNTUK PENCARIAN SPASIAL BERDASARKAN RADIUS (Dalam Meter)
create or replace function get_places_in_radius(
  lat double precision,
  lng double precision,
  radius_meters double precision
)
returns table (
  id int,
  name text,
  description text,
  latitude double precision,
  longitude double precision,
  avg_price_tier int,
  google_place_id text,
  distance_meters double precision
) as $$
begin
  return query
  select 
    p.id,
    p.name,
    p.description,
    st_y(p.geom::geometry) as latitude,
    st_x(p.geom::geometry) as longitude,
    p.avg_price_tier,
    p.google_place_id,
    st_distance(
      p.geom::geography,
      st_setsrid(st_makepoint(lng, lat), 4326)::geography
    ) as distance_meters
  from places p
  where st_dwithin(
    p.geom::geography,
    st_setsrid(st_makepoint(lng, lat), 4326)::geography,
    radius_meters
  )
  order by distance_meters;
end;
$$ language plpgsql;
