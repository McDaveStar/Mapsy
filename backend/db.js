const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables if available
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

let dbClient = null;
let useMock = true;

// Haversine distance in meters
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in meters
}

if (SUPABASE_URL && SUPABASE_KEY) {
    try {
        dbClient = createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log("🚀 Supabase Client initialized successfully.");
        useMock = false;
    } catch (err) {
        console.error("⚠️ Failed to initialize Supabase, falling back to Mock DB:", err.message);
    }
} else {
    console.log("ℹ️ No Supabase credentials found in environment. Falling back to local Mock Database.");
}

// Local mock database helpers
const mockDbPath = path.join(process.cwd(), 'backend', 'data', 'mockDb.json');

function readMockDb() {
    try {
        const data = fs.readFileSync(mockDbPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading mock database:", err);
        return { places: [], tags: [], place_tags: [], reviews: [], profiles: [], users: [] };
    }
}

function writeMockDb(data) {
    try {
        fs.writeFileSync(mockDbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error("Error writing mock database:", err);
    }
}

// Helper to calculate temporal decay weighted average rating (under 30 days = 2.0 weight, else 1.0 weight)
function calculateWeightedAverage(reviews) {
    if (!reviews || reviews.length === 0) return 0;
    
    let totalScore = 0;
    let totalWeight = 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    for (const r of reviews) {
        const rating = parseFloat(r.rating) || 0;
        const createdAt = new Date(r.created_at);
        const isRecent = createdAt >= thirtyDaysAgo;
        const weight = isRecent ? 2.0 : 1.0;
        
        totalScore += rating * weight;
        totalWeight += weight;
    }
    
    return parseFloat((totalScore / totalWeight).toFixed(1));
}

// Unified Database Provider Interface
const DB = {
    isMock: () => useMock,

    // 1. Search & Filter Places
    getPlaces: async (filters = {}) => {
        const { tags = [], maxPriceTier = null, center = null, radius = 5000 } = filters;
        // center is { lat, lng }

        if (!useMock) {
            try {
                // If geo search is requested and we have coordinates
                let placesQuery;
                if (center && center.lat && center.lng) {
                    // Call get_places_in_radius stored procedure in Supabase
                    const { data, error } = await dbClient.rpc('get_places_in_radius', {
                        lat: parseFloat(center.lat),
                        lng: parseFloat(center.lng),
                        radius_meters: parseFloat(radius)
                    });
                    if (error) throw error;
                    placesQuery = data;
                } else {
                    // Fetch all places
                    const { data, error } = await dbClient
                        .from('places')
                        .select('id, name, description, geom, avg_price_tier, google_place_id');
                    if (error) throw error;
                    // Map PostGIS point representation back to latitude/longitude
                    placesQuery = data.map(p => {
                        // geom format in REST could be GeoJSON or WKT. Supabase PostGIS usually returns standard GeoJSON point
                        const geom = p.geom;
                        let lat = 0, lng = 0;
                        if (geom && geom.coordinates) {
                            lng = geom.coordinates[0];
                            lat = geom.coordinates[1];
                        }
                        return {
                            id: p.id,
                            name: p.name,
                            description: p.description,
                            latitude: lat,
                            longitude: lng,
                            avg_price_tier: p.avg_price_tier,
                            google_place_id: p.google_place_id
                        };
                    });
                }

                // Hydrate tags for each place and filter
                const placesResult = [];
                for (const place of placesQuery) {
                    // Get tags with positive confidence scores
                    const { data: ptData, error: ptErr } = await dbClient
                        .from('place_tags')
                        .select('tag_id, confidence_score, tags(tag_name)')
                        .eq('place_id', place.id)
                        .gte('confidence_score', 0); // Hide negative confidence scores

                    if (ptErr) throw ptErr;

                    const placeTags = ptData.map(pt => ({
                        id: pt.tag_id,
                        name: pt.tags.tag_name,
                        confidence: pt.confidence_score
                    }));

                    place.tags = placeTags;

                    // Get average rating and reviews count
                    const { data: reviews, error: rErr } = await dbClient
                        .from('reviews')
                        .select('rating, created_at')
                        .eq('place_id', place.id);
                    
                    let avgRating = 4.0;
                    if (!rErr && reviews && reviews.length > 0) {
                        avgRating = calculateWeightedAverage(reviews);
                    }
                    place.avg_rating = avgRating;
                    place.reviews_count = reviews ? reviews.length : 0;
                    place.image_url = place.image_url || "";

                    // Apply filters
                    // 1. Tags filter (must contain all selected tags)
                    const matchesTags = tags.every(t => placeTags.some(pt => pt.name.toLowerCase() === t.toLowerCase()));
                    // 2. Price filter (must be less than or equal to maxPriceTier)
                    const matchesPrice = !maxPriceTier || (place.avg_price_tier && place.avg_price_tier <= maxPriceTier);

                    if (matchesTags && matchesPrice) {
                        placesResult.push(place);
                    }
                }
                return placesResult;
            } catch (err) {
                console.error("Supabase getPlaces error, falling back to mock:", err);
            }
        }

        // Mock DB implementation
        const db = readMockDb();
        let results = db.places.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            latitude: p.lat,
            longitude: p.lng,
            avg_price_tier: p.avg_price_tier,
            google_place_id: p.google_place_id,
            image_url: p.image_url || "",
            distance_meters: center ? haversineDistance(center.lat, center.lng, p.lat, p.lng) : null
        }));

        // Geofence filter
        if (center && center.lat && center.lng) {
            results = results.filter(p => p.distance_meters <= radius);
            results.sort((a, b) => a.distance_meters - b.distance_meters);
        }

        // Hydrate tags & ratings
        results = results.map(p => {
            const relTags = db.place_tags
                .filter(pt => pt.place_id === p.id && pt.confidence_score >= 0)
                .map(pt => {
                    const tagObj = db.tags.find(t => t.id === pt.tag_id);
                    return {
                        id: pt.tag_id,
                        name: tagObj ? tagObj.tag_name : '',
                        confidence: pt.confidence_score
                    };
                });
            const placeReviews = db.reviews.filter(r => r.place_id === p.id);
            const avgRating = placeReviews.length > 0 ? calculateWeightedAverage(placeReviews) : 4.0;
            return { ...p, tags: relTags, avg_rating: avgRating, reviews_count: placeReviews.length };
        });

        // Filter tags
        if (tags.length > 0) {
            results = results.filter(p => 
                tags.every(t => p.tags.some(pt => pt.name.toLowerCase() === t.toLowerCase()))
            );
        }

        // Filter price
        if (maxPriceTier !== null) {
            results = results.filter(p => p.avg_price_tier && p.avg_price_tier <= maxPriceTier);
        }

        return results;
    },

    // 2. Get Place Details
    getPlaceDetails: async (id) => {
        const placeId = parseInt(id);

        if (!useMock) {
            try {
                // Get place
                const { data: place, error: pErr } = await dbClient
                    .from('places')
                    .select('*')
                    .eq('id', placeId)
                    .single();
                if (pErr) throw pErr;

                // Map geom coordinates
                let lat = 0, lng = 0;
                if (place.geom && place.geom.coordinates) {
                    lng = place.geom.coordinates[0];
                    lat = place.geom.coordinates[1];
                }

                // Get tags including negative ones for scoring inside details
                const { data: ptData, error: ptErr } = await dbClient
                    .from('place_tags')
                    .select('tag_id, confidence_score, tags(tag_name)')
                    .eq('place_id', placeId);
                if (ptErr) throw ptErr;

                const tags = ptData.map(pt => ({
                    id: pt.tag_id,
                    name: pt.tags.tag_name,
                    confidence: pt.confidence_score
                }));

                // Get reviews
                const { data: reviews, error: rErr } = await dbClient
                    .from('reviews')
                    .select('id, rating, comment, created_at, profiles(username, campus_affiliation)')
                    .eq('place_id', placeId)
                    .order('created_at', { ascending: false });
                if (rErr) throw rErr;

                const reviewsFormatted = reviews.map(r => ({
                    id: r.id,
                    rating: r.rating,
                    comment: r.comment,
                    created_at: r.created_at,
                    username: r.profiles ? r.profiles.username : 'Anonymous',
                    campus: r.profiles ? r.profiles.campus_affiliation : ''
                }));

                const avgRating = calculateWeightedAverage(reviewsFormatted);

                return {
                    id: place.id,
                    name: place.name,
                    description: place.description,
                    latitude: lat,
                    longitude: lng,
                    avg_price_tier: place.avg_price_tier,
                    google_place_id: place.google_place_id,
                    tags,
                    reviews: reviewsFormatted,
                    avg_rating: avgRating
                };
            } catch (err) {
                console.error(`Supabase getPlaceDetails error for id ${placeId}, falling back to mock:`, err);
            }
        }

        // Mock DB implementation
        const db = readMockDb();
        const place = db.places.find(p => p.id === placeId);
        if (!place) return null;

        const tags = db.place_tags
            .filter(pt => pt.place_id === placeId)
            .map(pt => {
                const tagObj = db.tags.find(t => t.id === pt.tag_id);
                return {
                    id: pt.tag_id,
                    name: tagObj ? tagObj.tag_name : '',
                    confidence: pt.confidence_score
                };
            });

        const reviews = db.reviews
            .filter(r => r.place_id === placeId)
            .map(r => {
                const profileObj = db.profiles.find(prof => prof.id === r.user_id);
                return {
                    id: r.id,
                    rating: r.rating,
                    comment: r.comment,
                    created_at: r.created_at,
                    username: profileObj ? profileObj.username : (r.username || 'Anonymous'),
                    campus: profileObj ? profileObj.campus_affiliation : ''
                };
            })
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        const avgRating = calculateWeightedAverage(reviews);

        return {
            id: place.id,
            name: place.name,
            description: place.description,
            latitude: place.lat,
            longitude: place.lng,
            avg_price_tier: place.avg_price_tier,
            google_place_id: place.google_place_id,
            tags,
            reviews,
            avg_rating: avgRating
        };
    },

    // 3. Add Review
    addReview: async (reviewData) => {
        const { placeId, rating, comment, userId, username } = reviewData;

        if (!useMock) {
            try {
                const { data, error } = await dbClient
                    .from('reviews')
                    .insert({
                        place_id: parseInt(placeId),
                        user_id: userId,
                        rating: parseInt(rating),
                        comment: comment
                    })
                    .select();
                if (error) throw error;
                return data[0];
            } catch (err) {
                console.error("Supabase addReview error, falling back to mock:", err);
            }
        }

        // Mock DB implementation
        const db = readMockDb();
        const newReview = {
            id: db.reviews.length > 0 ? Math.max(...db.reviews.map(r => r.id)) + 1 : 1,
            place_id: parseInt(placeId),
            user_id: userId || "mock-session-id",
            username: username || "Guest",
            rating: parseInt(rating),
            comment: comment,
            created_at: new Date().toISOString()
        };

        db.reviews.push(newReview);
        writeMockDb(db);
        return newReview;
    },

    // 3b. Add Place (User-Contributed Spot)
    addPlace: async (placeData) => {
        const { name, description, latitude, longitude, avgPriceTier, tagName, imageUrl } = placeData;

        if (!useMock) {
            try {
                // Insert place using GeoJSON representation for PostGIS Point
                const { data: newPlace, error: pErr } = await dbClient
                    .from('places')
                    .insert({
                        name: name,
                        description: description,
                        geom: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
                        avg_price_tier: parseInt(avgPriceTier),
                        google_place_id: `ugc_spot_${Date.now()}`
                    })
                    .select();
                
                if (pErr) throw pErr;
                if (newPlace && newPlace.length > 0) {
                    const newId = newPlace[0].id;

                    // Look up tag_id by name
                    const { data: tagData, error: tLookupErr } = await dbClient
                        .from('tags')
                        .select('id')
                        .ilike('tag_name', tagName)
                        .single();

                    if (!tLookupErr && tagData) {
                        const tagId = tagData.id;
                        // Insert tag association with initial confidence 1
                        const { error: ptErr } = await dbClient
                            .from('place_tags')
                            .insert({
                                place_id: newId,
                                tag_id: tagId,
                                confidence_score: 1
                            });
                        if (ptErr) console.error("Error linking initial tag:", ptErr.message);
                    }

                    return {
                        id: newId,
                        name: newPlace[0].name,
                        description: newPlace[0].description,
                        latitude: parseFloat(latitude),
                        longitude: parseFloat(longitude),
                        avg_price_tier: newPlace[0].avg_price_tier,
                        google_place_id: newPlace[0].google_place_id,
                        image_url: "",
                        tags: []
                    };
                }
            } catch (err) {
                console.error("Supabase addPlace error, falling back to mock:", err);
            }
        }

        // Mock DB implementation
        const db = readMockDb();
        const newId = db.places.length > 0 ? Math.max(...db.places.map(p => p.id)) + 1 : 1;
        const newPlaceObj = {
            id: newId,
            name: name,
            description: description,
            lat: parseFloat(latitude),
            lng: parseFloat(longitude),
            avg_price_tier: parseInt(avgPriceTier),
            google_place_id: `ugc_spot_${Date.now()}`,
            image_url: imageUrl || ""
        };

        db.places.push(newPlaceObj);

        // Find and link tag if valid
        const tagObj = db.tags.find(t => t.tag_name.toLowerCase() === tagName.toLowerCase());
        if (tagObj) {
            db.place_tags.push({
                place_id: newId,
                tag_id: tagObj.id,
                confidence_score: 1
            });
        }

        writeMockDb(db);
        return {
            id: newId,
            name: name,
            description: description,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            avg_price_tier: parseInt(avgPriceTier),
            google_place_id: newPlaceObj.google_place_id,
            image_url: newPlaceObj.image_url,
            tags: tagObj ? [{ id: tagObj.id, name: tagObj.tag_name, confidence: 1 }] : []
        };
    },

    // 4. Upvote / Downvote Tag (Validation System)
    voteTag: async (voteData) => {
        const { placeId, tagId, vote, userId } = voteData; // vote is 'up' (+1) or 'down' (-1)
        const pId = parseInt(placeId);
        const tId = parseInt(tagId);
        const delta = vote === 'up' ? 1 : -1;

        if (!useMock) {
            try {
                // Check if relationship exists
                const { data: exists, error: checkErr } = await dbClient
                    .from('place_tags')
                    .select('*')
                    .eq('place_id', pId)
                    .eq('tag_id', tId);
                
                if (checkErr) throw checkErr;

                if (exists && exists.length > 0) {
                    // Update score
                    const newScore = (exists[0].confidence_score || 0) + delta;
                    const { data, error } = await dbClient
                        .from('place_tags')
                        .update({ confidence_score: newScore })
                        .eq('place_id', pId)
                        .eq('tag_id', tId)
                        .select();
                    if (error) throw error;
                    return data[0];
                } else {
                    // Insert new with initial score
                    const { data, error } = await dbClient
                        .from('place_tags')
                        .insert({
                            place_id: pId,
                            tag_id: tId,
                            confidence_score: delta
                        })
                        .select();
                    if (error) throw error;
                    return data[0];
                }
            } catch (err) {
                console.error("Supabase voteTag error, falling back to mock:", err);
            }
        }

        // Mock DB implementation
        const db = readMockDb();
        let pt = db.place_tags.find(item => item.place_id === pId && item.tag_id === tId);

        if (pt) {
            pt.confidence_score = (pt.confidence_score || 0) + delta;
        } else {
            pt = {
                place_id: pId,
                tag_id: tId,
                confidence_score: delta
            };
            db.place_tags.push(pt);
        }

        writeMockDb(db);
        return pt;
    },

    // 5. Auth Mock Handlers
    signUp: async (email, password, username, campusAffiliation) => {
        if (!useMock) {
            try {
                const { data, error } = await dbClient.auth.signUp({ email, password });
                if (error) throw error;

                if (data.user) {
                    // Create profile
                    const { error: pErr } = await dbClient
                        .from('profiles')
                        .insert({
                            id: data.user.id,
                            username: username,
                            campus_affiliation: campusAffiliation
                        });
                    if (pErr) throw pErr;
                    return { success: true, user: { id: data.user.id, email, username, campus: campusAffiliation } };
                }
            } catch (err) {
                return { success: false, error: err.message };
            }
        }

        // Mock Auth
        const db = readMockDb();
        const userExists = db.users.find(u => u.email === email);
        if (userExists) {
            return { success: false, error: "Email already registered." };
        }
        const usernameExists = db.profiles.find(p => p.username === username);
        if (usernameExists) {
            return { success: false, error: "Username already taken." };
        }

        const newId = `user-${Math.random().toString(36).substr(2, 9)}`;
        const newUser = { id: newId, email, password };
        const newProfile = {
            id: newId,
            username,
            campus_affiliation: campusAffiliation,
            created_at: new Date().toISOString()
        };

        db.users.push(newUser);
        db.profiles.push(newProfile);
        writeMockDb(db);

        return {
            success: true,
            user: { id: newId, email, username, campus: campusAffiliation }
        };
    },

    signIn: async (email, password) => {
        if (!useMock) {
            try {
                const { data, error } = await dbClient.auth.signInWithPassword({ email, password });
                if (error) throw error;

                if (data.user) {
                    // Load profile
                    const { data: profile, error: pErr } = await dbClient
                        .from('profiles')
                        .select('username, campus_affiliation')
                        .eq('id', data.user.id)
                        .single();
                    if (pErr) throw pErr;

                    return {
                        success: true,
                        session: {
                            token: data.session.access_token,
                            user: {
                                id: data.user.id,
                                email: data.user.email,
                                username: profile ? profile.username : 'Anonymous',
                                campus: profile ? profile.campus_affiliation : ''
                            }
                        }
                    };
                }
            } catch (err) {
                return { success: false, error: err.message };
            }
        }

        // Mock Auth
        const db = readMockDb();
        const user = db.users.find(u => u.email === email && u.password === password);
        if (!user) {
            return { success: false, error: "Invalid email or password." };
        }

        const profile = db.profiles.find(p => p.id === user.id);

        return {
            success: true,
            session: {
                token: `mock-jwt-token-for-${user.id}`,
                user: {
                    id: user.id,
                    email: user.email,
                    username: profile ? profile.username : 'Anonymous',
                    campus: profile ? profile.campus_affiliation : ''
                }
            }
        };
    },

    // 6. Save newly discovered places (Zero-Cost Cache Strategy)
    addCachedPlaces: async (placesList) => {
        if (!placesList || placesList.length === 0) return [];

        if (!useMock) {
            try {
                const insertedPlaces = [];
                for (const p of placesList) {
                    // Check if google_place_id already exists to prevent duplicate caches
                    const { data: existing, error: checkErr } = await dbClient
                        .from('places')
                        .select('id')
                        .eq('google_place_id', p.google_place_id);
                    
                    if (checkErr) throw checkErr;
                    if (existing && existing.length > 0) {
                        continue; // already cached
                    }

                    // Insert place using GeoJSON representation for PostGIS Point
                    const { data: newPlace, error: pErr } = await dbClient
                        .from('places')
                        .insert({
                            name: p.name,
                            description: p.description,
                            geom: { type: 'Point', coordinates: [parseFloat(p.longitude), parseFloat(p.latitude)] },
                            avg_price_tier: p.avg_price_tier,
                            google_place_id: p.google_place_id
                        })
                        .select();
                    
                    if (pErr) throw pErr;
                    if (newPlace && newPlace.length > 0) {
                        const newId = newPlace[0].id;
                        insertedPlaces.push({ ...p, id: newId });

                        // Add default tags with confidence score 1 (Good Wi-Fi and Many charging ports)
                        const defaultTagIds = [2, 3]; 
                        const tagInserts = defaultTagIds.map(tid => ({
                            place_id: newId,
                            tag_id: tid,
                            confidence_score: 1
                        }));
                        const { error: tErr } = await dbClient
                            .from('place_tags')
                            .insert(tagInserts);
                        if (tErr) console.error("Error adding default tags for place ID", newId, tErr.message);
                    }
                }
                return insertedPlaces;
            } catch (err) {
                console.error("Supabase addCachedPlaces error, falling back to mock:", err);
            }
        }

        // Mock DB implementation
        const db = readMockDb();
        const insertedPlaces = [];
        for (const p of placesList) {
            // Check if exists
            const existing = db.places.find(item => item.google_place_id === p.google_place_id);
            if (existing) continue;

            const newId = db.places.length > 0 ? Math.max(...db.places.map(item => item.id)) + 1 : 1;
            const newPlace = {
                id: newId,
                name: p.name,
                description: p.description,
                lat: p.latitude,
                lng: p.longitude,
                avg_price_tier: p.avg_price_tier,
                google_place_id: p.google_place_id
            };
            db.places.push(newPlace);
            insertedPlaces.push({ ...p, id: newId });

            // Add default tags (2: Good Wi-Fi, 3: Many charging ports)
            db.place_tags.push(
                { place_id: newId, tag_id: 2, confidence_score: 1 },
                { place_id: newId, tag_id: 3, confidence_score: 1 }
            );
        }
        writeMockDb(db);
        return insertedPlaces;
    },

    // 7. Verify JWT token and load profile
    verifyToken: async (token) => {
        if (!token) return null;

        if (!useMock) {
            try {
                // Verify JWT with Supabase Auth
                const { data: { user }, error } = await dbClient.auth.getUser(token);
                if (error || !user) return null;

                // Load profile to get username and campus
                const { data: profile, error: pErr } = await dbClient
                    .from('profiles')
                    .select('username, campus_affiliation')
                    .eq('id', user.id)
                    .single();
                
                return {
                    id: user.id,
                    email: user.email,
                    username: profile ? profile.username : 'Anonymous',
                    campus: profile ? profile.campus_affiliation : ''
                };
            } catch (err) {
                console.error("Supabase verifyToken error:", err);
                return null;
            }
        }

        // Mock DB implementation
        if (!token.startsWith('mock-jwt-token-for-')) return null;
        const userId = token.replace('mock-jwt-token-for-', '');

        const db = readMockDb();
        const user = db.users.find(u => u.id === userId);
        if (!user) return null;

        const profile = db.profiles.find(p => p.id === userId);
        return {
            id: userId,
            email: user.email,
            username: profile ? profile.username : 'Anonymous',
            campus: profile ? profile.campus_affiliation : ''
        };
    }
};

module.exports = DB;
