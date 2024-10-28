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
    // Check inventory from catalog service
    const catalogResponse = await axios.get(`http://catalog-service:3001/info/${req.params.item_number}`);
    const book = catalogResponse.data;
    //console.log("THis is book before editing :\t",book)

    if (book.quantity > 0) {
      // Mock order and reduce quantity
      
      
      //book.quantity=+book.quantity-1
      let qu=book.quantity-1
      

      //console.log("\nupdated book quantity is :",JSON.stringify(book)+"\n")
      //const data={...book,...book.quantity}
      const updated={...book,quantity:qu}
      //console.log(updated)
      await axios.patch(`http://catalog-service:3001/info/${req.params.item_number}`,updated)
      .then(response => {
        console.log('Data updated successfully:', response.data);
      }).catch(err => {
        console.error('Error updating the catalog:', err.message);
      });
      const logMessage = `Book purchased (ID: ${req.params.item_number}): ${book.title}, Remaining stock: ${book.quantity-1}`;
      logToFile(logMessage);
      console.log(logMessage);
      res.json({ message: `Book purchased: ${book.title}`, remainingStock: book.quantity-1});
      
      return;
    } 
    else {
      const logMessage = `Attempted to purchase book (ID: ${req.params.item_number}): Out of stock`;
      logToFile(logMessage);
      console.log(logMessage);
      res.status(400).json({ message: 'Book is out of stock' });
      
      return;
    }
  } 
  catch (error)
   {
    res.status(500).json({ message: 'Error purchasing book', error: error.message });
    return;
  }
});

app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
});