/* =========================================================
   data.js — the single "data source" for the UI.
   Content lives here, separated from the container (HTML).
   Later this can be swapped for a real fetch('/api/...') call.
   ========================================================= */

const AIRPORTS = {
  BKK: { city_en: "Bangkok",    city_th: "กรุงเทพฯ",   country: "Thailand" },
  CNX: { city_en: "Chiang Mai", city_th: "เชียงใหม่",  country: "Thailand" },
  HKT: { city_en: "Phuket",     city_th: "ภูเก็ต",     country: "Thailand" },
  HND: { city_en: "Tokyo",      city_th: "โตเกียว",    country: "Japan" },
  ICN: { city_en: "Seoul",      city_th: "โซล",        country: "South Korea" },
  SIN: { city_en: "Singapore",  city_th: "สิงคโปร์",   country: "Singapore" },
  HKG: { city_en: "Hong Kong",  city_th: "ฮ่องกง",     country: "Hong Kong" },
  LHR: { city_en: "London",     city_th: "ลอนดอน",     country: "United Kingdom" },
  CDG: { city_en: "Paris",      city_th: "ปารีส",      country: "France" },
  DXB: { city_en: "Dubai",      city_th: "ดูไบ",       country: "UAE" },
  SYD: { city_en: "Sydney",     city_th: "ซิดนีย์",    country: "Australia" },
};

const AIRLINES = {
  TG: { name: "Thai Airways",       code: "TG" },
  FD: { name: "Thai AirAsia",       code: "FD" },
  SQ: { name: "Singapore Airlines", code: "SQ" },
};

/* Flight catalog (rendered dynamically on flights.html) */
const FLIGHTS = [
  { id: "AS501", airline: "AS", from: "BKK", to: "HND", dep: "06:20", arr: "14:35", duration: 375, stops: 0, price: 12480, cls: "Coach" },
  { id: "SK233", airline: "SK", from: "BKK", to: "HND", dep: "09:45", arr: "19:10", duration: 445, stops: 1, price: 9990,  cls: "Coach" },
  { id: "NH118", airline: "NH", from: "BKK", to: "ICN", dep: "08:10", arr: "15:40", duration: 330, stops: 0, price: 11250, cls: "Coach" },
  { id: "ZP404", airline: "ZP", from: "BKK", to: "SIN", dep: "07:00", arr: "10:25", duration: 145, stops: 0, price: 4350,  cls: "Coach" },
  { id: "OR082", airline: "OR", from: "BKK", to: "SIN", dep: "13:30", arr: "18:05", duration: 215, stops: 1, price: 3590,  cls: "Coach" },
  { id: "AS777", airline: "AS", from: "BKK", to: "LHR", dep: "00:50", arr: "07:15", duration: 685, stops: 0, price: 31900, cls: "Business" },
  { id: "SK512", airline: "SK", from: "BKK", to: "HKG", dep: "10:15", arr: "14:05", duration: 170, stops: 0, price: 6280,  cls: "Coach" },
  { id: "NH640", airline: "NH", from: "BKK", to: "DXB", dep: "20:40", arr: "23:55", duration: 395, stops: 0, price: 14750, cls: "Premium" },
  { id: "ZP201", airline: "ZP", from: "BKK", to: "CNX", dep: "16:25", arr: "17:40", duration: 75,  stops: 0, price: 1290,  cls: "Coach" },
  { id: "OR309", airline: "OR", from: "BKK", to: "HKT", dep: "11:05", arr: "12:30", duration: 85,  stops: 0, price: 1560,  cls: "Coach" },
  { id: "AS903", airline: "AS", from: "BKK", to: "CDG", dep: "01:30", arr: "08:50", duration: 740, stops: 1, price: 29400, cls: "Business" },
  { id: "SK860", airline: "SK", from: "BKK", to: "SYD", dep: "18:20", arr: "06:55", duration: 555, stops: 0, price: 18900, cls: "Premium" },
];

