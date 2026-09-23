import React, { useState, useRef, useEffect } from 'react';
import { User, RoomInfo } from '../types';
import {
  Sparkles,
  Users,
  Calendar,
  ClipboardList,
  BarChart3,
  BookOpen,
  LogOut,
  KeyRound,
  ChevronDown,
  UserPlus,
  LogIn,
  RotateCcw,
  CheckCircle2,
  Radio,
} from 'lucide-react';

interface Props {
  currentUser: User | null;
  roomInfo: RoomInfo;
  onlineCount: number;
  onlineUsers: string[];
  isConnected: boolean;
  activeTab: 'calendar' | 'table' | 'stats' | 'rules';
  setActiveTab: (tab: 'calendar' | 'table' | 'stats' | 'rules') => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenChangePassword: () => void;
  onLogout: () => void;
  availableUsers: User[];
  onSwitchUser: (user: User) => void;
  onResetData: () => void;
}

export const Navbar: React.FC<Props> = ({
  currentUser,
  roomInfo,
  onlineCount,
  onlineUsers,
  isConnected,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenChangePassword,
  onLogout,
  availableUsers,
  onSwitchUser,
  onResetData,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showOnlineList, setShowOnlineList] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const onlineRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (onlineRef.current && !onlineRef.current.contains(e.target as Node)) {
        setShowOnlineList(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Room Tag */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 font-extrabold text-lg">
              KTX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                  Trực Nhật Ký Túc Xá
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {roomInfo.roomName.split('-')[0].trim() || 'Phòng 408'}
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Lịch phân công & dọn dẹp phòng thời gian thực
              </p>
            </div>
          </div>

          {/* Navigation Tabs for desktop */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Lịch trực tháng
            </button>
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'table'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Danh sách trực nhật
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'stats'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Thống kê công bằng
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'rules'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Nội quy phòng
            </button>
          </nav>

          {/* Right Area: Real-time Badge + User Profile */}
          <div className="flex items-center gap-3">
            {/* Real-time sync badge */}
            <div className="relative" ref={onlineRef}>
              <button
                onClick={() => setShowOnlineList(!showOnlineList)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors text-xs font-medium text-slate-700"
                title="Trạng thái kết nối thời gian thực"
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                </span>
                <span className="hidden sm:inline font-mono font-semibold">
                  {isConnected ? 'Real-time' : 'Đang kết nối...'}
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {onlineCount}
                </span>
              </button>

              {/* Online Users Tooltip Popover */}
              {showOnlineList && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                      Đang online ({onlineCount})
                    </span>
                    <span className="text-[10px] text-slate-400">Đồng bộ tức thì</span>
                  </div>
                  <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                    {onlineUsers.length > 0 ? (
                      onlineUsers.map((name, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-700">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-medium truncate">{name}</span>
                          {name === currentUser?.fullName && (
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1 rounded">Bạn</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 italic">Đang kết nối hệ thống...</p>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                    Mọi thao tác đăng ký hay hủy ca trực sẽ cập nhật ngay lập tức cho tất cả mọi người!
                  </p>
                </div>
              )}
            </div>

            {/* User Account / Profile */}
            {currentUser ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all group"
                >
                  <div
                    className={`w-8 h-8 rounded-lg ${currentUser.avatarColor} text-white flex items-center justify-center font-bold text-xs shadow-xs`}
                  >
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-emerald-700">
                      {currentUser.fullName}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono leading-tight">
                      @{currentUser.username}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform" />
                </button>

                {/* Profile Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-3 bg-slate-50 rounded-xl mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl ${currentUser.avatarColor} text-white flex items-center justify-center font-bold text-sm`}
                        >
                          {currentUser.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900 truncate">
                            {currentUser.fullName}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {currentUser.roomNumber || 'Phòng 408'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Số lần trực còn lại:</span>
                        <span className="font-semibold text-emerald-700">
                          {currentUser.dutiesLeft} / 5 lần
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Chức vụ:</span>
                        <span className="font-semibold text-emerald-700">
                          {currentUser.role === 'leader' ? 'Trưởng phòng 🌟' : 'Thành viên phòng'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenChangePassword();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <KeyRound className="w-4 h-4 text-emerald-600" />
                        Đổi mật khẩu tài khoản
                      </button>

                      {/* Quick Switch Roommates */}
                      <div className="pt-2 pb-1 px-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Chuyển nhanh thành viên
                        </p>
                      </div>
                      {availableUsers
                        .filter((u) => u.id !== currentUser.id)
                        .slice(0, 3)
                        .map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              setShowUserMenu(false);
                              onSwitchUser(u);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg transition-colors text-left"
                          >
                            <span className={`w-2 h-2 rounded-full ${u.avatarColor}`} />
                            <span className="truncate flex-1">{u.fullName}</span>
                          </button>
                        ))}

                      <div className="pt-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs shadow-emerald-600/20 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Tạo hồ sơ
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'calendar' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Lịch tháng
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'table' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Danh sách
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'stats' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Thống kê
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeTab === 'rules' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Nội quy
          </button>
        </div>
      </div>
    </header>
  );
};
