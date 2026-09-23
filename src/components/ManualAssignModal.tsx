import React, { useState } from 'react';
import { User } from '../types';
import { formatVietnameseDate } from '../utils/dateUtils';
import { ClipboardEdit, Calendar, UserPlus, Check, X, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User | null;
  onSave: (data: {
    date: string;
    userId?: string;
    customName?: string;
    shift: 'all_day' | 'morning' | 'evening';
    tasks: string[];
    notes?: string;
  }) => Promise<any>;
}

export const ManualAssignModal: React.FC<Props> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSave,
}) => {
  // Default to today or tomorrow
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(todayStr);
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser ? currentUser.id : users[0]?.id || '');
  const [customName, setCustomName] = useState<string>('');
  const [isCustomMember, setIsCustomMember] = useState<boolean>(false);
  const [shift, setShift] = useState<'all_day' | 'morning' | 'evening'>('evening');
  const [notes, setNotes] = useState<string>('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([
    'Quét & lau sạch sàn phòng',
    'Đổ rác đúng giờ trước 22h',
    'Vệ sinh bồn rửa & nhà vệ sinh',
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const defaultTasksList = [
    'Quét & lau sạch sàn phòng',
    'Đổ rác đúng giờ trước 22h',
    'Vệ sinh bồn rửa & nhà vệ sinh',
    'Lau bụi bàn ghế & gương soi',
    'Thu dọn kệ giày dép gọn gàng',
    'Kiểm tra tắt điện quạt trước khi ra ngoài',
  ];

  const toggleTask = (task: string) => {
    if (selectedTasks.includes(task)) {
      setSelectedTasks(selectedTasks.filter((t) => t !== task));
    } else {
      setSelectedTasks([...selectedTasks, task]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError('Vui lòng chọn ngày trực.');
      return;
    }

    if (isCustomMember && !customName.trim()) {
      setError('Vui lòng nhập họ tên người trực.');
      return;
    }

    if (selectedTasks.length === 0) {
      setError('Vui lòng chọn ít nhất một nhiệm vụ trực nhật.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        date,
        userId: isCustomMember ? undefined : selectedUserId,
        customName: isCustomMember ? customName.trim() : undefined,
        shift,
        tasks: selectedTasks,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi phân công trực nhật');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ClipboardEdit className="w-5 h-5 text-emerald-200" />
            <div>
              <h3 className="font-bold text-base">Tự điền & Phân công trực nhật</h3>
              <p className="text-xs text-emerald-100">
                Thêm lịch trực nhật thủ công cho thành viên phòng KTX
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Choose Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                1. Ngày trực nhật <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                />
              </div>
              {date && (
                <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                  → {formatVietnameseDate(date)}
                </p>
              )}
            </div>

            {/* Choose Person */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  2. Người đảm nhận <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomMember(!isCustomMember)}
                  className="text-[11px] text-emerald-700 hover:underline font-semibold"
                >
                  {isCustomMember ? '← Chọn từ danh sách thành viên' : '+ Nhập tên khác'}
                </button>
              </div>

              {isCustomMember ? (
                <div>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Nhập họ và tên người trực..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Dành cho bạn mới vào phòng hoặc người trực thay thế
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {users.map((u) => {
                    const isSelected = selectedUserId === u.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setSelectedUserId(u.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500 text-emerald-950 font-semibold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-lg ${u.avatarColor} text-white flex items-center justify-center text-xs font-bold shrink-0`}
                        >
                          {u.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs truncate font-bold">{u.fullName}</p>
                          <p className="text-[10px] opacity-75 truncate">
                            {u.id === currentUser?.id ? '(Bạn)' : u.username}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Shift */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                3. Ca trực nhật
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'morning', label: 'Ca Sáng', time: '06:30 - 08:00' },
                  { id: 'evening', label: 'Ca Tối', time: '19:30 - 21:30' },
                  { id: 'all_day', label: 'Cả Ngày', time: 'Cả ngày 24h' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setShift(s.id as any)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      shift === s.id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="text-xs block font-bold">{s.label}</span>
                    <span className="text-[10px] text-slate-400 block">{s.time}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks checklist */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                4. Danh sách nhiệm vụ cụ thể
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200/80">
                {defaultTasksList.map((task, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer text-xs text-slate-700"
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

            {/* Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                5. Ghi chú thêm (tùy chọn)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Nhớ cọ góc tường sau cánh cửa..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading ? 'Đang lưu...' : 'Lưu lịch trực'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
