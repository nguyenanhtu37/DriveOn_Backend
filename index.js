const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const app = express();

dotenv.config();
app.use(express.json());
const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

app.get('/', (req, res) => {
  res.send('Hello, DriveOn Backend!');
});
// DB connection
mongoose.set('strictQuery', false);
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {

    });
    console.log('MongoDB connection SUCCESS');
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
};
app.listen(new URL(baseUrl).port, () => {
  connectDB();
  console.log(`Server is running at ${baseUrl}`);
});
