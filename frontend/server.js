const express = require('express');
const axios = require('axios');
const redis = require('redis');
const fs = require('fs-extra');
const app = express();
const PORT = 3000;

const redisClient = redis.createClient({ url: 'redis://redis:6379' });
redisClient.connect()
  .then(() => console.log("Connected to Redis"))
  .catch((err) => console.error("Redis connection error", err));

// Middleware to log requests (optional for debugging)
function logToFile(message) {
  fs.appendFile('./logs.txt', message + '\n', (err) => {
    if (err) {
      console.error(`Failed to log message: ${err.message}`);
    }
  });
}

// Search books by topic with caching
app.get('/search/:topic', async (req, res) => {
  const topic = req.params.topic;
  const cacheKey = `search:${topic}`;
  
  // Check if data is in cache
  const cachedData = await redisClient.get(cacheKey);
  if (cachedData) {
    const logMessage = "Serving from cache";
    logToFile(logMessage);
    console.log(logMessage);
    return res.json(JSON.parse(cachedData));
  }

  // Fetch from catalog if not cached
  try {
    const response = await axios.get(`http://nginx/catalog/search/${topic}`);
    const data = response.data;
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(data)); // Cache for 1 hour
    const logMessage = `Search for topic '${req.params.topic}' returned: ${JSON.stringify(result)}`;
    logToFile(logMessage);
    console.log(logMessage);
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data', error: error.message });
  }
});

// Get book info by item number with caching
app.get('/info/:item_number', async (req, res) => {
  const itemNumber = req.params.item_number;
  const cacheKey = `info:${itemNumber}`;

  // Check if data is in cache
  const cachedData = await redisClient.get(cacheKey);
  if (cachedData) {
    console.log("Serving from cache");
    return res.json(JSON.parse(cachedData));
  }

  // Fetch from catalog if not cached
  try {
    const response = await axios.get(`http://nginx/catalog/info/${itemNumber}`);
    const data = response.data;
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(data));
    const logMessage = `Info requested for item number ${req.params.item_number}: ${book ? JSON.stringify(book) : 'Book not found'}`;
    logToFile(logMessage);
    console.log(logMessage);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching data', error: error.message });
  }
});

// Purchase book with cache invalidation
app.post('/purchase/:item_number', async (req, res) => {
  const itemNumber = req.params.item_number;
  const cacheKey = `info:${itemNumber}`;

  try {
    const response = await axios.post(`http://nginx/order/purchase/${itemNumber}`);
    
    // Invalidate cache
    await redisClient.del(cacheKey);
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ message: 'Error purchasing book', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Frontend service running on port ${PORT}`);
});
