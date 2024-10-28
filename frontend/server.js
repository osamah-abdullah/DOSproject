const express = require('express');
const axios = require('axios');
const fs = require('fs-extra');
const app = express();
const PORT = 3000;

function logToFile(message) {
  fs.appendFile('./logs.txt', message + '\n', (err) => {
      if (err) {
          console.error(`Failed to log message: ${err.message}`);
      }
  });
}
// Search books by topic
app.get('/search/:topic', async (req, res) => {
  try {
    const response = await axios.get(`http://catalog-service:3001/search/${req.params.topic}`);
    res.json(response.data);
    const logMessage = `Frontend search for topic '${req.params.topic}' returned: ${JSON.stringify(response.data)}`;
logToFile(logMessage);
console.log(logMessage);

  } catch (error) {
    res.status(500).json({ message: 'Error searching books by topic', error: error.message });
  }
});

// Get book info by item number
app.get('/info/:item_number', async (req, res) => {
  try {
    const response = await axios.get(`http://catalog-service:3001/info/${req.params.item_number}`);
    res.json(response.data);
    const logMessage = `Frontend info for item number ${req.params.item_number}: ${JSON.stringify(response.data)}`;
logToFile(logMessage);
console.log(logMessage);

  } catch (error) {
    res.status(500).json({ message: 'Error getting book info', error: error.message });
  }
});

// Purchase a book
app.post('/purchase/:item_number', async (req, res) => {
  try {
    const response = await axios.post(`http://order-service:3002/purchase/${req.params.item_number}`);
    res.json(response.data);
    const logMessage = `Frontend request to purchase item number ${req.params.item_number}: ${JSON.stringify(response.data)}`;
logToFile(logMessage);
console.log(logMessage);
  } catch (error) {
    res.status(500).json({ message: 'Error purchasing book', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Frontend service running on port ${PORT}`);
});
