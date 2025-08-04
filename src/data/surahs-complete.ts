/**
 * Complete Quran Surah Data with Precise Juz Boundaries
 *
 * Data Source: QUL (Quranic Universal Library) by Tarteel AI
 * Source URL: https://qul.tarteel.ai/
 * License: MIT (open source)
 *
 * This file contains precise juz boundary mappings for all 114 surahs
 * based on authoritative sources from the Quranic Universal Library.
 *
 * Generated: 2025-01-25
 */

export interface SurahInfo {
  number: number;
  name: string;
  arabicName: string;
  totalAyahs: number;
  juzStart: number;
  juzEnd?: number; // For surahs that span multiple juz
  revelation: "Meccan" | "Medinan";
  juzBoundaries?: JuzBoundary[]; // Precise juz boundaries within this surah
}

export interface JuzBoundary {
  juzNumber: number;
  startAyah: number;
  endAyah?: number; // If undefined, goes to end of surah or next boundary
  startPage?: number; // Page number within the juz where this boundary starts
  endPage?: number; // Page number within the juz where this boundary ends
}

// Pages per Juz in standard Uthmani mushaf (based on user feedback)
export const PAGES_PER_JUZ: Record<number, number> = {
  1: 21,
  2: 20,
  3: 20,
  4: 20,
  5: 20,
  6: 20,
  7: 20,
  8: 20,
  9: 20,
  10: 20,
  11: 20,
  12: 20,
  13: 20,
  14: 20,
  15: 20,
  16: 20,
  17: 20,
  18: 20,
  19: 20,
  20: 20,
  21: 20,
  22: 20,
  23: 20,
  24: 20,
  25: 20,
  26: 20,
  27: 20,
  28: 20,
  29: 20,
  30: 22,
};

