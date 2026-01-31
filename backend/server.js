const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = 5000;
const POD_NAME = os.hostname();

// PostgreSQL connection
const pool = new Pool({
    host: 'postgres-service',
    port: 5432,
    database: 'myapp',
    user: 'postgres',
    password: 'mypassword',
});

// Redis connection
const redisClient = redis.createClient({
    url: 'redis://redis-service:6379'
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Redis Connected'));

// Connect to Redis
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('❌ Could not connect to Redis:', err);
    }
})();

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection error:', err);
    } else {
        console.log('✅ Connected to PostgreSQL');
        release();
    }
});

// Create items table
const createTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS items (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    `;
    try {
        await pool.query(query);
        console.log('✅ Table created or already exists');
    } catch (err) {
        console.error('❌ Error creating table:', err);
    }
};
createTable();

// Middleware
app.use(cors());
app.use(express.json());

// Request counter middleware
app.use(async (req, res, next) => {
    try {
        await redisClient.incr('total_requests');
    } catch (err) {
        console.error('Redis error:', err);
    }
    next();
});

// Routes
app.get('/api/health', async (req, res) => {
    try {
        const dbResult = await pool.query('SELECT NOW()');
        const redisResult = await redisClient.ping();
        
        res.json({ 
            status: 'healthy',
            pod_name: POD_NAME,
            pod_ip: req.socket.localAddress,
            timestamp: new Date(),
            database: 'connected',
            redis: redisResult === 'PONG' ? 'connected' : 'disconnected',
            db_time: dbResult.rows[0].now
        });
    } catch (err) {
        res.status(500).json({ 
            status: 'unhealthy',
            pod_name: POD_NAME,
            error: err.message 
        });
    }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
    try {
        const totalRequests = await redisClient.get('total_requests') || 0;
        const itemCount = await pool.query('SELECT COUNT(*) FROM items');
        const cachedItems = await redisClient.get('cached_items_count') || 0;
        
        res.json({
            pod_name: POD_NAME,
            total_requests: parseInt(totalRequests),
            total_items: parseInt(itemCount.rows[0].count),
            cached_items: parseInt(cachedItems),
            timestamp: new Date()
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get items with Redis caching
app.get('/api/items', async (req, res) => {
    try {
        // Try to get from cache first
        const cached = await redisClient.get('items_list');
        
        if (cached) {
            console.log('📦 Returning cached items');
            return res.json({
                data: JSON.parse(cached),
                source: 'cache',
                pod_name: POD_NAME
            });
        }
        
        // If not in cache, get from database
        console.log('🔍 Fetching from database');
        const result = await pool.query('SELECT * FROM items ORDER BY created_at DESC');
        
        // Store in cache for 30 seconds
        await redisClient.setEx('items_list', 30, JSON.stringify(result.rows));
        await redisClient.set('cached_items_count', result.rows.length);
        
        res.json({
            data: result.rows,
            source: 'database',
            pod_name: POD_NAME
        });
    } catch (err) {
        res.status(500).json({ 
            error: err.message,
            pod_name: POD_NAME 
        });
    }
});

// Add item
app.post('/api/items', async (req, res) => {
    const { name, description } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO items (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        
        // Clear cache when new item is added
        await redisClient.del('items_list');
        console.log('🗑️  Cache cleared');
        
        res.json({
            data: result.rows[0],
            pod_name: POD_NAME
        });
    } catch (err) {
        res.status(500).json({ 
            error: err.message,
            pod_name: POD_NAME 
        });
    }
});

// Delete item
app.delete('/api/items/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM items WHERE id = $1', [req.params.id]);
        
        // Clear cache when item is deleted
        await redisClient.del('items_list');
        console.log('🗑️  Cache cleared');
        
        res.json({ 
            message: 'Item deleted',
            pod_name: POD_NAME
        });
    } catch (err) {
        res.status(500).json({ 
            error: err.message,
            pod_name: POD_NAME 
        });
    }
});

// CRASH ENDPOINT - For testing self-healing
app.post('/api/crash', (req, res) => {
    console.log('💥 CRASH REQUESTED - Pod will terminate in 2 seconds!');
    
    res.json({ 
        message: 'Pod crashing in 2 seconds...',
        pod_name: POD_NAME
    });
    
    // Crash after 2 seconds
    setTimeout(() => {
        console.log('💥💥💥 CRASHING NOW!');
        process.exit(1); // Exit with error code
    }, 2000);
});

// Clear cache endpoint
app.post('/api/cache/clear', async (req, res) => {
    try {
        await redisClient.del('items_list');
        res.json({ 
            message: 'Cache cleared',
            pod_name: POD_NAME
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📦 Pod name: ${POD_NAME}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('👋 Shutting down gracefully...');
    await redisClient.quit();
    await pool.end();
    process.exit(0);
});
