const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const port = 5011;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
const mongo_url=process.env.mongo_url || 'mongodb+srv://sivasubramanian434:siva@cluster0.kbzrt.mongodb.net/generate-meme?retryWrites=true&w=majority&appName=Cluster0'
mongoose.connect(mongo_url,
    { useNewUrlParser: true, useUnifiedTopology: true }
);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// Schema Definitions
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const memeSchema = new mongoose.Schema({
  memeText: { type: String, required: true },
  imageUrl: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);
const Meme = mongoose.model('Meme', memeSchema);

const SECRET_KEY = 'your_jwt_secret_key';

// Routes
app.get('/', (req, res) => {
  res.send('Meme Generator API is running');
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/generate-meme', async (req, res) => {
  const { memeText, imageUrl } = req.body;

  if (!memeText || !imageUrl) {
    return res.status(400).json({ error: 'Meme text and image URL are required' });
  }

  try {
    const newMeme = new Meme({ memeText, imageUrl });
    await newMeme.save();

    res.json({ message: 'Meme created successfully', memeImageUrl: imageUrl });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/upload-image', async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Image URL is required' });
  }

  try {
    const newMeme = new Meme({ imageUrl });
    await newMeme.save();

    res.json({ message: 'Image uploaded successfully', imageUrl });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
