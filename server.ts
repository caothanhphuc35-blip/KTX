import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();
app.use(express.json());

// Path to data file
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'dorm_data.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Generate dynamic initial duties for the current month
function getInitialData() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatD = (d: number) => `${year}-${pad(month + 1)}-${pad(d)}`;

  const users = [
    {
      id: 'u1',
      username: 'an_nguyen',
      password: '123',
      fullName: 'Nguyễn Văn An',
      roomNumber: 'Phòng I05 (Trưởng phòng)',
      avatarColor: 'bg-emerald-500',
      role: 'leader' as const,
      createdAt: new Date().toISOString(),
      dutiesLeft: 5,
    },
    {
      id: 'u2',
      username: 'duc_tran',
      password: '123',
      fullName: 'Trần Minh Đức',
      roomNumber: 'Phòng I05',
      avatarColor: 'bg-blue-500',
      role: 'member' as const,
      createdAt: new Date().toISOString(),
      dutiesLeft: 5,
    },
    {
      id: 'u3',
      username: 'nam_le',
      password: '123',
      fullName: 'Lê Hoàng Nam',
      roomNumber: 'Phòng I05',
      avatarColor: 'bg-amber-500',
      role: 'member' as const,
      createdAt: new Date().toISOString(),
      dutiesLeft: 5,
    },
    {
      id: 'u4',
      username: 'huy_pham',
      password: '123',
      fullName: 'Phạm Quốc Huy',
      roomNumber: 'Phòng I05',
      avatarColor: 'bg-purple-500',
      role: 'member' as const,
      createdAt: new Date().toISOString(),
      dutiesLeft: 5,
    },
  ];

  // Provide initial duties scattered in the current month
  const todayDate = now.getDate();
  const duties = [
    {
      id: 'd1',
      date: formatD(Math.max(1, todayDate - 2)),
      userId: 'u1',
      userName: 'Nguyễn Văn An',
      userAvatarColor: 'bg-emerald-500',
      shift: 'evening' as const,
      tasks: ['Quét & lau phòng', 'Đổ rác trước 22h', 'Cọ bồn rửa chén'],
      status: 'completed' as const,
      completedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      completedNote: 'Đã dọn sạch sẽ và thay túi rác mới.',
      registeredAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 'd2',
      date: formatD(Math.max(2, todayDate - 1)),
      userId: 'u2',
      userName: 'Trần Minh Đức',
      userAvatarColor: 'bg-blue-500',
      shift: 'all_day' as const,
      tasks: ['Quét phòng', 'Vệ sinh nhà tắm & WC', 'Đổ rác'],
      status: 'completed' as const,
      completedAt: new Date(Date.now() - 86400000).toISOString(),
      completedNote: 'Nhà vệ sinh đã cọ sạch, đã xịt phòng.',
      registeredAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'd3',
      date: formatD(todayDate),
      userId: 'u3',
      userName: 'Lê Hoàng Nam',
      userAvatarColor: 'bg-amber-500',
      shift: 'evening' as const,
      tasks: ['Quét phòng', 'Lau sàn bằng nước thơm', 'Đổ rác'],
      status: 'pending' as const,
      registeredAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'd4',
      date: formatD(todayDate + 1),
      userId: 'u4',
      userName: 'Phạm Quốc Huy',
      userAvatarColor: 'bg-purple-500',
      shift: 'all_day' as const,
      tasks: ['Tổng vệ sinh cuối tuần', 'Lau ban công', 'Đổ rác & cọ WC'],
      status: 'pending' as const,
      registeredAt: new Date().toISOString(),
    },
    {
      id: 'd5',
      date: formatD(todayDate + 3),
      userId: 'u1',
      userName: 'Nguyễn Văn An',
      userAvatarColor: 'bg-emerald-500',
      shift: 'morning' as const,
      tasks: ['Quét phòng buổi sáng', 'Thu dọn hành lang'],
      status: 'pending' as const,
      registeredAt: new Date().toISOString(),
    },
  ];

  return {
    users,
    duties,
    roomInfo: {
      roomName: 'Phòng I05 - Tòa B3 KTX Sinh Viên',
      totalBeds: 4,
      cleanlinessScore: 98,
      rules: [
        'Đổ rác trước 24h hàng ngày.',
        'Sáng và tối quét 1 lần.',
        'Nếu tối có chơi bài thì quét sau khi chơi.',
      ],
    },
    activities: [
      {
        id: 'act1',
        type: 'register' as const,
        userId: 'u4',
        userName: 'Phạm Quốc Huy',
        targetDate: formatD(todayDate + 1),
        message: 'đã đăng ký trực nhật ngày ' + formatD(todayDate + 1),
        timestamp: new Date().toISOString(),
      },
      {
        id: 'act2',
        type: 'complete' as const,
        userId: 'u2',
        userName: 'Trần Minh Đức',
        targetDate: formatD(todayDate - 1),
        message: 'đã hoàn thành trực nhật ngày ' + formatD(todayDate - 1),
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  };
}

// Load or seed database
function loadDb() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading db file, regenerating fallback:', err);
  }
  const initial = getInitialData();
  saveDb(initial);
  return initial;
}

