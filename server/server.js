import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'super_secret_jwt_key_at_least_256_bits_long_1234567890_abcdefghij';
const AES_SECRET_KEY = 'stable_secure_backend_aes_256_ky'; // exactly 32 bytes

// CORS policy: strictly allow only the Vite development server origin
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Rate Limiting: 25 requests per minute for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 25,
  message: { error: 'Too many requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/auth', authLimiter);

let db;

// Basic validation for username
// A-Z, a-z, 0-9, _, - and length 3-20
function isValidUsername(username) {
  if (!username || typeof username !== 'string') return false;
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 20) return false;
  
  const regex = /^[a-zA-Z0-9_-]+$/;
  return regex.test(trimmed);
}

app.post('/auth/check-username', async (req, res) => {
  try {
    const { username } = req.body;
    
    // Sanitize & Validate input
    if (!isValidUsername(username)) {
      return res.status(400).json({ error: 'Invalid username format' });
    }
    
    const sanitizedUsername = username.trim();
    
    // Parameterized query to prevent SQL Injection
    const user = await db.get('SELECT id, username FROM users WHERE username = ? COLLATE NOCASE', [sanitizedUsername]);
    
    if (user) {
      return res.status(200).json({ exists: true, username: user.username });
    } else {
      return res.status(404).json({ exists: false });
    }
  } catch (err) {
    console.error('Check username error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing registration details' });

    if (!isValidUsername(username)) {
      return res.status(400).json({ error: 'Invalid username' });
    }

    if (password.length < 8 || password.length > 50) {
      return res.status(400).json({ error: 'Password must be between 8 and 50 characters' });
    }

    const sanitizedUsername = username.trim();

    // Check if user already exists
    const existing = await db.get('SELECT id FROM users WHERE username = ? COLLATE NOCASE', [sanitizedUsername]);
    if (existing) {
      return res.status(400).json({ error: 'Username already taken. Please try another.' });
    }

    // Hash password with bcrypt cost 12
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Encrypt initial user data with AES-256
    const initialData = JSON.stringify({ registeredAt: Date.now() });
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(AES_SECRET_KEY, 'utf-8'), iv);
    
    let encryptedData = cipher.update(initialData, 'utf8', 'base64');
    encryptedData += cipher.final('base64');
    const authTag = cipher.getAuthTag().toString('base64');
    const ivBase64 = iv.toString('base64');
    
    const dbEncryptedString = JSON.stringify({ iv: ivBase64, data: encryptedData, tag: authTag });

    // Insert user safely mapped into the database using param queries
    const result = await db.run(
      'INSERT INTO users (username, password_hash, encrypted_data) VALUES (?, ?, ?)',
      [sanitizedUsername, passwordHash, dbEncryptedString]
    );

    // After success, instantly log them in using identically constructed JWT token logic 
    const token = jwt.sign({ id: result.lastID, username: sanitizedUsername }, JWT_SECRET, { expiresIn: '1h' });
      
    res.cookie('jwt', token, {
      httpOnly: true,
      maxAge: 3600000,
      secure: false,
      sameSite: 'lax'
    });

    return res.status(200).json({ success: true, message: 'Account created efficiently!' });

  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'Username already taken.' });
    }
    console.error('Registration internal tracking error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
    
    const sanitizedUsername = username.trim();
    const user = await db.get('SELECT * FROM users WHERE username = ? COLLATE NOCASE', [sanitizedUsername]);
    
    if (!user) {
      // Intentionally generic error
      return res.status(401).json({ error: 'Incorrect password. Try again.' }); 
    }

    // Check lockout
    if (user.lockout_time > Date.now()) {
      return res.status(401).json({ error: 'Too many attempts. Try again later.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (isValid) {
      // Reset attempts
      await db.run('UPDATE users SET failed_attempts = 0, lockout_time = 0 WHERE id = ?', [user.id]);
      
      // Issue a signed JWT token
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
      
      // Store JWT in an HttpOnly secure cookie
      res.cookie('jwt', token, {
        httpOnly: true,
        maxAge: 3600000, // 1 hour
        secure: false, // Requires HTTPS in production
        sameSite: 'lax'
      });

      return res.status(200).json({ success: true });
    } else {
      let attempts = user.failed_attempts + 1;
      let lockoutTime = 0;
      let msg = 'Incorrect password. Try again.';
      
      if (attempts >= 5) {
        lockoutTime = Date.now() + 15 * 60 * 1000; // 15 mins
        msg = 'Too many attempts. Try again later.';
      }
      
      await db.run('UPDATE users SET failed_attempts = ?, lockout_time = ? WHERE id = ?', [attempts, lockoutTime, user.id]);
      return res.status(401).json({ error: msg });
    }
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize database and start server
initDb().then(database => {
  db = database;
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
