// Complete list of Quran Surahs with metadata for calculations
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
}

export const SURAHS: SurahInfo[] = [
  {
    number: 1,
    name: "Al-Fatiha",
    arabicName: "الفاتحة",
    totalAyahs: 7,
    juzStart: 1,
    revelation: "Meccan",
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
      { juzNumber: 1, startAyah: 1, endAyah: 74 },
      { juzNumber: 2, startAyah: 75, endAyah: 252 },
      { juzNumber: 3, startAyah: 253, endAyah: 286 },
    ],
  },
  {
    number: 3,
    name: "Ali 'Imran",
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
      { juzNumber: 5, startAyah: 24, endAyah: 87 },
      { juzNumber: 6, startAyah: 88, endAyah: 176 },
    ],
  },
  {
    number: 5,
    name: "Al-Ma'idah",
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
    name: "Al-An'am",
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
    name: "Al-A'raf",
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
    juzBoundaries: [{ juzNumber: 9, startAyah: 1, endAyah: 75 }],
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
    name: "Ar-Ra'd",
    arabicName: "الرعد",
    totalAyahs: 43,
    juzStart: 13,
    revelation: "Medinan",
  },
  {
    number: 14,
    name: "Ibrahim",
    arabicName: "ابراهيم",
    totalAyahs: 52,
    juzStart: 13,
    revelation: "Meccan",
  },
  {
    number: 15,
    name: "Al-Hijr",
    arabicName: "الحجر",
    totalAyahs: 99,
    juzStart: 14,
    revelation: "Meccan",
  },
  {
    number: 16,
    name: "An-Nahl",
    arabicName: "النحل",
    totalAyahs: 128,
    juzStart: 14,
    revelation: "Meccan",
  },
  {
    number: 17,
    name: "Al-Isra",
    arabicName: "الإسراء",
    totalAyahs: 111,
    juzStart: 15,
    revelation: "Meccan",
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
  },
  {
    number: 20,
    name: "Ta-Ha",
    arabicName: "طه",
    totalAyahs: 135,
    juzStart: 16,
    revelation: "Meccan",
  },
  {
    number: 21,
    name: "Al-Anbya",
    arabicName: "الأنبياء",
    totalAyahs: 112,
    juzStart: 17,
    revelation: "Meccan",
  },
  {
    number: 22,
    name: "Al-Hajj",
    arabicName: "الحج",
    totalAyahs: 78,
    juzStart: 17,
    revelation: "Medinan",
  },
  {
    number: 23,
    name: "Al-Mu'minun",
    arabicName: "المؤمنون",
    totalAyahs: 118,
    juzStart: 18,
    revelation: "Meccan",
  },
  {
    number: 24,
    name: "An-Nur",
    arabicName: "النور",
    totalAyahs: 64,
    juzStart: 18,
    revelation: "Medinan",
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
  {
    number: 26,
    name: "Ash-Shu'ara",
    arabicName: "الشعراء",
    totalAyahs: 227,
    juzStart: 19,
    revelation: "Meccan",
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
  },
  {
    number: 29,
    name: "Al-'Ankabut",
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
  },
  {
    number: 31,
    name: "Luqman",
    arabicName: "لقمان",
    totalAyahs: 34,
    juzStart: 21,
    revelation: "Meccan",
  },
  {
    number: 32,
    name: "As-Sajdah",
    arabicName: "السجدة",
    totalAyahs: 30,
    juzStart: 21,
    revelation: "Meccan",
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
  },
  {
    number: 35,
    name: "Fatir",
    arabicName: "فاطر",
    totalAyahs: 45,
    juzStart: 22,
    revelation: "Meccan",
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
  },
  {
    number: 38,
    name: "Sad",
    arabicName: "ص",
    totalAyahs: 88,
    juzStart: 23,
    revelation: "Meccan",
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
  },
  {
    number: 43,
    name: "Az-Zukhruf",
    arabicName: "الزخرف",
    totalAyahs: 89,
    juzStart: 25,
    revelation: "Meccan",
  },
  {
    number: 44,
    name: "Ad-Dukhan",
    arabicName: "الدخان",
    totalAyahs: 59,
    juzStart: 25,
    revelation: "Meccan",
  },
  {
    number: 45,
    name: "Al-Jathiyah",
    arabicName: "الجاثية",
    totalAyahs: 37,
    juzStart: 25,
    revelation: "Meccan",
  },
  {
    number: 46,
    name: "Al-Ahqaf",
    arabicName: "الأحقاف",
    totalAyahs: 35,
    juzStart: 26,
    revelation: "Meccan",
  },
  {
    number: 47,
    name: "Muhammad",
    arabicName: "محمد",
    totalAyahs: 38,
    juzStart: 26,
    revelation: "Medinan",
  },
  {
    number: 48,
    name: "Al-Fath",
    arabicName: "الفتح",
    totalAyahs: 29,
    juzStart: 26,
    revelation: "Medinan",
  },
  {
    number: 49,
    name: "Al-Hujurat",
    arabicName: "الحجرات",
    totalAyahs: 18,
    juzStart: 26,
    revelation: "Medinan",
  },
  {
    number: 50,
    name: "Qaf",
    arabicName: "ق",
    totalAyahs: 45,
    juzStart: 26,
    revelation: "Meccan",
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
  },
  {
    number: 53,
    name: "An-Najm",
    arabicName: "النجم",
    totalAyahs: 62,
    juzStart: 27,
    revelation: "Meccan",
  },
  {
    number: 54,
    name: "Al-Qamar",
    arabicName: "القمر",
    totalAyahs: 55,
    juzStart: 27,
    revelation: "Meccan",
  },
  {
    number: 55,
    name: "Ar-Rahman",
    arabicName: "الرحمن",
    totalAyahs: 78,
    juzStart: 27,
    revelation: "Meccan",
  },
  {
    number: 56,
    name: "Al-Waqi'ah",
    arabicName: "الواقعة",
    totalAyahs: 96,
    juzStart: 27,
    revelation: "Meccan",
  },
  {
    number: 57,
    name: "Al-Hadid",
    arabicName: "الحديد",
    totalAyahs: 29,
    juzStart: 27,
    revelation: "Medinan",
  },
  {
    number: 58,
    name: "Al-Mujadila",
    arabicName: "المجادلة",
    totalAyahs: 22,
    juzStart: 28,
    revelation: "Medinan",
  },
  {
    number: 59,
    name: "Al-Hashr",
    arabicName: "الحشر",
    totalAyahs: 24,
    juzStart: 28,
    revelation: "Medinan",
  },
  {
    number: 60,
    name: "Al-Mumtahanah",
    arabicName: "الممتحنة",
    totalAyahs: 13,
    juzStart: 28,
    revelation: "Medinan",
  },
  {
    number: 61,
    name: "As-Saff",
    arabicName: "الصف",
    totalAyahs: 14,
    juzStart: 28,
    revelation: "Medinan",
  },
  {
    number: 62,
    name: "Al-Jumu'ah",
    arabicName: "الجمعة",
    totalAyahs: 11,
    juzStart: 28,
    revelation: "Medinan",
  },
  {
    number: 63,
    name: "Al-Munafiqun",
    arabicName: "المنافقون",
    totalAyahs: 11,
    juzStart: 28,
    revelation: "Medinan",
  },
  {
    number: 64,
    name: "At-Taghabun",
    arabicName: "التغابن",
    totalAyahs: 18,
    juzStart: 28,
    revelation: "Medinan",
  },
  {
    number: 65,
    name: "At-Talaq",
    arabicName: "الطلاق",
    totalAyahs: 12,
    juzStart: 28,
    revelation: "Medinan",
  },
  {
    number: 66,
    name: "At-Tahrim",
    arabicName: "التحريم",
    totalAyahs: 12,
    juzStart: 28,
    revelation: "Medinan",
  },
  {
    number: 67,
    name: "Al-Mulk",
    arabicName: "الملك",
    totalAyahs: 30,
    juzStart: 29,
    revelation: "Meccan",
  },
  {
    number: 68,
    name: "Al-Qalam",
    arabicName: "القلم",
    totalAyahs: 52,
    juzStart: 29,
    revelation: "Meccan",
  },
  {
    number: 69,
    name: "Al-Haqqah",
    arabicName: "الحاقة",
    totalAyahs: 52,
    juzStart: 29,
    revelation: "Meccan",
  },
  {
    number: 70,
    name: "Al-Ma'arij",
    arabicName: "المعارج",
    totalAyahs: 44,
    juzStart: 29,
    revelation: "Meccan",
  },
  {
    number: 71,
    name: "Nuh",
    arabicName: "نوح",
    totalAyahs: 28,
    juzStart: 29,
    revelation: "Meccan",
  },
  {
    number: 72,
    name: "Al-Jinn",
    arabicName: "الجن",
    totalAyahs: 28,
    juzStart: 29,
    revelation: "Meccan",
  },
  {
    number: 73,
    name: "Al-Muzzammil",
    arabicName: "المزمل",
    totalAyahs: 20,
    juzStart: 29,
    revelation: "Meccan",
  },
  {
    number: 74,
    name: "Al-Muddaththir",
    arabicName: "المدثر",
    totalAyahs: 56,
    juzStart: 29,
    revelation: "Meccan",
  },
  {
    number: 75,
    name: "Al-Qiyamah",
    arabicName: "القيامة",
    totalAyahs: 40,
    juzStart: 29,
    revelation: "Meccan",
  },
  {
    number: 76,
    name: "Al-Insan",
    arabicName: "الإنسان",
    totalAyahs: 31,
    juzStart: 29,
    revelation: "Medinan",
  },
  {
    number: 77,
    name: "Al-Mursalat",
    arabicName: "المرسلات",
    totalAyahs: 50,
    juzStart: 29,
    revelation: "Meccan",
  },
  {
    number: 78,
    name: "An-Naba",
    arabicName: "النبأ",
    totalAyahs: 40,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 79,
    name: "An-Nazi'at",
    arabicName: "النازعات",
    totalAyahs: 46,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 80,
    name: "Abasa",
    arabicName: "عبس",
    totalAyahs: 42,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 81,
    name: "At-Takwir",
    arabicName: "التكوير",
    totalAyahs: 29,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 82,
    name: "Al-Infitar",
    arabicName: "الإنفطار",
    totalAyahs: 19,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 83,
    name: "Al-Mutaffifin",
    arabicName: "المطففين",
    totalAyahs: 36,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 84,
    name: "Al-Inshiqaq",
    arabicName: "الإنشقاق",
    totalAyahs: 25,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 85,
    name: "Al-Buruj",
    arabicName: "البروج",
    totalAyahs: 22,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 86,
    name: "At-Tariq",
    arabicName: "الطارق",
    totalAyahs: 17,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 87,
    name: "Al-A'la",
    arabicName: "الأعلى",
    totalAyahs: 19,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 88,
    name: "Al-Ghashiyah",
    arabicName: "الغاشية",
    totalAyahs: 26,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 89,
    name: "Al-Fajr",
    arabicName: "الفجر",
    totalAyahs: 30,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 90,
    name: "Al-Balad",
    arabicName: "البلد",
    totalAyahs: 20,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 91,
    name: "Ash-Shams",
    arabicName: "الشمس",
    totalAyahs: 15,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 92,
    name: "Al-Layl",
    arabicName: "الليل",
    totalAyahs: 21,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 93,
    name: "Ad-Duhaa",
    arabicName: "الضحى",
    totalAyahs: 11,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 94,
    name: "Ash-Sharh",
    arabicName: "الشرح",
    totalAyahs: 8,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 95,
    name: "At-Tin",
    arabicName: "التين",
    totalAyahs: 8,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 96,
    name: "Al-'Alaq",
    arabicName: "العلق",
    totalAyahs: 19,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 97,
    name: "Al-Qadr",
    arabicName: "القدر",
    totalAyahs: 5,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 98,
    name: "Al-Bayyinah",
    arabicName: "البينة",
    totalAyahs: 8,
    juzStart: 30,
    revelation: "Medinan",
  },
  {
    number: 99,
    name: "Az-Zalzalah",
    arabicName: "الزلزلة",
    totalAyahs: 8,
    juzStart: 30,
    revelation: "Medinan",
  },
  {
    number: 100,
    name: "Al-'Adiyat",
    arabicName: "العاديات",
    totalAyahs: 11,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 101,
    name: "Al-Qari'ah",
    arabicName: "القارعة",
    totalAyahs: 11,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 102,
    name: "At-Takathur",
    arabicName: "التكاثر",
    totalAyahs: 8,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 103,
    name: "Al-'Asr",
    arabicName: "العصر",
    totalAyahs: 3,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 104,
    name: "Al-Humazah",
    arabicName: "الهمزة",
    totalAyahs: 9,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 105,
    name: "Al-Fil",
    arabicName: "الفيل",
    totalAyahs: 5,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 106,
    name: "Quraysh",
    arabicName: "قريش",
    totalAyahs: 4,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 107,
    name: "Al-Ma'un",
    arabicName: "الماعون",
    totalAyahs: 7,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 108,
    name: "Al-Kawthar",
    arabicName: "الكوثر",
    totalAyahs: 3,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 109,
    name: "Al-Kafirun",
    arabicName: "الكافرون",
    totalAyahs: 6,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 110,
    name: "An-Nasr",
    arabicName: "النصر",
    totalAyahs: 3,
    juzStart: 30,
    revelation: "Medinan",
  },
  {
    number: 111,
    name: "Al-Masad",
    arabicName: "المسد",
    totalAyahs: 5,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 112,
    name: "Al-Ikhlas",
    arabicName: "الإخلاص",
    totalAyahs: 4,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 113,
    name: "Al-Falaq",
    arabicName: "الفلق",
    totalAyahs: 5,
    juzStart: 30,
    revelation: "Meccan",
  },
  {
    number: 114,
    name: "An-Nas",
    arabicName: "الناس",
    totalAyahs: 6,
    juzStart: 30,
    revelation: "Meccan",
  },
];