function saveDb(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving db file:', err);
  }
}

let db = loadDb();

// Sanitized state for clients (without passwords)
function getSanitizedState() {
  return {
    users: db.users.map(({ password, ...u }: any) => u),
    duties: db.duties,
    roomInfo: db.roomInfo,
    activities: db.activities.slice(-30), // keep latest 30 activities
  };
}

// HTTP and WebSocket Server Setup
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Track client presence
interface ClientMeta {
  ws: WebSocket;
  userName?: string;
}
const clients = new Set<ClientMeta>();

function getOnlineUserNames(): string[] {
  const names = new Set<string>();
  for (const c of clients) {
    if (c.userName) names.add(c.userName);
  }
  return Array.from(names);
}

function broadcast(data: any) {
  const msg = JSON.stringify(data);
  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(msg);
      } catch (err) {
        console.error('Error sending WS message:', err);
      }
    }
  }
}

function broadcastPresence() {
  const onlineUsers = getOnlineUserNames();
  broadcast({
    type: 'PRESENCE_CHANGE',
    payload: {
      onlineCount: clients.size,
      onlineUsers,
    },
  });
}

// WebSocket Upgrade handler
server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', (ws) => {
  const clientMeta: ClientMeta = { ws };
  clients.add(clientMeta);

  // Send full state to newly connected client
  const state = getSanitizedState();
  ws.send(
    JSON.stringify({
      type: 'STATE_SYNC',
      payload: {
        ...state,
        onlineCount: clients.size,
        onlineUsers: getOnlineUserNames(),
      },
    })
  );

  broadcastPresence();

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'SET_USER_PRESENCE') {
        clientMeta.userName = data.payload?.userName;
        broadcastPresence();
      } else if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
      }
    } catch (err) {
      console.error('Error handling WS message:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(clientMeta);
    broadcastPresence();
  });

  ws.on('error', () => {
    clients.delete(clientMeta);
    broadcastPresence();
  });
});

// Helper to record activity
function addActivity(type: any, userId: string, userName: string, message: string, targetDate?: string) {
  const act = {
    id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    type,
    userId,
    userName,
    targetDate,
    message,
    timestamp: new Date().toISOString(),
  };
  db.activities.push(act);
  if (db.activities.length > 50) {
    db.activities = db.activities.slice(-50);
  }
  return act;
}

// ---------------- REST API ----------------

// Get application state
app.get('/api/state', (req, res) => {
  res.json({
    ...getSanitizedState(),
    onlineCount: clients.size,
    onlineUsers: getOnlineUserNames(),
  });
});

