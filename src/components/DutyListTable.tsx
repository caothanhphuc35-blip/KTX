import React, { useState, useMemo } from 'react';
import { DutyItem, User } from '../types';
import { formatVietnameseDate, isToday, isPastDate } from '../utils/dateUtils';
import {
  Search,
  Filter,
  PlusCircle,
  CheckCircle2,
  Clock,
  Trash2,
  Sparkles,
  Copy,
  Calendar,
  Check,
  X,
  AlertCircle,
  MessageSquare,
  FileSpreadsheet,
} from 'lucide-react';

interface Props {
  duties: DutyItem[];
  currentUser: User | null;
  onOpenManualAssign: () => void;
  onAutoAssign: (year: number, month: number) => void;
  onToggleDutyStatus: (dutyId: string, status: 'pending' | 'completed', note?: string) => Promise<any>;
  onCancelDuty: (date: string, dutyId?: string) => Promise<any>;
  onOpenAuth: () => void;
  onAddToast: (type: 'info' | 'success' | 'warning' | 'error', title: string, msg: string) => void;
}

export const DutyListTable: React.FC<Props> = ({
  duties,
  currentUser,
  onOpenManualAssign,
  onAutoAssign,
  onToggleDutyStatus,
  onCancelDuty,
  onOpenAuth,
  onAddToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'mine'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all'); // e.g. "2026-09" or "all"

  // Check-in modal
  const [dutyToCheckin, setDutyToCheckin] = useState<DutyItem | null>(null);
  const [checkinNote, setCheckinNote] = useState('Đã quét sạch phòng, đổ rác và lau sàn.');
  const [loadingAction, setLoadingAction] = useState(false);

  // Available months from duties
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    duties.forEach((d) => {
      if (d.date) {
        const ym = d.date.substring(0, 7);
        months.add(ym);
      }
    });
    return Array.from(months).sort().reverse();
  }, [duties]);

  // Filtered & Sorted duties
  const filteredDuties = useMemo(() => {
    return duties
      .filter((d) => {
        // Search term
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = d.userName.toLowerCase().includes(q);
          const matchDate = d.date.includes(q);
          const matchTask = d.tasks.some((t) => t.toLowerCase().includes(q));
          if (!matchName && !matchDate && !matchTask) return false;
        }

        // Status filter
        if (statusFilter === 'completed' && d.status !== 'completed') return false;
        if (statusFilter === 'pending' && d.status !== 'pending') return false;
        if (statusFilter === 'mine') {
          if (!currentUser || d.userId !== currentUser.id) return false;
        }

        // Month filter
        if (monthFilter !== 'all' && !d.date.startsWith(monthFilter)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [duties, searchTerm, statusFilter, monthFilter, currentUser]);

  const shiftName = (shift: string) => {
    switch (shift) {
      case 'morning':
        return 'Ca Sáng (06:30 - 08:00)';
      case 'evening':
        return 'Ca Tối (19:30 - 21:30)';
      case 'all_day':
      default:
        return 'Cả Ngày (24h)';
    }
  };

  // Copy schedule to clipboard for dorm group chat (Zalo / Messenger)
  const handleCopySchedule = () => {
    if (filteredDuties.length === 0) return;

    let text = `📋 LỊCH TRỰC NHẬT KÝ TÚC XÁ\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    filteredDuties.forEach((d) => {
      const statusIcon = d.status === 'completed' ? '✅' : '⏳';
      text += `${formatVietnameseDate(d.date)}: ${d.userName} (${shiftName(d.shift).split(' ')[0]}) ${statusIcon}\n`;
    });
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `(Cập nhật thời gian thực từ ứng dụng)`;

    navigator.clipboard.writeText(text);
    onAddToast('success', 'Đã sao chép lịch trực', 'Đã lưu vào bộ nhớ tạm, bạn có thể dán vào nhóm Zalo phòng!');
  };

  const handleConfirmCheckin = async () => {
    if (!dutyToCheckin) return;
    setLoadingAction(true);
    try {
      await onToggleDutyStatus(dutyToCheckin.id, 'completed', checkinNote);
      setDutyToCheckin(null);
      setCheckinNote('Đã quét sạch phòng, đổ rác và lau sàn.');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xác nhận hoàn thành');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCancelClick = async (duty: DutyItem) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (duty.userId !== currentUser.id && currentUser.role !== 'leader') {
      alert('Bạn chỉ có thể hủy ca trực của chính mình.');
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn hủy lịch trực ngày ${formatVietnameseDate(duty.date)} của ${duty.userName}?`)) {
      try {
        await onCancelDuty(duty.date, duty.id);
      } catch (err: any) {
        alert(err.message || 'Lỗi khi hủy lịch trực');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Action Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Bảng Tổng Hợp Trực Nhật KTX</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                {filteredDuties.length} ca trực
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự điền phân công, kiểm tra tiến độ dọn dẹp và xác nhận hoàn thành ca trực
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Manual assign button: "(cái này tự điền)" */}
            <button
              onClick={onOpenManualAssign}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs shadow-emerald-600/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Tự điền phân công</span>
            </button>

            {/* Copy schedule for group chat */}
            <button
              onClick={handleCopySchedule}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 rounded-xl transition-colors"
              title="Sao chép danh sách trực để gửi vào nhóm Zalo/Facebook phòng"
            >
              <Copy className="w-3.5 h-3.5 text-slate-600" />
              <span>Sao chép Zalo</span>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-slate-100">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên thành viên, ngày trực hoặc nhiệm vụ..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Month selector */}
          {availableMonths.length > 0 && (
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="all">Tất cả các tháng</option>
              {availableMonths.map((ym) => {
                const [y, m] = ym.split('-');
                return (
                  <option key={ym} value={ym}>
                    Tháng {m}/{y}
                  </option>
                );
              })}
            </select>
          )}

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chờ trực
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đã xong
            </button>
            {currentUser && (
              <button
                onClick={() => setStatusFilter('mine')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === 'mine'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ca của tôi
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {filteredDuties.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-800">Không tìm thấy ca trực nào phù hợp</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Chưa có lịch trực trong khoảng thời gian hoặc tiêu chí này. Bạn có thể nhấn vào nút "Tự điền phân công" bên trên để thêm mới!
            </p>
            <button
              onClick={onOpenManualAssign}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              Tự điền phân công ngay
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Ngày trực</th>
                  <th className="py-3.5 px-4">Thành viên phụ trách</th>
                  <th className="py-3.5 px-4">Ca trực</th>
                  <th className="py-3.5 px-4">Nhiệm vụ cụ thể</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredDuties.map((duty) => {
                  const isTodayDate = isToday(duty.date);
                  const isPast = isPastDate(duty.date);
                  const isMyDuty = currentUser && duty.userId === currentUser.id;
                  const canCancel = isMyDuty || currentUser?.role === 'leader';
                  const canComplete = isMyDuty || currentUser?.role === 'leader';

                  return (
                    <tr
                      key={duty.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isTodayDate ? 'bg-emerald-50/30 font-medium' : ''
                      }`}
                    >
                      {/* Cột 1: Ngày trực */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">
                              {formatVietnameseDate(duty.date)}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              {isTodayDate && (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                  Hôm nay
                                </span>
                              )}
                              {isPast && duty.status === 'pending' && (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                  Đến hạn
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono">
                                {duty.date}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Người phụ trách */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-lg ${duty.userAvatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}
                          >
                            {duty.userName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 truncate">
                                {duty.userName}
                              </span>
                              {isMyDuty && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate">
                              Phòng 408
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Ca trực */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {shiftName(duty.shift)}
                        </span>
                      </td>

                      {/* Cột 4: Nhiệm vụ chi tiết */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {duty.tasks.map((task, i) => (
                            <span
                              key={i}
                              className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px]"
                            >
                              • {task}
                            </span>
                          ))}
                        </div>
                        {duty.completedNote && (
                          <p className="text-[10px] text-emerald-700 italic mt-1 bg-emerald-50 p-1 rounded">
                            "{duty.completedNote}"
                          </p>
                        )}
                      </td>

                      {/* Cột 5: Trạng thái */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {duty.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <Check className="w-3 h-3" />
                            Đã hoàn thành
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            Chờ trực
                          </span>
                        )}
                      </td>

                      {/* Cột 6: Thao tác */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Check-in completion button */}
                          {duty.status === 'pending' ? (
                            <button
                              onClick={() => {
                                if (!currentUser) {
                                  onOpenAuth();
                                  return;
                                }
                                setDutyToCheckin(duty);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 transition-colors"
                              title="Xác nhận bạn đã dọn dẹp xong"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Xác nhận xong</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => onToggleDutyStatus(duty.id, 'pending')}
                              className="px-2 py-1 rounded-lg text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
                              title="Đổi lại trạng thái chưa hoàn thành"
                            >
                              Đổi lại
                            </button>
                          )}

                          {/* Cancel button */}
                          {canCancel && (
                            <button
                              onClick={() => handleCancelClick(duty)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hủy lịch trực này"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Check-in Modal */}
      {dutyToCheckin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-base">Xác nhận đã trực nhật</h3>
              </div>
              <button
                onClick={() => setDutyToCheckin(null)}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Xác nhận hoàn thành ca trực ngày{' '}
                <strong className="text-slate-900">
                  {formatVietnameseDate(dutyToCheckin.date)}
                </strong>{' '}
                của <strong className="text-slate-900">{dutyToCheckin.userName}</strong>.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú hoàn thành (tùy chọn)
                </label>
                <textarea
                  value={checkinNote}
                  onChange={(e) => setCheckinNote(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="Ví dụ: Đã quét dọn sạch sẽ, đổ rác và lau nhà..."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDutyToCheckin(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={handleConfirmCheckin}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 disabled:opacity-50"
                >
                  {loadingAction ? 'Đang lưu...' : 'Hoàn thành ✓'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
