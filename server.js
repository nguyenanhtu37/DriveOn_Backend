import express from 'express';
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import managerRoutes from './routes/managerRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(express.json());

// connect to db
connectDB();

// routes
app.use('/api/auth', authRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manager', managerRoutes);

app.get('/', (req, res) => {
  res.send('Hello, DriveOn Backend!');
});

app.listen(PORT, () => {
  console.log(`Server is running at: http://localhost:${PORT}`);
});