// User Registration
app.post('/api/auth/register', (req, res) => {
  const { username, password, fullName, roomNumber, avatarColor } = req.body;
  if (!username || !password || !fullName) {
    return res.status(400).json({ error: 'Vui lòng nhập đầy đủ tên đăng nhập, mật khẩu và họ tên.' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const existing = db.users.find((u: any) => u.username.toLowerCase() === cleanUsername);
  if (existing) {
    return res.status(400).json({ error: 'Tên đăng nhập này đã có người sử dụng. Vui lòng chọn tên khác.' });
  }

  const colors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-teal-500',
    'bg-cyan-500',
  ];
  const chosenColor = avatarColor || colors[db.users.length % colors.length];

  const newUser = {
    id: 'u_' + Date.now(),
    username: cleanUsername,
    password: password.trim(),
    fullName: fullName.trim(),
    roomNumber: roomNumber ? roomNumber.trim() : db.roomInfo.roomName,
    avatarColor: chosenColor,
    role: db.users.length === 0 ? ('leader' as const) : ('member' as const),
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  const act = addActivity('register', newUser.id, newUser.fullName, `đã tham gia danh sách thành viên phòng`);
  saveDb(db);

  const { password: _, ...sanitized } = newUser;

  // Broadcast user registered
  broadcast({
    type: 'USER_REGISTERED',
    payload: { user: sanitized, activity: act },
  });

  res.json({ success: true, user: sanitized });
});

// User Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const user = db.users.find((u: any) => u.username.toLowerCase() === cleanUsername);

  if (!user || user.password !== password.trim()) {
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
  }

  const { password: _, ...sanitized } = user;
  res.json({ success: true, user: sanitized });
});

// Change Password
app.post('/api/auth/change-password', (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  if (!userId || !oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin đổi mật khẩu.' });
  }

  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy tài khoản người dùng.' });
  }

  if (user.password !== oldPassword.trim()) {
    return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác.' });
  }

  if (newPassword.trim().length < 3) {
    return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 3 ký tự.' });
  }

  user.password = newPassword.trim();
  const act = addActivity('password_change', user.id, user.fullName, 'đã đổi mật khẩu tài khoản thành công');
  saveDb(db);

  broadcast({
    type: 'ACTIVITY_LOG',
    payload: { activity: act },
  });

  res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
});

// Register or Claim Duty for a Date
app.post('/api/duties/register', (req, res) => {
  const { date, userId, shift = 'evening', tasks } = req.body;
  if (!date || !userId) {
    return res.status(400).json({ error: 'Thiếu thông tin ngày hoặc người trực.' });
  }

  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Không tìm thấy thông tin thành viên.' });
  }

  // Check if someone is already assigned to this date
  const existingIndex = db.duties.findIndex((d: any) => d.date === date);
  if (existingIndex !== -1) {
    const existing = db.duties[existingIndex];
    if (existing.userId !== userId) {
      return res.status(400).json({
        error: `Ngày ${date} đã được ${existing.userName} đăng ký trực trước đó.`,
      });
    }
    // If it's the same user, return success
    return res.json({ success: true, duty: existing });
  }

  const defaultTasks = ['Đổ rác trước 24h', 'Sáng quét 1 lần', 'Tối quét 1 lần (sau khi chơi bài nếu có)'];


  const newDuty = {
    id: 'd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    date,
    userId: user.id,
    userName: user.fullName,
    userAvatarColor: user.avatarColor,
    shift: shift || 'evening',
    tasks: Array.isArray(tasks) && tasks.length > 0 ? tasks : defaultTasks,
    status: 'pending' as const,
    registeredAt: new Date().toISOString(),
  };

  db.duties.push(newDuty);
  const act = addActivity('register', user.id, user.fullName, `đã đăng ký trực nhật ngày ${date}`, date);
  saveDb(db);

  broadcast({
    type: 'DUTY_ADDED',
    payload: { duty: newDuty, activity: act },
  });

  res.json({ success: true, duty: newDuty });
});

// Cancel Duty (Hủy ca trực)
app.post('/api/duties/cancel', (req, res) => {
  const { date, userId, dutyId } = req.body;
  let targetIndex = -1;

  if (dutyId) {
    targetIndex = db.duties.findIndex((d: any) => d.id === dutyId);
  } else if (date) {
    targetIndex = db.duties.findIndex((d: any) => d.date === date);
  }

  if (targetIndex === -1) {
    return res.status(404).json({ error: 'Không tìm thấy ca trực cần hủy.' });
  }

  const duty = db.duties[targetIndex];
  const user = db.users.find((u: any) => u.id === userId);

  // Members can cancel their own duty, or leader can cancel any duty
  if (userId && duty.userId !== userId && user?.role !== 'leader') {
    return res.status(403).json({ error: 'Bạn chỉ có thể hủy ca trực của chính mình.' });
  }

  db.duties.splice(targetIndex, 1);
  const operatorName = user ? user.fullName : duty.userName;
  const act = addActivity('cancel', duty.userId, operatorName, `đã hủy đăng ký trực nhật ngày ${duty.date}`, duty.date);
  saveDb(db);

  broadcast({
    type: 'DUTY_REMOVED',
    payload: { dutyId: duty.id, date: duty.date, activity: act },
  });

  res.json({ success: true, message: 'Đã hủy lịch trực thành công.' });
});

