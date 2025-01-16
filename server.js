const express = require('express');
const connectDB = require('./db');

const app = express();
const PORT = 5000;

app.use(express.json());

connectDB();

app.get('/', (req, res) => {
  res.send('Hello, DriveOn Backend!');
});

app.listen(PORT, () => {
  console.log(`Server is running at: http://localhost:${PORT}`);
});