// Helper functions for calculations
export function getSurahByName(name: string): SurahInfo | undefined {
  return SURAHS.find(
    (surah) =>
      surah.name.toLowerCase() === name.toLowerCase() ||
      surah.arabicName === name
  );
}

export function getSurahByNumber(number: number): SurahInfo | undefined {
  return SURAHS.find((surah) => surah.number === number);
}

export function getJuzFromSurahAyah(
  surahNumber: number,
  ayahNumber: number
): number {
  const surah = getSurahByNumber(surahNumber);
  if (!surah) return 1;

  // Use precise juz boundaries if available
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

  // Fallback to starting juz for surahs without detailed boundaries
  return surah.juzStart;
}

export function validateAyahRange(
  surahNumber: number,
  ayahStart: number,
  ayahEnd: number
): boolean {
  const surah = getSurahByNumber(surahNumber);
  if (!surah) return false;

  return ayahStart >= 1 && ayahEnd <= surah.totalAyahs && ayahStart <= ayahEnd;
}

// Get juz range for an ayah span (useful when reading spans multiple juz)
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

// Estimate pages read (rough calculation - 15 ayahs per page average)
export function estimatePagesRead(
  surahNumber: number,
  ayahStart: number,
  ayahEnd: number
): number {
  if (!validateAyahRange(surahNumber, ayahStart, ayahEnd)) return 0;

  const ayahCount = ayahEnd - ayahStart + 1;
  return Math.ceil(ayahCount / 15); // Rough estimate
}
