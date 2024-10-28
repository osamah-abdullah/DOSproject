const express = require('express');
const fs = require('fs-extra');
const app = express();
const PORT = 3001;
const DATA_FILE = './books.json';
app.use(express.json());
// Load book data
async function loadData() {
    try {
        return await fs.readJson(DATA_FILE);
      } catch (err) {
        throw new Error(`Failed to load data: ${err.message}`);
      }
}
async function storeData(data) {
  try {
      await fs.writeJson(DATA_FILE, data, { spaces: 2 });
  } catch (err) {
      throw new Error(`Failed to store data: ${err.message}`);
  }
}
function logToFile(message) {
  fs.appendFile('./logs.txt', message + '\n', (err) => {
      if (err) {
          console.error(`Failed to log message: ${err.message}`);
      }
  });
}
//
app.get('/info', async (req, res) => {
    const books = await loadData();
    res.json(books)
    console.log(books)
  });

// Search books by topic
app.get('/search/:topic', async (req, res) => {
  const books = await loadData();
  const result = books.filter(book => book.topic === req.params.topic);
  const logMessage = `Search for topic '${req.params.topic}' returned: ${JSON.stringify(result)}`;
logToFile(logMessage);
console.log(logMessage);

  res.json(result);
  //console.log(result)
});

// Get book info by item number
app.get('/info/:item_number', async (req, res) => {
  const books = await loadData();
  const book = books.find(book => book.id === parseInt(req.params.item_number));
  book ? res.json(book) : res.status(404).json({ message: 'Book not found' });
  //book ? console.log(book) :console.log({ message: 'Book not found' });
  const logMessage = `Info requested for item number ${req.params.item_number}: ${book ? JSON.stringify(book) : 'Book not found'}`;
logToFile(logMessage);
console.log(logMessage);

});
app.patch('/info/:item_number',async (req,res)=>{
  let books = await loadData();
  const id=+req.params.item_number
  let book=books.find((book)=>{
      return book.id===id
 })
 
 //console.log("this is req body :\t",req.body,"\t\t\t\n")
 if(!book){
  return res.status(404).json({message:"Book not found"})
 }
 
 const price = +req.body.price;
 //console.log(price);
 const quantity=+req.body.quantity
 if (req.body.price !== undefined) {
    const price = +req.body.price;
    if (!isNaN(price)) book.price = price; // Update price if it's a valid number
  }
  
  if (req.body.quantity !== undefined) {
    const quantity = +req.body.quantity;
    if (!isNaN(quantity)) book.quantity = quantity; // Update quantity if it's a valid number
  }s
 //book={...book,...req.body}
 //console.log(req.body)
 //console.log(book)
 let newbooks = books.map(item => 
  item.id === id? book : item
);
await storeData(newbooks)
res.json(book)
//const b=await loadData(DATA_FILE)
//console.log(b)
})


app.listen(PORT, () => {
  console.log(`Catalog service running on port ${PORT}`);
});