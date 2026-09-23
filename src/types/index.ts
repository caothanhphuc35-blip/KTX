export interface User {
  id: string;
  username: string;
  fullName: string;
  roomNumber: string;
  avatarColor: string;
  phone?: string;
  role: 'member' | 'leader'; // Trưởng phòng hoặc Thành viên
  createdAt: string;
  dutiesLeft: number;
}

export interface DutyItem {
  id: string;
  date: string; // YYYY-MM-DD
  userId: string;
  userName: string;
  userAvatarColor: string;
  shift: 'all_day' | 'morning' | 'evening'; // Cả ngày, Ca sáng, Ca tối
  tasks: string[]; // Các việc cần làm: Quét phòng, Lau sàn, Đổ rác, Cọ WC, Rửa bồn rửa
  status: 'pending' | 'completed';
  completedAt?: string;
  completedNote?: string;
  registeredAt: string;
}

export interface ActivityLog {
  id: string;
  type: 'register' | 'cancel' | 'complete' | 'auto_assign' | 'manual_assign' | 'password_change';
  userId: string;
  userName: string;
  targetDate?: string;
  message: string;
  timestamp: string;
}

export interface RoomInfo {
  roomName: string; // Ví dụ: "Phòng 408 - Nhà B3 Ký Túc Xá"
  totalBeds: number;
  cleanlinessScore: number; // 98/100 Điểm vệ sinh thi đua
  rules: string[];
}

export interface AppState {
  users: User[];
  duties: DutyItem[];
  roomInfo: RoomInfo;
  activities: ActivityLog[];
}

export type WsMessage =
  | { type: 'STATE_SYNC'; payload: AppState & { onlineCount: number; onlineUsers: string[] } }
  | { type: 'DUTY_ADDED'; payload: { duty: DutyItem; activity: ActivityLog } }
  | { type: 'DUTY_REMOVED'; payload: { dutyId: string; date: string; activity: ActivityLog } }
  | { type: 'DUTY_UPDATED'; payload: { duty: DutyItem; activity: ActivityLog } }
  | { type: 'BATCH_DUTIES_UPDATED'; payload: { duties: DutyItem[]; activity: ActivityLog } }
  | { type: 'USER_REGISTERED'; payload: { user: User; activity: ActivityLog } }
  | { type: 'PRESENCE_CHANGE'; payload: { onlineCount: number; onlineUsers: string[] } }
  | { type: 'USER_PRESENCE'; payload: { userName: string } };
