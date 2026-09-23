import React, { useState } from 'react';
import { DutyItem, User } from '../types';
import {
  getMonthDays,
  VIETNAMESE_DAYS,
  formatVietnameseDate,
  isToday,
  isPastDate,
  getShortDate,
} from '../utils/dateUtils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Trash2,
  UserCheck,
  PlusCircle,
  Sparkles,
  Info,
  Check,
  AlertCircle,
  X,
} from 'lucide-react';

interface Props {
  duties: DutyItem[];
  currentUser: User | null;
  onRegisterDuty: (date: string, shift?: 'all_day' | 'morning' | 'evening', tasks?: string[]) => Promise<any>;
  onCancelDuty: (date: string, dutyId?: string) => Promise<any>;
  onToggleDutyStatus: (dutyId: string, status: 'pending' | 'completed', note?: string) => Promise<any>;
  onOpenAuth: () => void;
  onAutoAssign: (year: number, month: number) => void;
}

export const DutyCalendar: React.FC<Props> = ({
  duties,
  currentUser,
  onRegisterDuty,
  onCancelDuty,
  onToggleDutyStatus,
  onOpenAuth,
  onAutoAssign,
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0 - 11

  // Modals / dialogs
  const [selectedDayToRegister, setSelectedDayToRegister] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<'all_day' | 'morning' | 'evening'>('evening');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([
    'Quét & lau sạch sàn phòng',
    'Đổ rác đúng giờ trước 22h',
    'Vệ sinh bồn rửa & nhà tắm',
  ]);

  const [dutyToCancel, setDutyToCancel] = useState<DutyItem | null>(null);
  const [dutyDetail, setDutyDetail] = useState<DutyItem | null>(null);

  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const jumpToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const daysGrid = getMonthDays(currentYear, currentMonth);

  // Map of duties by date string
  const dutyByDate = React.useMemo(() => {
    const map = new Map<string, DutyItem>();
    duties.forEach((d) => {
      map.set(d.date, d);
    });
    return map;
  }, [duties]);

  // Statistics for this month
  const monthStats = React.useMemo(() => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const monthPrefix = `${currentYear}-${pad(currentMonth + 1)}`;
    const monthDaysCount = new Date(currentYear, currentMonth + 1, 0).getDate();

    let assignedCount = 0;
    let myCount = 0;
    let completedCount = 0;

    for (let d = 1; d <= monthDaysCount; d++) {
      const dateStr = `${monthPrefix}-${pad(d)}`;
      const duty = dutyByDate.get(dateStr);
      if (duty) {
        assignedCount++;
        if (currentUser && duty.userId === currentUser.id) myCount++;
        if (duty.status === 'completed') completedCount++;
      }
    }

    const emptyCount = monthDaysCount - assignedCount;

    return {
      monthDaysCount,
      assignedCount,
      emptyCount,
      myCount,
      completedCount,
    };
  }, [currentYear, currentMonth, dutyByDate, currentUser]);

  // Handle click on a date cell
  const handleCellClick = (dateStr: string, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;

    const existingDuty = dutyByDate.get(dateStr);

    if (existingDuty) {
      // If it's the current user's duty, prompt cancel as requested:
      // "hoặc nhấn vào ngày của mình để hủy."
      if (currentUser && existingDuty.userId === currentUser.id) {
        setDutyToCancel(existingDuty);
      } else {
        // Show duty details
        setDutyDetail(existingDuty);
      }
    } else {
      // Empty date: "Bạn có thể nhấn vào ngày trống để đăng ký trực"
      if (!currentUser) {
        onOpenAuth();
        return;
      }
      setSelectedDayToRegister(dateStr);
    }
  };

  // Perform Registration
  const handleConfirmRegister = async () => {
    if (!selectedDayToRegister || !currentUser) return;
    setLoadingAction(true);
    setActionError(null);
    try {
      await onRegisterDuty(selectedDayToRegister, selectedShift, selectedTasks);
      setSelectedDayToRegister(null);
    } catch (err: any) {
      setActionError(err.message || 'Không thể đăng ký ca trực');
    } finally {
      setLoadingAction(false);
    }
  };

  // Perform Cancellation
  const handleConfirmCancel = async () => {
    if (!dutyToCancel) return;
    setLoadingAction(true);
    setActionError(null);
    try {
      await onCancelDuty(dutyToCancel.date, dutyToCancel.id);
      setDutyToCancel(null);
    } catch (err: any) {
      setActionError(err.message || 'Không thể hủy lịch trực');
    } finally {
      setLoadingAction(false);
    }
  };

  const taskOptions = [
    'Quét & lau sạch sàn phòng',
    'Đổ rác đúng giờ trước 22h',
    'Vệ sinh bồn rửa & nhà tắm',
    'Lau bụi bàn học & kệ dép',
    'Tắt quạt/điện trước khi ra ngoài',
  ];

  const toggleTask = (task: string) => {
    if (selectedTasks.includes(task)) {
      setSelectedTasks(selectedTasks.filter((t) => t !== task));
    } else {
      setSelectedTasks([...selectedTasks, task]);
    }
  };

  const shiftLabels = {
    all_day: 'Cả ngày (06:00 - 22:00)',
    morning: 'Ca sáng (06:30 - 08:00)',
    evening: 'Ca tối (19:30 - 21:30)',
  };

  return (
    <div className="space-y-6">
      {/* Month Navigator Header & Stats */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Tháng {currentMonth + 1} / {currentYear}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhấn vào ngày trống để đăng ký • Nhấn vào ngày của bạn để hủy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
              title="Tháng trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={jumpToToday}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            >
              Hôm nay
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
              title="Tháng tiếp"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {monthStats.emptyCount > 0 && (
              <button
                onClick={() => onAutoAssign(currentYear, currentMonth)}
                className="ml-2 flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl transition-all"
                title="Tự động chia đều các ngày trống cho tất cả thành viên trong phòng"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden sm:inline">Phân công tự động cả tháng</span>
                <span className="sm:hidden">Tự động</span>
              </button>
            )}
          </div>
        </div>

        {/* Month Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Tổng số ngày
            </span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">
              {monthStats.monthDaysCount} ngày
            </span>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
              Đã có người trực
            </span>
            <span className="text-xl font-bold text-emerald-800 mt-0.5 block">
              {monthStats.assignedCount} ca ({Math.round((monthStats.assignedCount / monthStats.monthDaysCount) * 100)}%)
            </span>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
              Ngày còn trống
            </span>
            <span className="text-xl font-bold text-amber-800 mt-0.5 block">
              {monthStats.emptyCount} ngày
            </span>
          </div>

          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100">
            <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider block">
              Ca của bạn
            </span>
            <span className="text-xl font-bold text-indigo-900 mt-0.5 block">
              {currentUser ? `${monthStats.myCount} ca trực` : 'Chưa đăng nhập'}
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Days of Week Header (Mon to Sun) */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center font-bold text-xs text-slate-600">
          {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'].map((day, idx) => (
            <div
              key={idx}
              className={`py-3 px-1 border-r border-slate-200 last:border-r-0 ${
                idx === 5 || idx === 6 ? 'text-amber-700 bg-amber-50/30' : ''
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
          {daysGrid.map((dayItem, index) => {
            const { dateStr, dayNumber, isCurrentMonth } = dayItem;
            const duty = dutyByDate.get(dateStr);
            const isTodayDate = isToday(dateStr);
            const isPast = isPastDate(dateStr);
            const isMyDuty = currentUser && duty && duty.userId === currentUser.id;

            return (
              <div
                key={dateStr + '_' + index}
                onClick={() => handleCellClick(dateStr, isCurrentMonth)}
                className={`min-h-[105px] sm:min-h-[120px] p-1.5 sm:p-2.5 transition-all flex flex-col justify-between relative group ${
                  !isCurrentMonth
                    ? 'bg-slate-50/50 opacity-40 cursor-default'
                    : isMyDuty
                    ? 'bg-emerald-50/60 hover:bg-emerald-100/50 cursor-pointer ring-1 ring-inset ring-emerald-400'
                    : duty
                    ? 'bg-white hover:bg-slate-50 cursor-pointer'
                    : 'bg-white hover:bg-emerald-50/30 cursor-pointer'
                }`}
              >
                {/* Cell Header: Day Number & Today Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-bold rounded-lg w-6 h-6 ${
                      isTodayDate
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {dayNumber}
                  </span>

                  {isTodayDate && (
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                      Hôm nay
                    </span>
                  )}

                  {/* Indicator tag if current user's duty */}
                  {isMyDuty && isCurrentMonth && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-600 text-white shadow-xs">
                      Của bạn
                    </span>
                  )}
                </div>

                {/* Cell Content: Assigned Duty OR Empty State */}
                <div className="mt-1 flex-1 flex flex-col justify-center">
                  {isCurrentMonth && duty ? (
                    <div className="space-y-1">
                      {/* Person badge */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${duty.userAvatarColor}`}
                        />
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {duty.userName}
                        </span>
                      </div>

                      {/* Shift & status */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            duty.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800 flex items-center gap-0.5'
                              : isPast
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {duty.status === 'completed' ? (
                            <>
                              <Check className="w-2.5 h-2.5" />
                              Đã trực
                            </>
                          ) : (
                            shiftLabels[duty.shift]?.split(' ')[0] || 'Ca tối'
                          )}
                        </span>
                      </div>

                      {/* If user's duty, show quick action on hover */}
                      {isMyDuty && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            <Trash2 className="w-3 h-3" />
                            Nhấn để hủy
                          </span>
                        </div>
                      )}
                    </div>
                  ) : isCurrentMonth ? (
                    // EMPTY DAY: "+ Đăng ký trực"
                    <div className="h-full flex flex-col items-center justify-center text-center p-1 rounded-lg border border-dashed border-slate-200 group-hover:border-emerald-400 group-hover:bg-white/80 transition-colors">
                      <PlusCircle className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      <span className="text-[10px] font-medium text-slate-400 group-hover:text-emerald-700 transition-colors mt-0.5">
                        Trống • Đăng ký
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>Ca của bạn (Nhấn để hủy)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[9px]">
              ✓
            </span>
            <span>Đã hoàn thành</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-blue-100 text-blue-800 font-bold text-[9px] flex items-center justify-center">
              •
            </span>
            <span>Sắp tới / Chờ trực</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md border border-dashed border-slate-400" />
            <span>Ngày trống (Nhấn để đăng ký)</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-400 italic">
          Đồng bộ tức thì mọi thay đổi qua WebSocket thời gian thực
        </span>
      </div>

      {/* MODAL 1: Đăng ký trực nhật cho ngày trống */}
      {selectedDayToRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-5 h-5 text-emerald-200" />
                <div>
                  <h3 className="font-bold text-base">Đăng ký ca trực nhật</h3>
                  <p className="text-xs text-emerald-100">
                    {formatVietnameseDate(selectedDayToRegister)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDayToRegister(null)}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* User info */}
              <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3 border border-slate-100">
                <div
                  className={`w-9 h-9 rounded-xl ${currentUser?.avatarColor} text-white flex items-center justify-center font-bold text-sm`}
                >
                  {currentUser?.fullName.charAt(0)}
                </div>
                <div>
                  <p className="text-xs text-slate-500">Người đăng ký:</p>
                  <p className="font-bold text-sm text-slate-900">{currentUser?.fullName}</p>
                </div>
              </div>

              {/* Shift selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Chọn ca trực
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {(['evening', 'morning', 'all_day'] as const).map((s) => (
                    <label
                      key={s}
                      onClick={() => setSelectedShift(s)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        selectedShift === s
                          ? 'border-emerald-500 bg-emerald-50/60 font-semibold text-emerald-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="text-xs">{shiftLabels[s]}</span>
                      <input
                        type="radio"
                        name="shift"
                        checked={selectedShift === s}
                        onChange={() => setSelectedShift(s)}
                        className="accent-emerald-600"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Checklist */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nhiệm vụ trực nhật cam kết:
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {taskOptions.map((task, idx) => (
                    <label
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task)}
                        onChange={() => toggleTask(task)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span>{task}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDayToRegister(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={handleConfirmRegister}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {loadingAction ? 'Đang lưu...' : 'Xác nhận đăng ký'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Hủy lịch trực của chính mình */}
      {dutyToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-200" />
                <h3 className="font-bold text-base">Hủy ca trực nhật?</h3>
              </div>
              <button
                onClick={() => setDutyToCancel(null)}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-700">
                Bạn có chắc chắn muốn hủy đăng ký trực nhật vào ngày{' '}
                <strong className="text-slate-900 font-bold">
                  {formatVietnameseDate(dutyToCancel.date)}
                </strong>
                ?
              </p>
              <p className="text-xs text-slate-500 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                Sau khi hủy, ngày này sẽ trở thành ngày trống và các bạn cùng phòng khác có thể đăng ký thay bạn.
              </p>

              {actionError && (
                <p className="text-xs text-rose-600 font-medium">{actionError}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDutyToCancel(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Giữ lại ca
                </button>
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={handleConfirmCancel}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-600/20 transition-all disabled:opacity-50"
                >
                  {loadingAction ? 'Đang hủy...' : 'Đồng ý hủy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Chi tiết ca trực của bạn cùng phòng */}
      {dutyDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Thông tin ca trực</h3>
              </div>
              <button
                onClick={() => setDutyDetail(null)}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div
                  className={`w-10 h-10 rounded-xl ${dutyDetail.userAvatarColor} text-white flex items-center justify-center font-bold text-sm`}
                >
                  {dutyDetail.userName.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900">{dutyDetail.userName}</p>
                  <p className="text-xs text-slate-500">
                    Ngày: {formatVietnameseDate(dutyDetail.date)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Ca trực:</span>
                  <span className="font-semibold text-slate-800">
                    {shiftLabels[dutyDetail.shift]}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Trạng thái:</span>
                  <span
                    className={`font-semibold ${
                      dutyDetail.status === 'completed' ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {dutyDetail.status === 'completed' ? 'Đã hoàn thành ✓' : 'Chờ dọn dẹp ⏳'}
                  </span>
                </div>
                {dutyDetail.completedNote && (
                  <div className="py-1">
                    <span className="text-slate-500 block mb-1">Ghi chú:</span>
                    <p className="p-2 bg-slate-50 rounded-lg text-slate-700 italic">
                      "{dutyDetail.completedNote}"
                    </p>
                  </div>
                )}
              </div>

              {/* Task list */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1.5">
                  Nhiệm vụ phụ trách:
                </span>
                <ul className="space-y-1">
                  {dutyDetail.tasks.map((task, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* If user is Leader or the assignee, allow toggle status */}
              {(currentUser?.role === 'leader' || currentUser?.id === dutyDetail.userId) && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={async () => {
                      const next = dutyDetail.status === 'completed' ? 'pending' : 'completed';
                      await onToggleDutyStatus(dutyDetail.id, next);
                      setDutyDetail(null);
                    }}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {dutyDetail.status === 'completed'
                      ? 'Đổi sang chưa hoàn thành'
                      : 'Đánh dấu đã hoàn thành ca trực'}
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setDutyDetail(null)}
                className="w-full py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