export const SURAHS_COMPLETE: SurahInfo[] = [
  {
    number: 1,
    name: "Al-Fatiha",
    arabicName: "الفاتحة",
    totalAyahs: 7,
    juzStart: 1,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 1, startAyah: 1, endAyah: 7 }],
  },
  {
    number: 2,
    name: "Al-Baqarah",
    arabicName: "البقرة",
    totalAyahs: 286,
    juzStart: 1,
    juzEnd: 3,
    revelation: "Medinan",
    juzBoundaries: [
      { juzNumber: 1, startAyah: 1, endAyah: 141, startPage: 1, endPage: 21 },
      { juzNumber: 2, startAyah: 142, endAyah: 252, startPage: 1, endPage: 20 },
      { juzNumber: 3, startAyah: 253, endAyah: 286, startPage: 1, endPage: 8 },
    ],
  },
  {
    number: 3,
    name: "Ali Imran",
    arabicName: "آل عمران",
    totalAyahs: 200,
    juzStart: 3,
    juzEnd: 4,
    revelation: "Medinan",
    juzBoundaries: [
      { juzNumber: 3, startAyah: 1, endAyah: 92 },
      { juzNumber: 4, startAyah: 93, endAyah: 200 },
    ],
  },
  {
    number: 4,
    name: "An-Nisa",
    arabicName: "النساء",
    totalAyahs: 176,
    juzStart: 4,
    juzEnd: 6,
    revelation: "Medinan",
    juzBoundaries: [
      { juzNumber: 4, startAyah: 1, endAyah: 23 },
      { juzNumber: 5, startAyah: 24, endAyah: 147 },
      { juzNumber: 6, startAyah: 148, endAyah: 176 },
    ],
  },
  {
    number: 5,
    name: "Al-Maidah",
    arabicName: "المائدة",
    totalAyahs: 120,
    juzStart: 6,
    juzEnd: 7,
    revelation: "Medinan",
    juzBoundaries: [
      { juzNumber: 6, startAyah: 1, endAyah: 81 },
      { juzNumber: 7, startAyah: 82, endAyah: 120 },
    ],
  },
  {
    number: 6,
    name: "Al-Anam",
    arabicName: "الأنعام",
    totalAyahs: 165,
    juzStart: 7,
    juzEnd: 8,
    revelation: "Meccan",
    juzBoundaries: [
      { juzNumber: 7, startAyah: 1, endAyah: 110 },
      { juzNumber: 8, startAyah: 111, endAyah: 165 },
    ],
  },
  {
    number: 7,
    name: "Al-Araf",
    arabicName: "الأعراف",
    totalAyahs: 206,
    juzStart: 8,
    juzEnd: 9,
    revelation: "Meccan",
    juzBoundaries: [
      { juzNumber: 8, startAyah: 1, endAyah: 87 },
      { juzNumber: 9, startAyah: 88, endAyah: 206 },
    ],
  },
  {
    number: 8,
    name: "Al-Anfal",
    arabicName: "الأنفال",
    totalAyahs: 75,
    juzStart: 9,
    juzEnd: 10,
    revelation: "Medinan",
    juzBoundaries: [
      { juzNumber: 9, startAyah: 1, endAyah: 40 },
      { juzNumber: 10, startAyah: 41, endAyah: 75 },
    ],
  },
  {
    number: 9,
    name: "At-Tawbah",
    arabicName: "التوبة",
    totalAyahs: 129,
    juzStart: 10,
    juzEnd: 11,
    revelation: "Medinan",
    juzBoundaries: [
      { juzNumber: 10, startAyah: 1, endAyah: 92 },
      { juzNumber: 11, startAyah: 93, endAyah: 129 },
    ],
  },
  {
    number: 10,
    name: "Yunus",
    arabicName: "يونس",
    totalAyahs: 109,
    juzStart: 11,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 11, startAyah: 1, endAyah: 109 }],
  },
  {
    number: 11,
    name: "Hud",
    arabicName: "هود",
    totalAyahs: 123,
    juzStart: 11,
    juzEnd: 12,
    revelation: "Meccan",
    juzBoundaries: [
      { juzNumber: 11, startAyah: 1, endAyah: 83 },
      { juzNumber: 12, startAyah: 84, endAyah: 123 },
    ],
  },
  {
    number: 12,
    name: "Yusuf",
    arabicName: "يوسف",
    totalAyahs: 111,
    juzStart: 12,
    juzEnd: 13,
    revelation: "Meccan",
    juzBoundaries: [
      { juzNumber: 12, startAyah: 1, endAyah: 52 },
      { juzNumber: 13, startAyah: 53, endAyah: 111 },
    ],
  },
  {
    number: 13,
    name: "Ar-Rad",
    arabicName: "الرعد",
    totalAyahs: 43,
    juzStart: 13,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 13, startAyah: 1, endAyah: 43 }],
  },
  {
    number: 14,
    name: "Ibrahim",
    arabicName: "ابراهيم",
    totalAyahs: 52,
    juzStart: 13,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 13, startAyah: 1, endAyah: 52 }],
  },
  {
    number: 15,
    name: "Al-Hijr",
    arabicName: "الحجر",
    totalAyahs: 99,
    juzStart: 14,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 14, startAyah: 1, endAyah: 99 }],
  },
  {
    number: 16,
    name: "An-Nahl",
    arabicName: "النحل",
    totalAyahs: 128,
    juzStart: 14,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 14, startAyah: 1, endAyah: 128 }],
  },
  {
    number: 17,
    name: "Al-Isra",
    arabicName: "الإسراء",
    totalAyahs: 111,
    juzStart: 15,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 15, startAyah: 1, endAyah: 111 }],
  },
  {
    number: 18,
    name: "Al-Kahf",
    arabicName: "الكهف",
    totalAyahs: 110,
    juzStart: 15,
    juzEnd: 16,
    revelation: "Meccan",
    juzBoundaries: [
      { juzNumber: 15, startAyah: 1, endAyah: 74 },
      { juzNumber: 16, startAyah: 75, endAyah: 110 },
    ],
  },
  {
    number: 19,
    name: "Maryam",
    arabicName: "مريم",
    totalAyahs: 98,
    juzStart: 16,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 16, startAyah: 1, endAyah: 98 }],
  },
  {
    number: 20,
    name: "Taha",
    arabicName: "طه",
    totalAyahs: 135,
    juzStart: 16,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 16, startAyah: 1, endAyah: 135 }],
  },
  {
    number: 21,
    name: "Al-Anbiya",
    arabicName: "الأنبياء",
    totalAyahs: 112,
    juzStart: 17,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 17, startAyah: 1, endAyah: 112 }],
  },
  {
    number: 22,
    name: "Al-Hajj",
    arabicName: "الحج",
    totalAyahs: 78,
    juzStart: 17,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 17, startAyah: 1, endAyah: 78 }],
  },
  {
    number: 23,
    name: "Al-Muminun",
    arabicName: "المؤمنون",
    totalAyahs: 118,
    juzStart: 18,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 18, startAyah: 1, endAyah: 118 }],
  },
  {
    number: 24,
    name: "An-Nur",
    arabicName: "النور",
    totalAyahs: 64,
    juzStart: 18,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 18, startAyah: 1, endAyah: 64 }],
  },
  {
    number: 25,
    name: "Al-Furqan",
    arabicName: "الفرقان",
    totalAyahs: 77,
    juzStart: 18,
    juzEnd: 19,
    revelation: "Meccan",
    juzBoundaries: [
      { juzNumber: 18, startAyah: 1, endAyah: 20 },
      { juzNumber: 19, startAyah: 21, endAyah: 77 },
    ],
  },
  // Continue with remaining surahs...
  {
    number: 26,
    name: "Ash-Shuara",
    arabicName: "الشعراء",
    totalAyahs: 227,
    juzStart: 19,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 19, startAyah: 1, endAyah: 227 }],
  },
  {
    number: 27,
    name: "An-Naml",
    arabicName: "النمل",
    totalAyahs: 93,
    juzStart: 19,
    juzEnd: 20,
    revelation: "Meccan",
    juzBoundaries: [
      { juzNumber: 19, startAyah: 1, endAyah: 55 },
      { juzNumber: 20, startAyah: 56, endAyah: 93 },
    ],
  },
  {
    number: 28,
    name: "Al-Qasas",
    arabicName: "القصص",
    totalAyahs: 88,
    juzStart: 20,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 20, startAyah: 1, endAyah: 88 }],
  },
  {
    number: 29,
    name: "Al-Ankabut",
    arabicName: "العنكبوت",
    totalAyahs: 69,
    juzStart: 20,
    juzEnd: 21,
    revelation: "Meccan",
    juzBoundaries: [
      { juzNumber: 20, startAyah: 1, endAyah: 45 },
      { juzNumber: 21, startAyah: 46, endAyah: 69 },
    ],
  },
  {
    number: 30,
    name: "Ar-Rum",
    arabicName: "الروم",
    totalAyahs: 60,
    juzStart: 21,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 21, startAyah: 1, endAyah: 60 }],
  },
  {
    number: 31,
    name: "Luqman",
    arabicName: "لقمان",
    totalAyahs: 34,
    juzStart: 21,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 21, startAyah: 1, endAyah: 34 }],
  },
  {
    number: 32,
    name: "As-Sajdah",
    arabicName: "السجدة",
    totalAyahs: 30,
    juzStart: 21,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 21, startAyah: 1, endAyah: 30 }],
  },
  {
    number: 33,
    name: "Al-Ahzab",
    arabicName: "الأحزاب",
    totalAyahs: 73,
    juzStart: 21,
    juzEnd: 22,
    revelation: "Medinan",
    juzBoundaries: [
      { juzNumber: 21, startAyah: 1, endAyah: 30 },
      { juzNumber: 22, startAyah: 31, endAyah: 73 },
    ],
  },
  {
    number: 34,
    name: "Saba",
    arabicName: "سبأ",
    totalAyahs: 54,
    juzStart: 22,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 22, startAyah: 1, endAyah: 54 }],
  },
  {
    number: 35,
    name: "Fatir",
    arabicName: "فاطر",
    totalAyahs: 45,
    juzStart: 22,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 22, startAyah: 1, endAyah: 45 }],
  },
  {
    number: 36,
    name: "Ya-Sin",
    arabicName: "يس",
    totalAyahs: 83,
    juzStart: 22,
    juzEnd: 23,
    revelation: "Meccan",
    juzBoundaries: [
      { juzNumber: 22, startAyah: 1, endAyah: 27 },
      { juzNumber: 23, startAyah: 28, endAyah: 83 },
    ],
  },
  {
    number: 37,
    name: "As-Saffat",
    arabicName: "الصافات",
    totalAyahs: 182,
    juzStart: 23,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 23, startAyah: 1, endAyah: 182 }],
  },
  {
    number: 38,
    name: "Sad",
    arabicName: "ص",
    totalAyahs: 88,
    juzStart: 23,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 23, startAyah: 1, endAyah: 88 }],
  },
  {
    number: 39,
    name: "Az-Zumar",
    arabicName: "الزمر",
    totalAyahs: 75,
    juzStart: 23,
    juzEnd: 24,
    revelation: "Meccan",
    juzBoundaries: [
      { juzNumber: 23, startAyah: 1, endAyah: 31 },
      { juzNumber: 24, startAyah: 32, endAyah: 75 },
    ],
  },
  {
    number: 40,
    name: "Ghafir",
    arabicName: "غافر",
    totalAyahs: 85,
    juzStart: 24,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 24, startAyah: 1, endAyah: 85 }],
  },
  {
    number: 41,
    name: "Fussilat",
    arabicName: "فصلت",
    totalAyahs: 54,
    juzStart: 24,
    juzEnd: 25,
    revelation: "Meccan",
    juzBoundaries: [
      { juzNumber: 24, startAyah: 1, endAyah: 46 },
      { juzNumber: 25, startAyah: 47, endAyah: 54 },
    ],
  },
  {
    number: 42,
    name: "Ash-Shuraa",
    arabicName: "الشورى",
    totalAyahs: 53,
    juzStart: 25,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 25, startAyah: 1, endAyah: 53 }],
  },
  {
    number: 43,
    name: "Az-Zukhruf",
    arabicName: "الزخرف",
    totalAyahs: 89,
    juzStart: 25,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 25, startAyah: 1, endAyah: 89 }],
  },
  {
    number: 44,
    name: "Ad-Dukhan",
    arabicName: "الدخان",
    totalAyahs: 59,
    juzStart: 25,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 25, startAyah: 1, endAyah: 59 }],
  },
  {
    number: 45,
    name: "Al-Jathiyah",
    arabicName: "الجاثية",
    totalAyahs: 37,
    juzStart: 25,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 25, startAyah: 1, endAyah: 37 }],
  },
  {
    number: 46,
    name: "Al-Ahqaf",
    arabicName: "الأحقاف",
    totalAyahs: 35,
    juzStart: 26,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 26, startAyah: 1, endAyah: 35 }],
  },
  {
    number: 47,
    name: "Muhammad",
    arabicName: "محمد",
    totalAyahs: 38,
    juzStart: 26,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 26, startAyah: 1, endAyah: 38 }],
  },
  {
    number: 48,
    name: "Al-Fath",
    arabicName: "الفتح",
    totalAyahs: 29,
    juzStart: 26,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 26, startAyah: 1, endAyah: 29 }],
  },
  {
    number: 49,
    name: "Al-Hujurat",
    arabicName: "الحجرات",
    totalAyahs: 18,
    juzStart: 26,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 26, startAyah: 1, endAyah: 18 }],
  },
  {
    number: 50,
    name: "Qaf",
    arabicName: "ق",
    totalAyahs: 45,
    juzStart: 26,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 26, startAyah: 1, endAyah: 45 }],
  },
  {
    number: 51,
    name: "Adh-Dhariyat",
    arabicName: "الذاريات",
    totalAyahs: 60,
    juzStart: 26,
    juzEnd: 27,
    revelation: "Meccan",
    juzBoundaries: [
      { juzNumber: 26, startAyah: 1, endAyah: 30 },
      { juzNumber: 27, startAyah: 31, endAyah: 60 },
    ],
  },
  {
    number: 52,
    name: "At-Tur",
    arabicName: "الطور",
    totalAyahs: 49,
    juzStart: 27,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 27, startAyah: 1, endAyah: 49 }],
  },
  {
    number: 53,
    name: "An-Najm",
    arabicName: "النجم",
    totalAyahs: 62,
    juzStart: 27,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 27, startAyah: 1, endAyah: 62 }],
  },
  {
    number: 54,
    name: "Al-Qamar",
    arabicName: "القمر",
    totalAyahs: 55,
    juzStart: 27,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 27, startAyah: 1, endAyah: 55 }],
  },
  {
    number: 55,
    name: "Ar-Rahman",
    arabicName: "الرحمن",
    totalAyahs: 78,
    juzStart: 27,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 27, startAyah: 1, endAyah: 78 }],
  },
  {
    number: 56,
    name: "Al-Waqiah",
    arabicName: "الواقعة",
    totalAyahs: 96,
    juzStart: 27,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 27, startAyah: 1, endAyah: 96 }],
  },
  {
    number: 57,
    name: "Al-Hadid",
    arabicName: "الحديد",
    totalAyahs: 29,
    juzStart: 27,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 27, startAyah: 1, endAyah: 29 }],
  },
  {
    number: 58,
    name: "Al-Mujadila",
    arabicName: "المجادلة",
    totalAyahs: 22,
    juzStart: 28,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 28, startAyah: 1, endAyah: 22 }],
  },
  {
    number: 59,
    name: "Al-Hashr",
    arabicName: "الحشر",
    totalAyahs: 24,
    juzStart: 28,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 28, startAyah: 1, endAyah: 24 }],
  },
  {
    number: 60,
    name: "Al-Mumtahanah",
    arabicName: "الممتحنة",
    totalAyahs: 13,
    juzStart: 28,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 28, startAyah: 1, endAyah: 13 }],
  },
  {
    number: 61,
    name: "As-Saff",
    arabicName: "الصف",
    totalAyahs: 14,
    juzStart: 28,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 28, startAyah: 1, endAyah: 14 }],
  },
  {
    number: 62,
    name: "Al-Jumuah",
    arabicName: "الجمعة",
    totalAyahs: 11,
    juzStart: 28,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 28, startAyah: 1, endAyah: 11 }],
  },
  {
    number: 63,
    name: "Al-Munafiqun",
    arabicName: "المنافقون",
    totalAyahs: 11,
    juzStart: 28,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 28, startAyah: 1, endAyah: 11 }],
  },
  {
    number: 64,
    name: "At-Taghabun",
    arabicName: "التغابن",
    totalAyahs: 18,
    juzStart: 28,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 28, startAyah: 1, endAyah: 18 }],
  },
  {
    number: 65,
    name: "At-Talaq",
    arabicName: "الطلاق",
    totalAyahs: 12,
    juzStart: 28,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 28, startAyah: 1, endAyah: 12 }],
  },
  {
    number: 66,
    name: "At-Tahrim",
    arabicName: "التحريم",
    totalAyahs: 12,
    juzStart: 28,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 28, startAyah: 1, endAyah: 12 }],
  },
  {
    number: 67,
    name: "Al-Mulk",
    arabicName: "الملك",
    totalAyahs: 30,
    juzStart: 29,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 29, startAyah: 1, endAyah: 30 }],
  },
  {
    number: 68,
    name: "Al-Qalam",
    arabicName: "القلم",
    totalAyahs: 52,
    juzStart: 29,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 29, startAyah: 1, endAyah: 52 }],
  },
  {
    number: 69,
    name: "Al-Haqqah",
    arabicName: "الحاقة",
    totalAyahs: 52,
    juzStart: 29,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 29, startAyah: 1, endAyah: 52 }],
  },
  {
    number: 70,
    name: "Al-Maarij",
    arabicName: "المعارج",
    totalAyahs: 44,
    juzStart: 29,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 29, startAyah: 1, endAyah: 44 }],
  },
  {
    number: 71,
    name: "Nuh",
    arabicName: "نوح",
    totalAyahs: 28,
    juzStart: 29,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 29, startAyah: 1, endAyah: 28 }],
  },
  {
    number: 72,
    name: "Al-Jinn",
    arabicName: "الجن",
    totalAyahs: 28,
    juzStart: 29,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 29, startAyah: 1, endAyah: 28 }],
  },
  {
    number: 73,
    name: "Al-Muzzammil",
    arabicName: "المزمل",
    totalAyahs: 20,
    juzStart: 29,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 29, startAyah: 1, endAyah: 20 }],
  },
  {
    number: 74,
    name: "Al-Muddaththir",
    arabicName: "المدثر",
    totalAyahs: 56,
    juzStart: 29,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 29, startAyah: 1, endAyah: 56 }],
  },
  {
    number: 75,
    name: "Al-Qiyamah",
    arabicName: "القيامة",
    totalAyahs: 40,
    juzStart: 29,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 29, startAyah: 1, endAyah: 40 }],
  },
  {
    number: 76,
    name: "Al-Insan",
    arabicName: "الإنسان",
    totalAyahs: 31,
    juzStart: 29,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 29, startAyah: 1, endAyah: 31 }],
  },
  {
    number: 77,
    name: "Al-Mursalat",
    arabicName: "المرسلات",
    totalAyahs: 50,
    juzStart: 29,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 29, startAyah: 1, endAyah: 50 }],
  },
  {
    number: 78,
    name: "An-Naba",
    arabicName: "النبأ",
    totalAyahs: 40,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 40 }],
  },
  {
    number: 79,
    name: "An-Naziat",
    arabicName: "النازعات",
    totalAyahs: 46,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 46 }],
  },
  {
    number: 80,
    name: "Abasa",
    arabicName: "عبس",
    totalAyahs: 42,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 42 }],
  },
  {
    number: 81,
    name: "At-Takwir",
    arabicName: "التكوير",
    totalAyahs: 29,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 29 }],
  },
  {
    number: 82,
    name: "Al-Infitar",
    arabicName: "الإنفطار",
    totalAyahs: 19,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 19 }],
  },
  {
    number: 83,
    name: "Al-Mutaffifin",
    arabicName: "المطففين",
    totalAyahs: 36,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 36 }],
  },
  {
    number: 84,
    name: "Al-Inshiqaq",
    arabicName: "الإنشقاق",
    totalAyahs: 25,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 25 }],
  },
  {
    number: 85,
    name: "Al-Buruj",
    arabicName: "البروج",
    totalAyahs: 22,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 22 }],
  },
  {
    number: 86,
    name: "At-Tariq",
    arabicName: "الطارق",
    totalAyahs: 17,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 17 }],
  },
  {
    number: 87,
    name: "Al-Ala",
    arabicName: "الأعلى",
    totalAyahs: 19,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 19 }],
  },
  {
    number: 88,
    name: "Al-Ghashiyah",
    arabicName: "الغاشية",
    totalAyahs: 26,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 26 }],
  },
  {
    number: 89,
    name: "Al-Fajr",
    arabicName: "الفجر",
    totalAyahs: 30,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 30 }],
  },
  {
    number: 90,
    name: "Al-Balad",
    arabicName: "البلد",
    totalAyahs: 20,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 20 }],
  },
  {
    number: 91,
    name: "Ash-Shams",
    arabicName: "الشمس",
    totalAyahs: 15,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 15 }],
  },
  {
    number: 92,
    name: "Al-Layl",
    arabicName: "الليل",
    totalAyahs: 21,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 21 }],
  },
  {
    number: 93,
    name: "Ad-Duhaa",
    arabicName: "الضحى",
    totalAyahs: 11,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 11 }],
  },
  {
    number: 94,
    name: "Ash-Sharh",
    arabicName: "الشرح",
    totalAyahs: 8,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 8 }],
  },
  {
    number: 95,
    name: "At-Tin",
    arabicName: "التين",
    totalAyahs: 8,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 8 }],
  },
  {
    number: 96,
    name: "Al-Alaq",
    arabicName: "العلق",
    totalAyahs: 19,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 19 }],
  },
  {
    number: 97,
    name: "Al-Qadr",
    arabicName: "القدر",
    totalAyahs: 5,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 5 }],
  },
  {
    number: 98,
    name: "Al-Bayyinah",
    arabicName: "البينة",
    totalAyahs: 8,
    juzStart: 30,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 8 }],
  },
  {
    number: 99,
    name: "Az-Zalzalah",
    arabicName: "الزلزلة",
    totalAyahs: 8,
    juzStart: 30,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 8 }],
  },
  {
    number: 100,
    name: "Al-Adiyat",
    arabicName: "العاديات",
    totalAyahs: 11,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 11 }],
  },
  {
    number: 101,
    name: "Al-Qariah",
    arabicName: "القارعة",
    totalAyahs: 11,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 11 }],
  },
  {
    number: 102,
    name: "At-Takathur",
    arabicName: "التكاثر",
    totalAyahs: 8,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 8 }],
  },
  {
    number: 103,
    name: "Al-Asr",
    arabicName: "العصر",
    totalAyahs: 3,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 3 }],
  },
  {
    number: 104,
    name: "Al-Humazah",
    arabicName: "الهمزة",
    totalAyahs: 9,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 9 }],
  },
  {
    number: 105,
    name: "Al-Fil",
    arabicName: "الفيل",
    totalAyahs: 5,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 5 }],
  },
  {
    number: 106,
    name: "Quraysh",
    arabicName: "قريش",
    totalAyahs: 4,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 4 }],
  },
  {
    number: 107,
    name: "Al-Maun",
    arabicName: "الماعون",
    totalAyahs: 7,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 7 }],
  },
  {
    number: 108,
    name: "Al-Kawthar",
    arabicName: "الكوثر",
    totalAyahs: 3,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 3 }],
  },
  {
    number: 109,
    name: "Al-Kafirun",
    arabicName: "الكافرون",
    totalAyahs: 6,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 6 }],
  },
  {
    number: 110,
    name: "An-Nasr",
    arabicName: "النصر",
    totalAyahs: 3,
    juzStart: 30,
    revelation: "Medinan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 3 }],
  },
  {
    number: 111,
    name: "Al-Masad",
    arabicName: "المسد",
    totalAyahs: 5,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 5 }],
  },
  {
    number: 112,
    name: "Al-Ikhlas",
    arabicName: "الإخلاص",
    totalAyahs: 4,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 4 }],
  },
  {
    number: 113,
    name: "Al-Falaq",
    arabicName: "الفلق",
    totalAyahs: 5,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 5 }],
  },
  {
    number: 114,
    name: "An-Nas",
    arabicName: "الناس",
    totalAyahs: 6,
    juzStart: 30,
    revelation: "Meccan",
    juzBoundaries: [{ juzNumber: 30, startAyah: 1, endAyah: 6 }],
  },
];

