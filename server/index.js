// index.js
const express   = require('express');
const cors      = require('cors');
const http      = require('http');
const WebSocket = require('ws');
const jwt       = require('jsonwebtoken');
const bcrypt    = require('bcrypt');
const mongoose  = require('mongoose');

// -----------------------------
// 1) Настройки
// -----------------------------
const JWT_SECRET = 'your-very-secure-secret';
const MONGO_URI  = 'mongodb://localhost:27017/realtime-map';

// -----------------------------
// 2) Подключение к MongoDB
// -----------------------------
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error', err));

// -----------------------------
// 3) Схемы Mongoose
// -----------------------------
const userSchema = new mongoose.Schema({
  email:        { type: String, unique: true },
  passwordHash: String,
  friends:      [mongoose.Schema.Types.ObjectId],
  lastLocation: { lat: Number, lon: Number, ts: Number },
  customText:   { type: String, default: 'Number', required: true }
});
const User = mongoose.model('User', userSchema);

// -----------------------------
// 4) HTTP-сервер и маршруты
// -----------------------------
const app = express();
app.use(cors());
app.use(express.json());

// Регистрация с обязательным полем customText
app.post('/auth/register', async (req, res) => {
  const { email, password, customText } = req.body;
  if (!customText) return res.status(400).json({ error: 'customText is required' });
  const hash = await bcrypt.hash(password, 10);
  try {
    await User.create({ email, passwordHash: hash, friends: [], customText });
    res.status(201).json({ message: 'Registered' });
  } catch {
    res.status(400).json({ error: 'User already exists' });
  }
});

// Логин
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

// Профиль: GET и PATCH customText
app.get('/users/me', async (req, res) => {
  const auth = req.headers.authorization?.split(' ')[1];
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { userId } = jwt.verify(auth, JWT_SECRET);
    const user = await User.findById(userId, 'email customText').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.patch('/users/me', async (req, res) => {
  const auth = req.headers.authorization?.split(' ')[1];
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { userId } = jwt.verify(auth, JWT_SECRET);
    const { customText } = req.body;
    if (!customText) return res.status(400).json({ error: 'customText is required' });
    await User.findByIdAndUpdate(userId, { customText });
    res.json({ message: 'Profile updated' });
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// ВСЕ пользователи (кроме себя) — «друзья»
app.get('/users/me/friends/locations', async (req, res) => {
  const auth = req.headers.authorization?.split(' ')[1];
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const { userId } = jwt.verify(auth, JWT_SECRET);
    // Берём всех, кроме себя
    const users = await User.find(
      { _id: { $ne: userId } },
      'email lastLocation customText'
    ).lean();

    res.json(users.map(u => ({
      uiId:       u._id,
      email:      u.email,
      customText: u.customText || 'Number',
      lat:        u.lastLocation?.lat,
      lon:        u.lastLocation?.lon,
      ts:         u.lastLocation?.ts
    })));
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// -----------------------------
// 5) Запуск HTTP
// -----------------------------
const server = http.createServer(app);
server.listen(3000, () => console.log('HTTP on http://localhost:3000'));

// -----------------------------
// 6) WebSocket
// -----------------------------
const wss = new WebSocket.Server({ server });
const clients = new Map();

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.split('?')[1] || '');
  try {
    const { userId } = jwt.verify(params.get('token') || '', JWT_SECRET);
    if (!clients.has(userId)) clients.set(userId, new Set());
    clients.get(userId).add(ws);
    ws.userId = userId;
  } catch {
    return ws.close();
  }

ws.on('message', async message => {
  const msg = JSON.parse(message);
  if (msg.type === 'location') {
    const { lat, lon, ts } = msg;
    // Сохраняем своё местоположение
    await User.findByIdAndUpdate(ws.userId, { lastLocation: { lat, lon, ts } });

    // Достаем свой customText
    const me = await User.findById(ws.userId, 'customText').lean();
    const text = me.customText || 'Number';

    // Рассылаем ВСЕМ, кроме себя
    for (const [otherId, sockets] of clients.entries()) {
      if (otherId === ws.userId) continue;
      const payload = JSON.stringify({
        type:       'friendLocation',
        uiId:        ws.userId,
        lat, lon, ts,
        customText:  text
      });
      sockets.forEach(s => s.send(payload));
    }
  }
});

  ws.on('close', () => {
    const set = clients.get(ws.userId);
    if (set) set.delete(ws);
  });
});
