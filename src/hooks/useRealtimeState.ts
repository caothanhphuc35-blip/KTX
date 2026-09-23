import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, DutyItem, User, ActivityLog, WsMessage } from '../types';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
}

export function useRealtimeState(currentUser: User | null) {
  const [state, setState] = useState<AppState>({
    users: [],
    duties: [],
    roomInfo: {
      roomName: 'Phòng 408 - Tòa B3 KTX Sinh Viên',
      totalBeds: 4,
      cleanlinessScore: 98,
      rules: [],
    },
    activities: [],
  });

  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const pingIntervalRef = useRef<any>(null);

  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev.slice(-4), { id, type, title, message, timestamp: new Date() }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch initial state via REST
  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setState({
          users: data.users || [],
          duties: data.duties || [],
          roomInfo: data.roomInfo || state.roomInfo,
          activities: data.activities || [],
        });
        if (data.onlineCount) setOnlineCount(data.onlineCount);
        if (data.onlineUsers) setOnlineUsers(data.onlineUsers);
      }
    } catch (err) {
      console.error('Error fetching state:', err);
    }
  }, []);

  // Connect WebSocket
  const connectWs = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setIsConnecting(true);
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        // Send presence if logged in
        if (currentUser?.fullName) {
          ws.send(JSON.stringify({ type: 'SET_USER_PRESENCE', payload: { userName: currentUser.fullName } }));
        }

        // Heartbeat ping
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const msg: WsMessage = JSON.parse(event.data);
          handleIncomingMessage(msg);
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        // Reconnect after 2 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWs();
        }, 2000);
      };

      ws.onerror = (err) => {
        console.warn('WS error, fallback to REST:', err);
        ws.close();
      };
    } catch (err) {
      console.error('WS init error:', err);
      setIsConnecting(false);
      reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
    }
  }, [currentUser?.fullName]);

  // Handle incoming WebSocket messages
  const handleIncomingMessage = useCallback(
    (msg: any) => {
      switch (msg.type) {
        case 'STATE_SYNC': {
          setState({
            users: msg.payload.users,
            duties: msg.payload.duties,
            roomInfo: msg.payload.roomInfo,
            activities: msg.payload.activities,
          });
          if (msg.payload.onlineCount) setOnlineCount(msg.payload.onlineCount);
          if (msg.payload.onlineUsers) setOnlineUsers(msg.payload.onlineUsers);
          break;
        }
        case 'DUTY_ADDED': {
          const { duty, activity } = msg.payload;
          setState((prev) => {
            const exists = prev.duties.some((d) => d.id === duty.id || d.date === duty.date);
            const nextDuties = exists
              ? prev.duties.map((d) => (d.date === duty.date ? duty : d))
              : [...prev.duties, duty];
            return {
              ...prev,
              duties: nextDuties,
              activities: activity ? [...prev.activities.slice(-49), activity] : prev.activities,
            };
          });

          // Show real-time alert
          addToast(
            'success',
            'Cập nhật ca trực mới',
            `👤 ${duty.userName} vừa đăng ký trực nhật ngày ${duty.date}`
          );
          break;
        }
        case 'DUTY_REMOVED': {
          const { dutyId, date, activity } = msg.payload;
          setState((prev) => ({
            ...prev,
            duties: prev.duties.filter((d) => d.id !== dutyId && d.date !== date),
            activities: activity ? [...prev.activities.slice(-49), activity] : prev.activities,
          }));

          addToast(
            'warning',
            'Hủy lịch trực nhật',
            activity ? activity.userName + ' ' + activity.message : `Lịch trực ngày ${date} đã được hủy`
          );
          break;
        }
        case 'DUTY_UPDATED': {
          const { duty, activity } = msg.payload;
          setState((prev) => ({
            ...prev,
            duties: prev.duties.map((d) => (d.id === duty.id ? duty : d)),
            activities: activity ? [...prev.activities.slice(-49), activity] : prev.activities,
          }));

          if (duty.status === 'completed') {
            addToast(
              'success',
              'Hoàn thành trực nhật 🎉',
              `${duty.userName} đã hoàn thành ca trực ngày ${duty.date}!`
            );
          } else {
            addToast('info', 'Cập nhật trực nhật', `Ca trực ngày ${duty.date} đã được cập nhật`);
          }
          break;
        }
        case 'BATCH_DUTIES_UPDATED': {
          const { duties, activity } = msg.payload;
          setState((prev) => ({
            ...prev,
            duties,
            activities: activity ? [...prev.activities.slice(-49), activity] : prev.activities,
          }));
          addToast('success', 'Phân công tự động', activity?.message || 'Đã phân công lịch trực cả tháng!');
          break;
        }
        case 'USER_REGISTERED': {
          const { user, activity } = msg.payload;
          setState((prev) => ({
            ...prev,
            users: prev.users.some((u) => u.id === user.id) ? prev.users : [...prev.users, user],
            activities: activity ? [...prev.activities.slice(-49), activity] : prev.activities,
          }));
          addToast('info', 'Thành viên mới', `Chào mừng ${user.fullName} đã gia nhập phòng!`);
          break;
        }
        case 'PRESENCE_CHANGE': {
          if (msg.payload.onlineCount !== undefined) setOnlineCount(msg.payload.onlineCount);
          if (msg.payload.onlineUsers) setOnlineUsers(msg.payload.onlineUsers);
          break;
        }
        case 'ACTIVITY_LOG': {
          if (msg.payload.activity) {
            setState((prev) => ({
              ...prev,
              activities: [...prev.activities.slice(-49), msg.payload.activity],
            }));
          }
          break;
        }
      }
    },
    [addToast]
  );

  useEffect(() => {
    fetchState();
    connectWs();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWs, fetchState]);

  // Update presence when user logs in or out
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && currentUser?.fullName) {
      wsRef.current.send(
        JSON.stringify({
          type: 'SET_USER_PRESENCE',
          payload: { userName: currentUser.fullName },
        })
      );
    }
  }, [currentUser?.fullName]);

  // API Action methods with instant local feedback and server call
  const registerDuty = async (date: string, shift: 'all_day' | 'morning' | 'evening' = 'evening', tasks?: string[]) => {
    if (!currentUser) throw new Error('Vui lòng đăng nhập để đăng ký trực nhật.');

    const res = await fetch('/api/duties/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        userId: currentUser.id,
        shift,
        tasks,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Đăng ký ca trực thất bại.');
    }
    return data.duty;
  };

  const cancelDuty = async (date: string, dutyId?: string) => {
    if (!currentUser) throw new Error('Vui lòng đăng nhập để thao tác.');

    const res = await fetch('/api/duties/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        dutyId,
        userId: currentUser.id,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Hủy lịch trực thất bại.');
    }
    return true;
  };

  const manualAssignDuty = async (payload: {
    date: string;
    userId?: string;
    customName?: string;
    shift?: 'all_day' | 'morning' | 'evening';
    tasks?: string[];
    notes?: string;
  }) => {
    const res = await fetch('/api/duties/manual-assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Phân công ca trực thất bại.');
    }
    return data.duty;
  };

  const toggleDutyStatus = async (dutyId: string, newStatus: 'pending' | 'completed', note?: string) => {
    const res = await fetch(`/api/duties/${dutyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus,
        completedNote: note,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Cập nhật trạng thái thất bại.');
    }
    return data.duty;
  };

  const autoAssignMonth = async (year: number, month: number) => {
    const res = await fetch('/api/duties/auto-assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, month }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Tự động phân công thất bại.');
    }
    return data;
  };

  const resetData = async () => {
    const res = await fetch('/api/reset-data', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Khôi phục dữ liệu thất bại');
    return data;
  };

  return {
    state,
    isConnected,
    isConnecting,
    onlineCount,
    onlineUsers,
    toasts,
    removeToast,
    addToast,
    registerDuty,
    cancelDuty,
    manualAssignDuty,
    toggleDutyStatus,
    autoAssignMonth,
    resetData,
    refreshState: fetchState,
  };
}
