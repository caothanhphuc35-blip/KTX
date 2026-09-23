/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from './types';
import { useRealtimeState } from './hooks/useRealtimeState';
import { Navbar } from './components/Navbar';
import { DutyCalendar } from './components/DutyCalendar';
import { DutyListTable } from './components/DutyListTable';
import { EqualityStats } from './components/EqualityStats';
import { RoomRules } from './components/RoomRules';
import { AuthModal } from './components/AuthModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { ManualAssignModal } from './components/ManualAssignModal';
import { ToastContainer } from './components/ToastContainer';
import {
  Calendar,
  ClipboardList,
  BarChart3,
  BookOpen,
  Activity,
  Sparkles,
  RefreshCw,
  Zap,
  CheckCircle2,
  Clock,
  Shield,
} from 'lucide-react';

export default function App() {
  // Current logged in user stored in localStorage
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('dorm_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'calendar' | 'table' | 'stats' | 'rules'>('calendar');

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isManualAssignOpen, setIsManualAssignOpen] = useState(false);

  // Real-time synchronization hook
  const {
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
    refreshState,
  } = useRealtimeState(currentUser);

  // Save current user to localStorage
  const handleUserLogin = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('dorm_user', JSON.stringify(user));
    } catch (err) {
      console.error(err);
    }
    addToast('success', 'Đăng nhập thành công', `Chào mừng ${user.fullName} đã vào hệ thống!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('dorm_user');
    } catch (err) {
      console.error(err);
    }
    addToast('info', 'Đăng xuất', 'Bạn đã đăng xuất khỏi tài khoản.');
  };

  // If user is not yet logged in on first visit, select the first user automatically or prompt login
  useEffect(() => {
    if (!currentUser && state.users.length > 0) {
      // If no user is in localStorage, pre-select the first user (An) for immediate zero-barrier interaction
      const defaultUser = state.users[0];
      setCurrentUser(defaultUser);
      try {
        localStorage.setItem('dorm_user', JSON.stringify(defaultUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, [state.users]);

  const handleAutoAssign = async (year: number, month: number) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    if (
      window.confirm(
        `Bạn có muốn tự động phân công đều các ngày còn trống trong tháng ${month + 1}/${year} cho tất cả thành viên trong phòng?`
      )
    ) {
      try {
        await autoAssignMonth(year, month);
      } catch (err: any) {
        addToast('error', 'Lỗi', err.message || 'Không thể tự động phân công');
      }
    }
  };

  const handleResetSampleData = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại dữ liệu mẫu ký túc xá ban đầu không?')) {
      try {
        await resetData();
        addToast('success', 'Khôi phục mẫu', 'Đã đặt lại dữ liệu mẫu thành công.');
      } catch (err: any) {
        addToast('error', 'Lỗi', err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-200">
      {/* Realtime Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        roomInfo={state.roomInfo}
        onlineCount={onlineCount}
        onlineUsers={onlineUsers}
        isConnected={isConnected}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={(mode = 'login') => {
          setAuthMode(mode);
          setIsAuthOpen(true);
        }}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onLogout={handleLogout}
        availableUsers={state.users}
        onSwitchUser={(user) => {
          handleUserLogin(user);
        }}
        onResetData={handleResetSampleData}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Real-time sync banner if connection issue */}
        {!isConnected && !isConnecting && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
              <span>Đang kết nối lại máy chủ thời gian thực... Dữ liệu vẫn được lưu trữ bình thường.</span>
            </div>
            <button
              onClick={refreshState}
              className="font-bold underline hover:text-amber-800 ml-2"
            >
              Thử lại ngay
            </button>
          </div>
        )}

        {/* Tab 1: Interactive Duty Calendar */}
        {activeTab === 'calendar' && (
          <DutyCalendar
            duties={state.duties}
            currentUser={currentUser}
            onRegisterDuty={registerDuty}
            onCancelDuty={cancelDuty}
            onToggleDutyStatus={toggleDutyStatus}
            onOpenAuth={() => {
              setAuthMode('login');
              setIsAuthOpen(true);
            }}
            onAutoAssign={handleAutoAssign}
          />
        )}

        {/* Tab 2: Detailed Duty List Table */}
        {activeTab === 'table' && (
          <DutyListTable
            duties={state.duties}
            currentUser={currentUser}
            onOpenManualAssign={() => setIsManualAssignOpen(true)}
            onAutoAssign={handleAutoAssign}
            onToggleDutyStatus={toggleDutyStatus}
            onCancelDuty={cancelDuty}
            onOpenAuth={() => {
              setAuthMode('login');
              setIsAuthOpen(true);
            }}
            onAddToast={addToast}
          />
        )}

        {/* Tab 3: Dorm Equality & Cleanliness Stats */}
        {activeTab === 'stats' && (
          <EqualityStats
            users={state.users}
            duties={state.duties}
            currentUser={currentUser}
          />
        )}

        {/* Tab 4: Dorm Rules & Cleanliness Standards */}
        {activeTab === 'rules' && (
          <RoomRules
            roomInfo={state.roomInfo}
            currentUser={currentUser}
          />
        )}

        {/* Real-time Activity Ticker (Hiển thị các thao tác vừa diễn ra thời gian thực) */}
        {state.activities.length > 0 && (
          <section className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Nhật Ký Hoạt Động Thời Gian Thực
                </h4>
              </div>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Tự động cập nhật
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {state.activities.slice(-6).reverse().map((act) => (
                <div
                  key={act.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-bold text-slate-800 shrink-0">{act.userName}</span>
                  <span className="truncate">{act.message}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 mt-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Ký Túc Xá Xanh Sạch Đẹp • Ứng dụng phân công & trực nhật thời gian thực</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleResetSampleData}
              className="text-slate-500 hover:text-emerald-700 transition-colors"
            >
              Đặt lại dữ liệu mẫu
            </button>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-medium">
              🟢 WebSocket Sync: Hoạt động
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleUserLogin}
        initialMode={authMode}
        availableUsers={state.users}
      />

      {currentUser && (
        <ChangePasswordModal
          isOpen={isChangePasswordOpen}
          onClose={() => setIsChangePasswordOpen(false)}
          currentUser={currentUser}
          onSuccessToast={(msg) => addToast('success', 'Thành công', msg)}
        />
      )}

      <ManualAssignModal
        isOpen={isManualAssignOpen}
        onClose={() => setIsManualAssignOpen(false)}
        users={state.users}
        currentUser={currentUser}
        onSave={manualAssignDuty}
      />
    </div>
  );
}
