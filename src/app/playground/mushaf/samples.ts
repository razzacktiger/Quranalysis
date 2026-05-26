/**
 * Hardcoded sample passages for the Mushaf prototype.
 *
 * Source: Uthmani-script word text copied from
 * `Quranalysis-Mobile/assets/quran/surah-001.json` and `surah-002.json`.
 *
 * Reason: keeping this as a static module avoids any network/Supabase calls
 * for a throwaway prototype.
 */

import type { Category, Passage } from "./types";

export const CATEGORIES: Category[] = [
  { id: "tajweed", label: "Tajweed", color: "#EF4444" },
  { id: "memorization", label: "Memorization", color: "#F59E0B" },
  { id: "pronunciation", label: "Pronunciation", color: "#8B5CF6" },
  { id: "translation", label: "Translation", color: "#10B981" },
];

const fatihaAyahs: Array<{ ayah: number; words: string[] }> = [
  {
    ayah: 1,
    words: ["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَـٰنِ", "ٱلرَّحِيمِ"],
  },
  {
    ayah: 2,
    words: ["ٱلْحَمْدُ", "لِلَّهِ", "رَبِّ", "ٱلْعَـٰلَمِينَ"],
  },
  {
    ayah: 3,
    words: ["ٱلرَّحْمَـٰنِ", "ٱلرَّحِيمِ"],
  },
  {
    ayah: 4,
    words: ["مَـٰلِكِ", "يَوْمِ", "ٱلدِّينِ"],
  },
  {
    ayah: 5,
    words: ["إِيَّاكَ", "نَعْبُدُ", "وَإِيَّاكَ", "نَسْتَعِينُ"],
  },
  {
    ayah: 6,
    words: ["ٱهْدِنَا", "ٱلصِّرَٰطَ", "ٱلْمُسْتَقِيمَ"],
  },
  {
    ayah: 7,
    words: [
      "صِرَٰطَ",
      "ٱلَّذِينَ",
      "أَنْعَمْتَ",
      "عَلَيْهِمْ",
      "غَيْرِ",
      "ٱلْمَغْضُوبِ",
      "عَلَيْهِمْ",
      "وَلَا",
      "ٱلضَّآلِّينَ",
    ],
  },
];

const ayatulKursiWords: string[] = [
  "ٱللَّهُ",
  "لَآ",
  "إِلَـٰهَ",
  "إِلَّا",
  "هُوَ",
  "ٱلْحَىُّ",
  "ٱلْقَيُّومُ ۚ",
  "لَا",
  "تَأْخُذُهُۥ",
  "سِنَةٌۭ",
  "وَلَا",
  "نَوْمٌۭ ۚ",
  "لَّهُۥ",
  "مَا",
  "فِى",
  "ٱلسَّمَـٰوَٰتِ",
  "وَمَا",
  "فِى",
  "ٱلْأَرْضِ ۗ",
  "مَن",
  "ذَا",
  "ٱلَّذِى",
  "يَشْفَعُ",
  "عِندَهُۥٓ",
  "إِلَّا",
  "بِإِذْنِهِۦ ۚ",
  "يَعْلَمُ",
  "مَا",
  "بَيْنَ",
  "أَيْدِيهِمْ",
  "وَمَا",
  "خَلْفَهُمْ ۖ",
  "وَلَا",
  "يُحِيطُونَ",
  "بِشَىْءٍۢ",
  "مِّنْ",
  "عِلْمِهِۦٓ",
  "إِلَّا",
  "بِمَا",
  "شَآءَ ۚ",
  "وَسِعَ",
  "كُرْسِيُّهُ",
  "ٱلسَّمَـٰوَٰتِ",
  "وَٱلْأَرْضَ ۖ",
  "وَلَا",
  "يَـُٔودُهُۥ",
  "حِفْظُهُمَا ۚ",
  "وَهُوَ",
  "ٱلْعَلِىُّ",
  "ٱلْعَظِيمُ",
];

function buildPassage(
  id: string,
  surahNumber: number,
  surahNameArabic: string,
  surahNameEnglish: string,
  ayahs: Array<{ ayah: number; words: string[] }>,
): Passage {
  return {
    id,
    surahNumber,
    surahNameArabic,
    surahNameEnglish,
    ayahs: ayahs.map((a) => ({
      number: a.ayah,
      words: a.words.map((text, idx) => ({
        id: `${surahNumber}:${a.ayah}:${idx + 1}`,
        text,
        ayah: a.ayah,
        position: idx + 1,
      })),
    })),
  };
}

export const PASSAGES: Passage[] = [
  buildPassage("fatiha", 1, "الفاتحة", "Al-Fatiha", fatihaAyahs),
  buildPassage("ayatul-kursi", 2, "آية الكرسي", "Ayatul Kursi", [
    { ayah: 255, words: ayatulKursiWords },
  ]),
];
