-- Supabase Seed File for StudentMap
-- This will create tables and insert mock data.

DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS place_tags;
DROP TABLE IF EXISTS places;
DROP TABLE IF EXISTS tags;

-- 1. Create Places Table
CREATE TABLE places (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    lat FLOAT NOT NULL,
    lng FLOAT NOT NULL,
    avg_price_tier INTEGER DEFAULT 1,
    google_place_id TEXT,
    avg_rating FLOAT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create Tags Table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    tag_name TEXT NOT NULL
);

-- 3. Create Place_Tags Table
CREATE TABLE place_tags (
    place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    confidence_score INTEGER DEFAULT 0,
    PRIMARY KEY (place_id, tag_id)
);

-- 4. Create Reviews Table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    user_id TEXT,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- INSERTS --

-- Insert Tags
INSERT INTO tags (id, tag_name) VALUES (1, 'Quiet');
INSERT INTO tags (id, tag_name) VALUES (2, 'Good Wi-Fi');
INSERT INTO tags (id, tag_name) VALUES (3, 'Many charging ports');
INSERT INTO tags (id, tag_name) VALUES (4, '24 hours');
INSERT INTO tags (id, tag_name) VALUES (5, 'Printer nearby');

-- Insert Places
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (1, 'Kopi Toko Djawa (Dago)', 'Tempat ngopi legendaris yang nyaman, cocok untuk laptopan santai. Memiliki nuansa retro yang estetik.', -6.8892, 107.6159, 2, 'chIJDagoDjawaPlace1', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (2, 'Warung Nasi SPG Dipatiukur', 'Nasi ayam legendaris porsi kuli dengan sambal hijau pedas mantap. Sangat ramah di kantong mahasiswa.', -6.8945, 107.6185, 1, 'chIJspgDipatiukur2', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (3, 'Kineruku', 'Perpustakaan, toko buku, dan rumah makan indie yang sangat sunyi dan tenang. Sangat kondusif untuk membaca atau nugas serius.', -6.8778, 107.6015, 2, 'chIJkinerukuPlace3', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (4, 'McDonald''s Dago (24 Jam)', 'McD 24 jam dengan Wi-Fi kencang dan banyak colokan. Tempat andalan mahasiswa ITB begadang ngerjain tugas kelompok.', -6.8864, 107.6146, 2, 'chIJmcdDagoPlace4', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (5, 'Fotocopy & Printing Murni Dipatiukur', 'Jasa fotokopi, cetak dokumen, jilid skripsi murah meriah dan cepat. Buka hingga larut malam.', -6.8935, 107.618, 1, 'chIJprintMurni5', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (6, 'Kantin Salman ITB', 'Kantin di kompleks Masjid Salman ITB. Menyediakan makanan prasmanan sehat, murah, dan suasananya tenang di selasar masjid.', -6.893, 107.6105, 1, 'chIJsalmanIitb6', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (7, 'Upnormal Coffee Roasters Dipatiukur', 'Kafe luas dua lantai dengan banyak sekali colokan di setiap meja dan Wi-Fi handal. Favorit mahasiswa UNPAD dan ITB.', -6.8988, 107.6174, 2, 'chIJupnormalDipatiukur7', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (8, 'Nimna Book Cafe', 'Kafe buku tersembunyi yang tenang dan damai. Cocok buat yang mau fokus belajar tanpa kebisingan kota.', -6.8845, 107.5912, 2, 'chIJnimnaBook8', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (9, 'Lo.Ka.Si Coworking & Space', 'Ruang kerja bersama dengan internet super cepat, AC dingin, dan lingkungan kerja yang profesional. Ada kafe di dalamnya.', -6.89, 107.616, 3, 'chIJlokasiCowork9', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (10, 'Cups Coffee & Kitchen', 'Kafe bertema industrial estetik dengan hidangan kopi premium dan brunch lezat. Cocok untuk meeting kelompok.', -6.9034, 107.6155, 3, 'chIJcupsKitchen10', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (11, 'Starbucks Dipatiukur', 'Starbucks yang luas dan nyaman di dekat halte DAMRI DU. Sering ramai mahasiswa dengan laptopnya.', -6.895, 107.6168, 4, 'chIJstarbucksDu11', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (12, 'Kopi Anjis Dipatiukur', 'Kafe santai semi-outdoor legendaris di Dipatiukur. Terkenal dengan roti bakar dan kopi saring susu yang murah.', -6.8962, 107.6172, 2, 'chIJkopianjis12', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (13, 'Kantin Fisip UNPAD DU', 'Kantin kampus UNPAD Dipatiukur yang terbuka untuk umum. Banyak kuliner murah meriah dan dekat fotokopian.', -6.8932, 107.619, 1, 'chIJkantinfisip13', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (14, 'Caringin Tilu Coffee Shop', 'Kafe bukit di dataran tinggi Bandung dengan pemandangan kota Bandung. Tenang di sore hari, cocok untuk refreshing.', -6.8576, 107.6322, 3, 'chIJcaringinTilu14', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (15, 'KFC Dago (24 Jam)', 'Gerai KFC 24 jam di simpang Dago. Wi-Fi gratis lumayan cepat dan lokasinya strategis dekat pusat kos mahasiswa.', -6.8855, 107.614, 2, 'chIJKfcDago15', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (16, 'Aesthetic Study Hub', 'Kafe modern dengan interior aesthetic, workspace luas, dan atmosphere tenang.', -6.9485, 107.64880000000001, 2, 'gplace_mock_1780007380372_1', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (17, 'Warmindo & Coworking Rakyat', 'Warmindo 24 jam murah meriah, banyak colokan, wifi super kencang.', -6.9508, 107.65190000000001, 1, 'gplace_mock_1780007380372_2', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (18, 'Ganesha Printing & Library', 'Tempat print dokumen, fotokopi, lengkap dengan perpustakaan mini dan area baca.', -6.9478, 107.65050000000001, 1, 'gplace_mock_1780007380372_3', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (19, 'Aesthetic Study Hub', 'Kafe modern dengan interior aesthetic, workspace luas, dan atmosphere tenang.', -6.925310266168594, 107.72541209106447, 2, 'gplace_mock_1780009439836_1', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (20, 'Warmindo & Coworking Rakyat', 'Warmindo 24 jam murah meriah, banyak colokan, wifi super kencang.', -6.927610266168594, 107.72851209106447, 1, 'gplace_mock_1780009439836_2', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (21, 'Ganesha Printing & Library', 'Tempat print dokumen, fotokopi, lengkap dengan perpustakaan mini dan area baca.', -6.924610266168594, 107.72711209106447, 1, 'gplace_mock_1780009439836_3', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (101, 'Fotokopi & Print Kawan Binus Paskal', 'Tempat print tugas dan jilid makalah paling dekat dari Binus. Harganya mahasiswa banget dan hasil printnya rapi.', -6.9145, 107.593, 1, 'mock_binus_print', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (102, 'Warmindo Paskal 24 Jam', 'Penyelamat anak Binus saat kelaparan malam hari habis nugas. Magelangan dan es teh manisnya juara.', -6.9158, 107.594, 1, 'mock_binus_warmindo', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (103, 'Laundry Kiloan Bersih Paskal', 'Laundry andalan mahasiswa kost sekitar Binus. Murah, wangi, dan bisa antar jemput ke kost.', -6.916, 107.5925, 1, 'mock_binus_laundry', 0);
INSERT INTO places (id, name, description, lat, lng, avg_price_tier, google_place_id, avg_rating) VALUES (104, 'Lo.Ka.Si Coffee & Space (Paskal)', 'Cabang Lo.Ka.Si di area Paskal. Cocok untuk kerja kelompok dengan Wi-Fi kencang dan banyak colokan.', -6.9135, 107.591, 2, 'mock_binus_lokasi', 0);

-- Insert Place Tags
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (1, 2, 12);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (1, 3, 8);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (2, 1, -2);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (3, 1, 25);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (3, 2, 5);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (4, 2, 18);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (4, 3, 22);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (4, 4, 30);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (5, 5, 40);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (6, 1, 15);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (7, 2, 35);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (7, 3, 38);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (8, 1, 20);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (8, 2, 7);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (9, 2, 28);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (9, 3, 24);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (9, 1, 14);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (10, 2, 11);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (10, 3, 10);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (11, 2, 15);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (11, 3, 12);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (12, 3, 5);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (13, 5, 12);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (14, 1, 8);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (15, 2, 11);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (15, 4, 24);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (16, 2, 1);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (16, 3, 1);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (17, 2, 1);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (17, 3, 1);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (18, 2, 1);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (18, 3, 2);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (10, 1, 1);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (10, 4, 1);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (10, 5, 0);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (19, 2, 1);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (19, 3, 1);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (20, 2, 1);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (20, 3, 1);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (21, 2, 1);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (21, 3, 1);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (101, 5, 25);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (101, 1, 0);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (102, 4, 45);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (102, 2, 5);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (104, 2, 30);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (104, 3, 20);
INSERT INTO place_tags (place_id, tag_id, confidence_score) VALUES (104, 1, 1);

-- Insert Reviews
INSERT INTO reviews (id, place_id, username, user_id, rating, comment, created_at) VALUES (1, 1, 'budi_itb', '11111111-1111-1111-1111-111111111111', 4, 'Kopinya enak banget, suasananya asik buat nugas sore-sore. Tapi kalau malam agak rame.', '2026-05-10T12:00:00Z');
INSERT INTO reviews (id, place_id, username, user_id, rating, comment, created_at) VALUES (2, 3, 'anisa_unpad', '22222222-2222-2222-2222-222222222222', 5, 'Tempat terwajib kalau lagi stress nulis skripsi. Tenang banget dan wangi buku lama.', '2026-05-15T09:30:00Z');
INSERT INTO reviews (id, place_id, username, user_id, rating, comment, created_at) VALUES (3, 7, 'agus_upi', '33333333-3333-3333-3333-333333333333', 4, 'Colokan melimpah, wifi stabil. Sangat menunjang kebutuhan push-rank di kala jenuh belajar.', '2026-05-20T18:45:00Z');
INSERT INTO reviews (id, place_id, username, user_id, rating, comment, created_at) VALUES (4, 2, 'budi_itb', '11111111-1111-1111-1111-111111111111', 5, 'Gila porsi nasi ayamnya banyak banget! Sambalnya pedas gila. Penyelamat anak kost di akhir bulan.', '2026-05-22T13:10:00Z');
INSERT INTO reviews (id, place_id, username, user_id, rating, comment, created_at) VALUES (5, 4, 'reza_itb', '44444444-4444-4444-4444-444444444444', 4, 'Selalu jadi andalan kalau wifi kosan mati tengah malam. Banyak colokan di pojokan.', '2026-05-25T02:00:00Z');
INSERT INTO reviews (id, place_id, username, user_id, rating, comment, created_at) VALUES (6, 1, 'budi_itb', '11111111-1111-1111-1111-111111111111', 5, 'Superb!', '2026-05-28T22:29:40.367Z');
INSERT INTO reviews (id, place_id, username, user_id, rating, comment, created_at) VALUES (7, 10, 'McLennon', 'user-u6e47n4da', 5, 'Mantapp', '2026-05-28T22:59:58.343Z');
