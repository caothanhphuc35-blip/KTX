export const VIETNAMESE_DAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export function formatVietnameseDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const dayOfWeek = VIETNAMESE_DAYS[d.getDay()];
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${dayOfWeek}, ${pad(day)}/${pad(month)}/${year}`;
}

export function getShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  return `${parts[2]}/${parts[1]}`;
}

export function isToday(dateStr: string): boolean {
  const today = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  return dateStr === todayStr;
}

export function isPastDate(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  return target < today;
}

export function getMonthDays(year: number, month: number) {
  // month: 0-11
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();

  // Day of week for 1st of month: 0 (Sun), 1 (Mon), ..., 6 (Sat)
  // For Vietnamese calendar, we start on Monday (1).
  let startDay = firstDayOfMonth.getDay(); // 0 is Sunday
  // If Sunday (0), Monday offset is 6. If Mon (1), offset is 0.
  const mondayOffset = startDay === 0 ? 6 : startDay - 1;

  const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

  // Padding previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = mondayOffset - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevM = month === 0 ? 12 : month;
    const prevY = month === 0 ? year - 1 : year;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    days.push({
      dateStr: `${prevY}-${pad(prevM)}-${pad(d)}`,
      dayNumber: d,
      isCurrentMonth: false,
    });
  }

  // Current month days
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  for (let d = 1; d <= totalDays; d++) {
    days.push({
      dateStr: `${year}-${pad(month + 1)}-${pad(d)}`,
      dayNumber: d,
      isCurrentMonth: true,
    });
  }

  // Padding next month to fill grid (multiple of 7, up to 35 or 42)
  const remaining = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextM = month === 11 ? 1 : month + 2;
    const nextY = month === 11 ? year + 1 : year;
    days.push({
      dateStr: `${nextY}-${pad(nextM)}-${pad(d)}`,
      dayNumber: d,
      isCurrentMonth: false,
    });
  }

  return days;
}
