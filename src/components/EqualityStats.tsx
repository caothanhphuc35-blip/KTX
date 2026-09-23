import React from 'react';
import { DutyItem, User } from '../types';
import { Award, CheckCircle2, AlertCircle, BarChart3, Users, Flame, Sparkles } from 'lucide-react';

interface Props {
  users: User[];
  duties: DutyItem[];
  currentUser: User | null;
}

export const EqualityStats: React.FC<Props> = ({ users, duties, currentUser }) => {
  // Compute stats per user
  const stats = React.useMemo(() => {
    const userMap: Record<
      string,
      {
        user: User;
        totalShifts: number;
        completedShifts: number;
        pendingShifts: number;
      }
    > = {};

    users.forEach((u) => {
      userMap[u.id] = {
        user: u,
        totalShifts: 0,
        completedShifts: 0,
        pendingShifts: 0,
      };
    });

    duties.forEach((d) => {
      if (userMap[d.userId]) {
        userMap[d.userId].totalShifts++;
        if (d.status === 'completed') {
          userMap[d.userId].completedShifts++;
        } else {
          userMap[d.userId].pendingShifts++;
        }
      }
    });

    const list = Object.values(userMap).sort((a, b) => b.totalShifts - a.totalShifts);
    const maxShifts = Math.max(...list.map((item) => item.totalShifts), 1);

    return { list, maxShifts };
  }, [users, duties]);

  const totalDormShifts = duties.length;
  const completedDormShifts = duties.filter((d) => d.status === 'completed').length;
  const completionRate = totalDormShifts > 0 ? Math.round((completedDormShifts / totalDormShifts) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl text-white shadow-xs">
          <div className="flex items-center justify-between opacity-90">
            <span className="text-xs font-semibold uppercase tracking-wider">Tỷ lệ hoàn thành phòng</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          </div>
          <p className="text-3xl font-extrabold mt-2">{completionRate}%</p>
          <p className="text-xs text-emerald-100 mt-1">
            {completedDormShifts}/{totalDormShifts} ca trực đã xong sạch sẽ
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Thành viên ký túc xá</span>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">{users.length} bạn</p>
          <p className="text-xs text-slate-500 mt-1">
            Trung bình {users.length > 0 ? (totalDormShifts / users.length).toFixed(1) : 0} ca / người
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Độ công bằng phân bổ</span>
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2">
            {stats.list.length > 1
              ? stats.list[0].totalShifts - stats.list[stats.list.length - 1].totalShifts <= 1
                ? 'Rất đều ✨'
                : 'Cần cân bằng'
              : 'Tốt'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Chênh lệch tối đa giữa các bạn trong phòng</p>
        </div>
      </div>

      {/* Dorm Equality Leaderboard */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>Bảng Theo Dõi Số Ca Trực & Thi Đua Vệ Sinh</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Minh bạch từng ca trực của tất cả thành viên trong phòng, đảm bảo không ai bị tị nạnh!
          </p>
        </div>

        <div className="space-y-4">
          {stats.list.map((item, index) => {
            const isMe = currentUser && currentUser.id === item.user.id;
            const percentage = Math.round((item.totalShifts / stats.maxShifts) * 100);

            return (
              <div
                key={item.user.id}
                className={`p-4 rounded-xl border transition-all ${
                  isMe
                    ? 'border-emerald-300 bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                        index === 0
                          ? 'bg-amber-100 text-amber-800'
                          : index === 1
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-lg ${item.user.avatarColor} text-white flex items-center justify-center font-bold text-xs`}
                    >
                      {item.user.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {item.user.fullName}
                        </span>
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white">
                            Bạn
                          </span>
                        )}
                        {index === 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-amber-600" />
                            Chăm chỉ nhất
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {item.user.role === 'leader' ? 'Trưởng phòng' : 'Thành viên'} • @{item.user.username}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold text-slate-900">
                      {item.totalShifts}{' '}
                      <span className="text-xs font-normal text-slate-500">ca trực</span>
                    </span>
                    <p className="text-[11px] text-emerald-600 font-medium">
                      ✓ Đã xong: {item.completedShifts} • ⏳ Còn lại: {item.pendingShifts}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      index === 0
                        ? 'bg-gradient-to-r from-amber-400 to-emerald-500'
                        : isMe
                        ? 'bg-emerald-500'
                        : 'bg-teal-500'
                    }`}
                    style={{ width: `${Math.max(percentage, 5)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
