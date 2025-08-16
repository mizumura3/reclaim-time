// Japanese holidays data
// Based on Cabinet Office's official holiday list

const JapaneseHolidays = {
  // 2025年の祝日
  2025: [
    '2025-01-01', // 元日
    '2025-01-13', // 成人の日
    '2025-02-11', // 建国記念の日
    '2025-02-23', // 天皇誕生日
    '2025-02-24', // 振替休日
    '2025-03-20', // 春分の日
    '2025-04-29', // 昭和の日
    '2025-05-03', // 憲法記念日
    '2025-05-04', // みどりの日
    '2025-05-05', // こどもの日
    '2025-05-06', // 振替休日
    '2025-07-21', // 海の日
    '2025-08-11', // 山の日
    '2025-09-15', // 敬老の日
    '2025-09-23', // 秋分の日
    '2025-10-13', // スポーツの日
    '2025-11-03', // 文化の日
    '2025-11-23', // 勤労感謝の日
    '2025-11-24', // 振替休日
  ],
  
  // 2026年の祝日（予定）
  2026: [
    '2026-01-01', // 元日
    '2026-01-12', // 成人の日
    '2026-02-11', // 建国記念の日
    '2026-02-23', // 天皇誕生日
    '2026-03-20', // 春分の日
    '2026-04-29', // 昭和の日
    '2026-05-03', // 憲法記念日
    '2026-05-04', // みどりの日
    '2026-05-05', // こどもの日
    '2026-05-06', // 振替休日
    '2026-07-20', // 海の日
    '2026-08-11', // 山の日
    '2026-09-21', // 敬老の日
    '2026-09-22', // 国民の休日
    '2026-09-23', // 秋分の日
    '2026-10-12', // スポーツの日
    '2026-11-03', // 文化の日
    '2026-11-23', // 勤労感謝の日
  ]
};

// Check if a given date is a Japanese holiday
function isJapaneseHoliday(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  
  const holidays = JapaneseHolidays[year] || [];
  return holidays.includes(dateString);
}

// Check if a given date is a weekend
function isWeekend(date) {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
}

// Check if a given date is a weekend or holiday
function isWeekendOrHoliday(date) {
  return isWeekend(date) || isJapaneseHoliday(date);
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isJapaneseHoliday,
    isWeekend,
    isWeekendOrHoliday,
    JapaneseHolidays
  };
}

// For direct import in browser extension
const HolidayUtils = {
  isJapaneseHoliday,
  isWeekend,
  isWeekendOrHoliday,
  JapaneseHolidays
};