// Helper functions
export function getSurahByName(name: string): SurahInfo | undefined {
  return SURAHS_COMPLETE.find((surah) => surah.name === name);
}

export function getSurahByNumber(number: number): SurahInfo | undefined {
  return SURAHS_COMPLETE.find((surah) => surah.number === number);
}

export function getJuzFromSurahAyah(
  surahNumber: number,
  ayahNumber: number
): number {
  const surah = getSurahByNumber(surahNumber);
  if (!surah) return 1;

  // Use precise boundaries if available
  if (surah.juzBoundaries) {
    for (const boundary of surah.juzBoundaries) {
      if (
        ayahNumber >= boundary.startAyah &&
        (boundary.endAyah === undefined || ayahNumber <= boundary.endAyah)
      ) {
        return boundary.juzNumber;
      }
    }
  }

  // Fallback to juzStart
  return surah.juzStart;
}

export function getJuzRange(
  surahNumber: number,
  ayahStart: number,
  ayahEnd: number
): { startJuz: number; endJuz: number; juzList: number[] } {
  const startJuz = getJuzFromSurahAyah(surahNumber, ayahStart);
  const endJuz = getJuzFromSurahAyah(surahNumber, ayahEnd);

  const juzList: number[] = [];
  for (let juz = startJuz; juz <= endJuz; juz++) {
    juzList.push(juz);
  }

  return { startJuz, endJuz, juzList };
}

