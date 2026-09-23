import React, { useState } from 'react';
import { RoomInfo, User } from '../types';
import { BookOpen, Sparkles, ShieldCheck, CheckCircle2, Plus, Trash2, Edit3 } from 'lucide-react';

interface Props {
  roomInfo: RoomInfo;
  currentUser: User | null;
  onUpdateRoomInfo?: (info: RoomInfo) => void;
}

export const RoomRules: React.FC<Props> = ({ roomInfo, currentUser }) => {
  const [rules, setRules] = useState<string[]>(roomInfo.rules || []);
  const [newRule, setNewRule] = useState('');
  const isLeader = currentUser?.role === 'leader';

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    const updated = [...rules, newRule.trim()];
    setRules(updated);
    setNewRule('');

    try {
      await fetch('/api/room/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: updated }),
      });
    } catch (err) {
      console.error('Error updating rules:', err);
    }
  };

  const handleRemoveRule = async (index: number) => {
    const updated = rules.filter((_, i) => i !== index);
    setRules(updated);

    try {
      await fetch('/api/room/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: updated }),
      });
    } catch (err) {
      console.error('Error updating rules:', err);
    }
  };

  const cleaningChecklist = [
    { title: 'Chổi & Cây lau nhà', desc: 'Đặt tại góc ban công, vắt khô giẻ sau khi lau' },
    { title: 'Túi đựng rác', desc: 'Để trong ngăn tủ dưới bồn rửa, thay túi mới khi đổ rác' },
    { title: 'Nước lau sàn & cọ bồn cầu', desc: 'Để bên hông nhà vệ sinh, đậy nắp kỹ sau khi dùng' },
    { title: 'Khăn lau bàn & kính', desc: 'Giặt sạch và phơi ngoài ban công' },
  ];

  return (
    <div className="space-y-6">
      {/* Banner Điểm vệ sinh thi đua */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Phòng Ký Túc Xá Tiêu Biểu Văn Hóa</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{roomInfo.roomName}</h2>
          <p className="text-xs text-emerald-100 max-w-xl">
            Giữ gìn không gian sống chung sạch sẽ, thoáng mát, nâng cao ý thức tự giác và tình đoàn kết anh em trong phòng.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
          <div className="text-center">
            <span className="text-[10px] text-emerald-200 uppercase tracking-wider block">
              Điểm thi đua KTX
            </span>
            <span className="text-3xl font-black text-amber-300">
              {roomInfo.cleanlinessScore}/100
            </span>
          </div>
          <div className="h-10 w-px bg-white/20" />
          <div className="text-left text-xs space-y-0.5">
            <p className="font-bold text-white">Xếp loại: Xuất sắc 🏆</p>
            <p className="text-emerald-100 text-[11px]">Được ban quản lý KTX khen ngợi</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dorm Rules */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">Nội Quy Trực Nhật Phòng</h3>
            </div>
            <span className="text-xs text-slate-500">{rules.length} điều khoản</span>
          </div>

          <div className="space-y-2.5">
            {rules.map((rule, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 group"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-xs text-slate-700 leading-relaxed">{rule}</span>
                </div>
                {isLeader && (
                  <button
                    onClick={() => handleRemoveRule(idx)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                    title="Xóa điều khoản"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {isLeader && (
            <form onSubmit={handleAddRule} className="pt-2 flex gap-2">
              <input
                type="text"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder="Thêm nội quy mới cho phòng..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm
              </button>
            </form>
          )}
        </div>

        {/* Cleaning Gear and Tips */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-base">Dụng Cụ & Vị Trí Để Đồ</h3>
          </div>
          <p className="text-xs text-slate-500">
            Dùng xong nhớ cất lại đúng vị trí để các bạn trực hôm sau dễ tìm kiếm.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {cleaningChecklist.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  {item.title}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 pl-6">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-xs">
            💡 <strong>Mẹo nhỏ:</strong> Bạn nào bận lịch thi cử có thể bàn bạc đổi ca trực với bạn cùng phòng qua nhóm Zalo trước 1 ngày nhé!
          </div>
        </div>
      </div>
    </div>
  );
};
