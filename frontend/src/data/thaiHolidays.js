// month is 0-indexed (0=Jan, 11=Dec)

// วันหยุดตายตัวทุกปี
const FIXED = [
  { month: 0, day: 1, name: "วันขึ้นปีใหม่" },
  { month: 3, day: 6, name: "วันจักรี" },
  { month: 3, day: 13, name: "วันสงกรานต์" },
  { month: 3, day: 14, name: "วันสงกรานต์" },
  { month: 3, day: 15, name: "วันสงกรานต์" },
  { month: 4, day: 1, name: "วันแรงงาน" },
  { month: 4, day: 4, name: "วันฉัตรมงคล" },
  { month: 5, day: 3, name: "วันเฉลิมฯ ราชินี" },
  { month: 6, day: 28, name: "วันเฉลิมฯ ร.๑๐" },
  { month: 7, day: 12, name: "วันแม่แห่งชาติ" },
  { month: 9, day: 13, name: "วันนวมินทรมหาราช" },
  { month: 9, day: 23, name: "วันปิยมหาราช" },
  { month: 11, day: 5, name: "วันพ่อแห่งชาติ" },
  { month: 11, day: 10, name: "วันรัฐธรรมนูญ" },
  { month: 11, day: 31, name: "วันสิ้นปี" },
];

// วันหยุดทางพุทธศาสนา (ขึ้นอยู่กับปฏิทินจันทรคติ — ตรวจสอบทุกปีจากราชกิจจานุเบกษา)
const BUDDHIST = {
  2024: [
    { month: 1, day: 24, name: "วันมาฆบูชา" },
    { month: 4, day: 22, name: "วันวิสาขบูชา" },
    { month: 6, day: 20, name: "วันอาสาฬหบูชา" },
    { month: 6, day: 21, name: "วันเข้าพรรษา" },
  ],
  2025: [
    { month: 1, day: 12, name: "วันมาฆบูชา" },
    { month: 4, day: 11, name: "วันวิสาขบูชา" },
    { month: 6, day: 10, name: "วันอาสาฬหบูชา" },
    { month: 6, day: 11, name: "วันเข้าพรรษา" },
  ],
  // ปี 2569 มีอธิกมาส — อาสาฬหบูชาและเข้าพรรษาเลื่อนออกไป ~30 วัน
  2026: [
    { month: 1, day: 22, name: "วันมาฆบูชา" },
    { month: 4, day: 31, name: "วันวิสาขบูชา" },
    { month: 7, day: 29, name: "วันอาสาฬหบูชา" },
    { month: 7, day: 30, name: "วันเข้าพรรษา" },
  ],
  2027: [
    { month: 1, day: 10, name: "วันมาฆบูชา" },
    { month: 4, day: 19, name: "วันวิสาขบูชา" },
    { month: 6, day: 17, name: "วันอาสาฬหบูชา" },
    { month: 6, day: 18, name: "วันเข้าพรรษา" },
  ],
};

/**
 * คืน array ของวันหยุดสำหรับปีที่กำหนด
 * แต่ละ entry: { month (0-indexed), day, name, type: 'fixed'|'buddhist' }
 */
export function getHolidays(year) {
  const fixed = FIXED.map((h) => ({ ...h, type: "fixed" }));
  const buddhist = (BUDDHIST[year] || []).map((h) => ({
    ...h,
    type: "buddhist",
  }));
  return [...fixed, ...buddhist];
}

/**
 * คืน Map<"YYYY-MM-DD", holiday[]> สำหรับปีและเดือนนั้น
 */
export function getHolidayMap(year) {
  const map = new Map();
  for (const h of getHolidays(year)) {
    const key = `${year}-${String(h.month + 1).padStart(2, "0")}-${String(h.day).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(h);
  }
  return map;
}