export function validateAyahRange(
  surahNumber: number,
  startAyah: number,
  endAyah: number
): boolean {
  const surah = getSurahByNumber(surahNumber);
  if (!surah) return false;

  return startAyah >= 1 && endAyah <= surah.totalAyahs && startAyah <= endAyah;
}

export function estimatePagesRead(
  surahNumber: number,
  ayahStart: number,
  ayahEnd: number
): number {
  const surah = getSurahByNumber(surahNumber);
  if (!surah) return 1;

  let totalPages = 0;

  if (surah.juzBoundaries) {
    // Use precise juz boundaries and page data for accurate calculation
    for (const boundary of surah.juzBoundaries) {
      const juzStart = boundary.startAyah;
      const juzEnd = boundary.endAyah || surah.totalAyahs;

      // Check if this juz overlaps with our ayah range
      const overlapStart = Math.max(ayahStart, juzStart);
      const overlapEnd = Math.min(ayahEnd, juzEnd);

      if (overlapStart <= overlapEnd) {
        if (boundary.startPage && boundary.endPage) {
          // Use precise page data when available
          const juzAyahCount = juzEnd - juzStart + 1;
          const overlapAyahCount = overlapEnd - overlapStart + 1;
          const boundaryPageCount = boundary.endPage - boundary.startPage + 1;

          // Calculate proportional pages within this boundary
          const proportion = overlapAyahCount / juzAyahCount;
          totalPages += proportion * boundaryPageCount;
        } else {
          // Fallback to juz-based calculation for boundaries without page data
          const juzPageCount = PAGES_PER_JUZ[boundary.juzNumber] || 20;
          const juzAyahCount = juzEnd - juzStart + 1;
          const overlapAyahCount = overlapEnd - overlapStart + 1;
          const proportion = overlapAyahCount / juzAyahCount;

          totalPages += proportion * juzPageCount;
        }
      }
    }
  } else {
    // Fallback: Use juz-based calculation for surahs without precise boundaries
    const startJuz = getJuzFromSurahAyah(surahNumber, ayahStart);
    const endJuz = getJuzFromSurahAyah(surahNumber, ayahEnd);

    if (startJuz === endJuz) {
      // Single juz, estimate proportionally
      const juzPageCount = PAGES_PER_JUZ[startJuz] || 20;
      const ayahCount = ayahEnd - ayahStart + 1;
      const estimatedAyahsPerPage = 13;
      totalPages = Math.min(ayahCount / estimatedAyahsPerPage, juzPageCount);
    } else {
      // Multiple juz, sum them up
      for (let juz = startJuz; juz <= endJuz; juz++) {
        totalPages += PAGES_PER_JUZ[juz] || 20;
      }
    }
  }

  return Math.ceil(totalPages);
}
