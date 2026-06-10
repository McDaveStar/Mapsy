const express = require('express');
const cors = require('cors');
const path = require('path');
const DB = require('./db');
const { parseStudentQuery } = require('./queryParser');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend flexibility
app.use(cors());
app.use(express.json());

// 1. Serve frontend single-page application statically
app.use(express.static(path.join(__dirname, '../frontend')));

// Helper for https GET
const https = require('https');
function httpsGetJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Zero-Cost Cache Strategy: Fetch places from Google Places API and cache them
async function ensureGeospatialCache(center, radius = 5000) {
    if (!center || !center.lat || !center.lng) return;
    
    const lat = parseFloat(center.lat);
    const lng = parseFloat(center.lng);
    const rad = parseFloat(radius);
    
    // Check if we have any places in this area (within radius)
    const existingPlaces = await DB.getPlaces({
        center: { lat, lng },
        radius: rad
    });
    
    // If we already have places locally in this area, skip external API
    if (existingPlaces && existingPlaces.length > 0) {
        console.log(`ℹ️ [Zero-Cost Cache] Found ${existingPlaces.length} places locally. Skipping Google Places API.`);
        return;
    }
    
    console.log(`🔍 [Zero-Cost Cache] No local places near (${lat}, ${lng}) within ${rad}m. Querying Google Places API...`);
    
    const key = process.env.GOOGLE_PLACES_API_KEY;
    let externalPlaces = [];
    
    if (key && key !== 'your-google-places-key') {
        try {
            // Google Places API Nearby Search (seeking cafes/spots)
            const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${rad}&type=cafe&key=${key}`;
            const data = await httpsGetJSON(url);
            
            if (data.results && data.results.length > 0) {
                externalPlaces = data.results.slice(0, 5).map(item => ({
                    name: item.name,
                    description: item.vicinity ? `Tempat asik di ${item.vicinity}` : `Tempat asik dekat ${item.name}`,
                    latitude: item.geometry.location.lat,
                    longitude: item.geometry.location.lng,
                    avg_price_tier: item.price_level !== undefined ? Math.min(Math.max(item.price_level, 1), 4) : 2,
                    google_place_id: item.place_id
                }));
                console.log(`✅ Fetched ${externalPlaces.length} real places from Google Places API.`);
            }
        } catch (err) {
            console.error("⚠️ Google Places API request failed, falling back to simulation:", err.message);
        }
    }
    
    // Fallback simulation if key is missing or request failed
    if (externalPlaces.length === 0) {
        console.log("ℹ️ Simulating Google Places API response (generating spots)...");
        externalPlaces = [
            {
                name: "Aesthetic Study Hub",
                description: "Kafe modern dengan interior aesthetic, workspace luas, dan atmosphere tenang.",
                latitude: lat + 0.0015,
                longitude: lng - 0.0012,
                avg_price_tier: 2,
                google_place_id: `gplace_mock_${Date.now()}_1`
            },
            {
                name: "Warmindo & Coworking Rakyat",
                description: "Warmindo 24 jam murah meriah, banyak colokan, wifi super kencang.",
                latitude: lat - 0.0008,
                longitude: lng + 0.0019,
                avg_price_tier: 1,
                google_place_id: `gplace_mock_${Date.now()}_2`
            },
            {
                name: "Ganesha Printing & Library",
                description: "Tempat print dokumen, fotokopi, lengkap dengan perpustakaan mini dan area baca.",
                latitude: lat + 0.0022,
                longitude: lng + 0.0005,
                avg_price_tier: 1,
                google_place_id: `gplace_mock_${Date.now()}_3`
            }
        ];
    }
    
    const cached = await DB.addCachedPlaces(externalPlaces);
    console.log(`💾 Cached ${cached.length} new places to the database.`);
}

// Authentication guard middleware
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: "Authentication required. Please login." });
        }

        const token = authHeader.split(' ')[1];
        const user = await DB.verifyToken(token);
        
        if (!user) {
            return res.status(401).json({ success: false, error: "Invalid or expired token." });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("Auth middleware error:", err);
        res.status(500).json({ success: false, error: "Auth verification failed." });
    }
};

// 2. API Endpoints

// Search endpoint using "Smart Search by Situation" query parser
app.post('/api/search', async (req, res) => {
    try {
        const { query = "", center, radius, maxPriceTier } = req.body;
        
        // Parse the user's natural query
        const parsed = parseStudentQuery(query);
        
        // Combine parsed parameters with explicit overrides if provided
        const finalTags = parsed.tags;
        const finalPriceTier = maxPriceTier !== undefined ? maxPriceTier : parsed.maxPriceTier;
        
        console.log(`🔍 Query: "${query}" | Parsed Tags: [${finalTags.join(', ')}] | Price Tier: ${finalPriceTier}`);

        // Run caching check first
        if (center && center.lat && center.lng) {
            await ensureGeospatialCache(center, radius || 5000);
        }

        // Fetch places matching the filters
        const places = await DB.getPlaces({
            tags: finalTags,
            maxPriceTier: finalPriceTier,
            center,
            radius: radius || 5000 // default 5km radius
        });

        res.json({
            success: true,
            query,
            parsed: {
                tags: finalTags,
                maxPriceTier: finalPriceTier
            },
            places
        });
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Fetch all places, with optional parameters
app.get('/api/places', async (req, res) => {
    try {
        const { lat, lng, radius, tags, price } = req.query;
        
        let center = null;
        if (lat && lng) {
            center = { lat: parseFloat(lat), lng: parseFloat(lng) };
            await ensureGeospatialCache(center, radius ? parseFloat(radius) : 5000);
        }

        const tagList = tags ? tags.split(',') : [];
        const priceTier = price ? parseInt(price) : null;

        const places = await DB.getPlaces({
            tags: tagList,
            maxPriceTier: priceTier,
            center,
            radius: radius ? parseFloat(radius) : 5000
        });

        res.json({ success: true, places });
    } catch (err) {
        console.error("Get places error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Add a new place (authenticated user-generated content)
app.post('/api/places', requireAuth, async (req, res) => {
    try {
        const { name, description, latitude, longitude, avgPriceTier, tagName } = req.body;

        if (!name || !description || latitude === undefined || longitude === undefined || !avgPriceTier) {
            return res.status(400).json({ success: false, error: "Missing required fields." });
        }

        const newPlace = await DB.addPlace({
            name,
            description,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            avgPriceTier: parseInt(avgPriceTier),
            tagName: tagName || ""
        });

        res.status(201).json({ success: true, place: newPlace });
    } catch (err) {
        console.error("Add place API error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Fetch place details (with reviews and tag confidence scores)
app.get('/api/places/:id', async (req, res) => {
    try {
        const details = await DB.getPlaceDetails(req.params.id);
        if (!details) {
            return res.status(404).json({ success: false, error: "Place not found" });
        }
        res.json({ success: true, place: details });
    } catch (err) {
        console.error("Get details error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Post a review (with auth validation)
app.post('/api/places/:id/reviews', requireAuth, async (req, res) => {
    try {
        const placeId = req.params.id;
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, error: "Rating must be between 1 and 5." });
        }

        const newReview = await DB.addReview({
            placeId,
            rating,
            comment,
            userId: req.user.id,
            username: req.user.username
        });

        res.status(201).json({ success: true, review: newReview });
    } catch (err) {
        console.error("Add review error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Vote (Upvote/Downvote) on a Tag's confidence score
app.post('/api/places/:id/tags/:tagId/vote', requireAuth, async (req, res) => {
    try {
        const placeId = req.params.id;
        const tagId = req.params.tagId;
        const { vote } = req.body; // 'up' or 'down'

        if (vote !== 'up' && vote !== 'down') {
            return res.status(400).json({ success: false, error: "Vote must be 'up' or 'down'." });
        }

        const updatedVote = await DB.voteTag({
            placeId,
            tagId,
            vote,
            userId: req.user.id
        });

        res.json({ success: true, data: updatedVote });
    } catch (err) {
        console.error("Vote tag error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Auth Route: Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, username, campus } = req.body;
        if (!email || !password || !username) {
            return res.status(400).json({ success: false, error: "Missing required fields." });
        }

        const result = await DB.signUp(email, password, username, campus);
        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(201).json(result);
    } catch (err) {
        console.error("Auth register error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Auth Route: Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, error: "Email and password are required." });
        }

        const result = await DB.signIn(email, password);
        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (err) {
        console.error("Auth login error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Start listening
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`=======================================================`);
        console.log(`🌐 Mapsy API & Web Client serving on port ${PORT}`);
        console.log(`🔗 Access the web app at: http://localhost:${PORT}`);
        console.log(`📦 Database Mode: ${DB.isMock() ? 'LOCAL MOCK DB' : 'LIVE SUPABASE'}`);
        console.log(`=======================================================`);
    });
}

module.exports = app;