// Manual Assign Duty (Tự điền phân công trực nhật)
app.post('/api/duties/manual-assign', (req, res) => {
  const { date, userId, customName, shift = 'evening', tasks, notes } = req.body;

  if (!date) {
    return res.status(400).json({ error: 'Vui lòng chọn ngày cần phân công.' });
  }

  let assignedUserName = customName?.trim();
  let assignedUserId = userId || 'custom_' + Date.now();
  let assignedColor = 'bg-teal-500';

  if (userId) {
    const user = db.users.find((u: any) => u.id === userId);
    if (user) {
      assignedUserName = user.fullName;
      assignedColor = user.avatarColor;
      assignedUserId = user.id;
    }
  }

  if (!assignedUserName) {
    return res.status(400).json({ error: 'Vui lòng chọn hoặc nhập tên người trực.' });
  }

  // Check if date exists, overwrite or create
  const existingIndex = db.duties.findIndex((d: any) => d.date === date);
  const defaultTasks = [
    'Quét và lau sàn phòng',
    'Đổ rác đúng giờ trước 22h',
    'Dọn bồn rửa & vệ sinh phòng',
  ];

  const dutyData = {
    id: existingIndex !== -1 ? db.duties[existingIndex].id : 'd_' + Date.now(),
    date,
    userId: assignedUserId,
    userName: assignedUserName,
    userAvatarColor: assignedColor,
    shift: shift || 'evening',
    tasks: Array.isArray(tasks) && tasks.length > 0 ? tasks : defaultTasks,
    status: 'pending' as const,
    completedNote: notes || '',
    registeredAt: new Date().toISOString(),
  };

  if (existingIndex !== -1) {
    db.duties[existingIndex] = dutyData;
  } else {
    db.duties.push(dutyData);
  }

  const act = addActivity('manual_assign', assignedUserId, assignedUserName, `đã được phân công trực nhật ngày ${date}`, date);
  saveDb(db);

  broadcast({
    type: existingIndex !== -1 ? 'DUTY_UPDATED' : 'DUTY_ADDED',
    payload: { duty: dutyData, activity: act },
  });

  res.json({ success: true, duty: dutyData });
});

// Update Duty Status (Đánh dấu đã hoàn thành / chưa hoàn thành / ghi chú)
app.patch('/api/duties/:id', (req, res) => {
  const { id } = req.params;
  const { status, completedNote, tasks } = req.body;

  const duty = db.duties.find((d: any) => d.id === id);
  if (!duty) {
    return res.status(404).json({ error: 'Không tìm thấy ca trực.' });
  }

  if (status !== undefined) {
    const user = db.users.find((u: any) => u.id === duty.userId);
    // If moving to completed from pending, decrement dutiesLeft
    if (status === 'completed' && duty.status !== 'completed') {
      if (user) {
        user.dutiesLeft = Math.max(0, (user.dutiesLeft || 5) - 1);
      }
    } 
    // If moving to pending from completed, increment dutiesLeft
    else if (status === 'pending' && duty.status === 'completed') {
      if (user) {
        user.dutiesLeft = (user.dutiesLeft || 0) + 1;
      }
    }

    duty.status = status;
    if (status === 'completed') {
      duty.completedAt = new Date().toISOString();
    } else {
      delete duty.completedAt;
    }
  }

  if (completedNote !== undefined) {
    duty.completedNote = completedNote;
  }

  if (Array.isArray(tasks)) {
    duty.tasks = tasks;
  }

  const actType = duty.status === 'completed' ? 'complete' : 'update';
  const actMsg =
    duty.status === 'completed'
      ? `đã xác nhận hoàn thành ca trực nhật ngày ${duty.date}`
      : `đã cập nhật trạng thái ca trực ngày ${duty.date}`;

  const act = addActivity(actType as any, duty.userId, duty.userName, actMsg, duty.date);
  saveDb(db);

  broadcast({
    type: 'DUTY_UPDATED',
    payload: { duty, activity: act },
  });

  res.json({ success: true, duty });
});