/* Popular destinations (home page cards) */
const DESTINATIONS = [
  { code: "HND", price: 12480, tagline_en: "Neon nights & quiet temples", tagline_th: "ราตรีสีนีออนและวัดอันเงียบสงบ" },
  { code: "ICN", price: 11250, tagline_en: "K-culture & street food",     tagline_th: "วัฒนธรรมเกาหลีและสตรีทฟู้ด" },
  { code: "CDG", price: 29400, tagline_en: "Art, cafés & the Seine",      tagline_th: "ศิลปะ คาเฟ่ และแม่น้ำแซน" },
  { code: "SIN", price: 4350,  tagline_en: "Gardens in the sky",          tagline_th: "สวนลอยฟ้า" },
  { code: "DXB", price: 14750, tagline_en: "Desert luxury & skylines",    tagline_th: "ความหรูหรากลางทะเลทราย" },
  { code: "SYD", price: 18900, tagline_en: "Harbour views & beaches",     tagline_th: "อ่าวสวยและชายหาด" },
];

/* Car rental options (cars tab / future cars page) */
const CARS = [
  { id: "C-ECO", type_en: "Economy",  type_th: "ประหยัด",   seats: 4, price: 890,  brand: "Toyota Yaris" },
  { id: "C-SUV", type_en: "SUV",      type_th: "เอสยูวี",   seats: 5, price: 1690, brand: "Honda CR-V" },
  { id: "C-LUX", type_en: "Luxury",   type_th: "หรูหรา",    seats: 4, price: 3200, brand: "BMW 5 Series" },
  { id: "C-VAN", type_en: "Van",      type_th: "รถตู้",     seats: 9, price: 2400, brand: "Toyota Commuter" },
];

/* Default booking history (seeded into localStorage on first run) */
const SEED_BOOKINGS = [
  {
    ref: "AERIS-8F2K9", type: "flight", status: "confirmed",
    airline: "AS", flightNo: "AS501", from: "BKK", to: "HND",
    date: "2026-07-12", dep: "06:20", arr: "14:35", duration: 375,
    passengers: 2, cls: "Coach", seat: "14A", gate: "D7", total: 24960,
  },
  {
    ref: "AERIS-3J7P1", type: "flight", status: "pending",
    airline: "ZP", flightNo: "ZP404", from: "BKK", to: "SIN",
    date: "2026-08-03", dep: "07:00", arr: "10:25", duration: 145,
    passengers: 1, cls: "Coach", seat: "—", gate: "—", total: 4350,
  },
  {
    ref: "AERIS-1A0X5", type: "flight", status: "completed",
    airline: "NH", flightNo: "NH118", from: "BKK", to: "ICN",
    date: "2026-03-18", dep: "08:10", arr: "15:40", duration: 330,
    passengers: 2, cls: "Premium", seat: "8C", gate: "C2", total: 22500,
  },
  {
    ref: "AERIS-6R4W8", type: "car", status: "completed",
    brand: "Honda CR-V", carType: "SUV", from: "HKT", to: "HKT",
    date: "2026-02-09", dep: "10:00", arr: "—", duration: 0,
    passengers: 5, cls: "SUV", seat: "—", gate: "—", total: 5070,
  },
  {
    ref: "AERIS-9Q2L3", type: "flight", status: "cancelled",
    airline: "SK", flightNo: "SK512", from: "BKK", to: "HKG",
    date: "2026-01-22", dep: "10:15", arr: "14:05", duration: 170,
    passengers: 1, cls: "Coach", seat: "—", gate: "—", total: 6280,
  },
];

/* ---- helpers shared across pages ---- */
function cityName(code, lang) {
  const a = AIRPORTS[code];
  if (!a) return code;
  return lang === "th" ? a.city_th : a.city_en;
}
function fmtDuration(mins, lang) {
  const h = Math.floor(mins / 60), m = mins % 60;
  if (lang === "th") return `${h} ชม. ${m} น.`;
  return `${h}h ${m}m`;
}
function fmtBaht(n) {
  return "฿" + n.toLocaleString("en-US");
}
function fmtDate(iso, lang) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(lang === "th" ? "th-TH" : "en-GB",
    { day: "numeric", month: "short", year: "numeric" });
}
