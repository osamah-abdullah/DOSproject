const express = require('express');
const axios = require('axios');
const fs = require('fs-extra');
const app = express();
const PORT = 3002;

function logToFile(message) {
  fs.appendFile('./logs.txt', message + '\n', (err) => {
    if (err) {
      console.error(`Failed to log message: ${err.message}`);
    }
  });
}

// Purchase book
app.post('/purchase/:item_number', async (req, res) => {
  try {
    // Check inventory from catalog service through Nginx
    const catalogResponse = await axios.get(`http://nginx/catalog/info/${req.params.item_number}`);
    const book = catalogResponse.data;

    if (book.quantity > 0) {
      // Decrease quantity by 1 and update catalog
      const updatedBook = { ...book, quantity: book.quantity - 1 };

      // Update quantity in the catalog service through Nginx
      await axios.patch(`http://nginx/catalog/info/${req.params.item_number}`, updatedBook)
        .then(response => {
          console.log('Data updated successfully:', response.data);
        })
        .catch(err => {
          console.error('Error updating the catalog:', err.message);
        });

      // Log and respond with success message
      const logMessage = `Book purchased (ID: ${req.params.item_number}): ${book.title}, Remaining stock: ${book.quantity - 1}`;
      logToFile(logMessage);
      console.log(logMessage);
      res.json({ message: `Book purchased: ${book.title}`, remainingStock: book.quantity - 1 });
    } else {
      // Out of stock response
      const logMessage = `Attempted to purchase book (ID: ${req.params.item_number}): Out of stock`;
      logToFile(logMessage);
      console.log(logMessage);
      res.status(400).json({ message: 'Book is out of stock' });
    }
  } catch (error) {
    console.error("Error during purchase:", error.message);
    res.status(500).json({ message: 'Error purchasing book', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
});