// Auto-assign remaining days of month evenly among dorm room members
app.post('/api/duties/auto-assign', (req, res) => {
  const { year, month } = req.body;
  if (db.users.length === 0) {
    return res.status(400).json({ error: 'Chưa có thành viên nào trong phòng để phân công.' });
  }

  const targetYear = Number(year) || new Date().getFullYear();
  const targetMonth = Number(month) !== undefined ? Number(month) : new Date().getMonth();

  // Total days in month
  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  // Count existing duty count per user to maintain fairness
  const userDutyCounts: Record<string, number> = {};
  db.users.forEach((u: any) => {
    userDutyCounts[u.id] = 0;
  });

  db.duties.forEach((d: any) => {
    if (userDutyCounts[d.userId] !== undefined) {
      userDutyCounts[d.userId]++;
    }
  });

  const assignedList: any[] = [];
  const defaultTasks = [
    'Quét & lau phòng sạch sẽ',
    'Đổ rác đúng giờ trước 22h',
    'Cọ rửa bồn rửa & vệ sinh chung',
  ];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${targetYear}-${pad(targetMonth + 1)}-${pad(day)}`;
    const alreadyAssigned = db.duties.some((d: any) => d.date === dateStr);

    if (!alreadyAssigned) {
      // Pick user with lowest duty count
      let chosenUser = db.users[0];
      let minCount = Infinity;
      for (const u of db.users) {
        const count = userDutyCounts[u.id] || 0;
        if (count < minCount) {
          minCount = count;
          chosenUser = u;
        }
      }

      const newDuty = {
        id: 'd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        date: dateStr,
        userId: chosenUser.id,
        userName: chosenUser.fullName,
        userAvatarColor: chosenUser.avatarColor,
        shift: 'evening' as const,
        tasks: defaultTasks,
        status: 'pending' as const,
        registeredAt: new Date().toISOString(),
      };

      db.duties.push(newDuty);
      userDutyCounts[chosenUser.id] = (userDutyCounts[chosenUser.id] || 0) + 1;
      assignedList.push(newDuty);
    }
  }

  const act = addActivity(
    'auto_assign',
    'system',
    'Hệ thống tự động',
    `đã tự động phân công ${assignedList.length} ca trực cho tháng ${targetMonth + 1}/${targetYear}`
  );

  saveDb(db);

  broadcast({
    type: 'BATCH_DUTIES_UPDATED',
    payload: { duties: db.duties, activity: act },
  });

  res.json({
    success: true,
    assignedCount: assignedList.length,
    totalDuties: db.duties.length,
  });
});

// Reset Sample Data
app.post('/api/reset-data', (req, res) => {
  db = getInitialData();
  saveDb(db);
  const act = addActivity('system' as any, 'sys', 'Hệ thống', 'đã khởi tạo lại dữ liệu mẫu ký túc xá');

  broadcast({
    type: 'STATE_SYNC',
    payload: {
      ...getSanitizedState(),
      onlineCount: clients.size,
      onlineUsers: getOnlineUserNames(),
    },
  });

  res.json({ success: true, message: 'Đã đặt lại dữ liệu mẫu thành công.' });
});

// Update Room Information
app.post('/api/room/update', (req, res) => {
  const { roomName, rules } = req.body;
  if (roomName) db.roomInfo.roomName = roomName;
  if (Array.isArray(rules)) db.roomInfo.rules = rules;
  saveDb(db);

  broadcast({
    type: 'STATE_SYNC',
    payload: {
      ...getSanitizedState(),
      onlineCount: clients.size,
      onlineUsers: getOnlineUserNames(),
    },
  });

  res.json({ success: true, roomInfo: db.roomInfo });
});

// Start server with Vite or Static
async function start() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Dormitory Duty App] Server running on port ${PORT} (dev: ${!isProd})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
