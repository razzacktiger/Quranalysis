#!/usr/bin/env node

/**
 * Script to fix surah name mismatches between our complete data and database enum
 *
 * Database enum values (from Supabase MCP):
 */

const DATABASE_ENUM_VALUES = [
  "Al-Fatiha",
  "Al-Baqarah",
  "Ali Imran",
  "An-Nisa",
  "Al-Maidah",
  "Al-Anam",
  "Al-Araf",
  "Al-Anfal",
  "At-Tawbah",
  "Yunus",
  "Hud",
  "Yusuf",
  "Ar-Rad",
  "Ibrahim",
  "Al-Hijr",
  "An-Nahl",
  "Al-Isra",
  "Al-Kahf",
  "Maryam",
  "Taha",
  "Al-Anbiya",
  "Al-Hajj",
  "Al-Muminun",
  "An-Nur",
  "Al-Furqan",
  "Ash-Shuara",
  "An-Naml",
  "Al-Qasas",
  "Al-Ankabut",
  "Ar-Rum",
  "Luqman",
  "As-Sajdah",
  "Al-Ahzab",
  "Saba",
  "Fatir",
  "Ya-Sin",
  "As-Saffat",
  "Sad",
  "Az-Zumar",
  "Ghafir",
  "Fussilat",
  "Ash-Shuraa",
  "Az-Zukhruf",
  "Ad-Dukhan",
  "Al-Jathiyah",
  "Al-Ahqaf",
  "Muhammad",
  "Al-Fath",
  "Al-Hujurat",
  "Qaf",
  "Adh-Dhariyat",
  "At-Tur",
  "An-Najm",
  "Al-Qamar",
  "Ar-Rahman",
  "Al-Waqiah",
  "Al-Hadid",
  "Al-Mujadila",
  "Al-Hashr",
  "Al-Mumtahanah",
  "As-Saff",
  "Al-Jumuah",
  "Al-Munafiqun",
  "At-Taghabun",
  "At-Talaq",
  "At-Tahrim",
  "Al-Mulk",
  "Al-Qalam",
  "Al-Haqqah",
  "Al-Maarij",
  "Nuh",
  "Al-Jinn",
  "Al-Muzzammil",
  "Al-Muddaththir",
  "Al-Qiyamah",
  "Al-Insan",
  "Al-Mursalat",
  "An-Naba",
  "An-Naziat",
  "Abasa",
  "At-Takwir",
  "Al-Infitar",
  "Al-Mutaffifin",
  "Al-Inshiqaq",
  "Al-Buruj",
  "At-Tariq",
  "Al-Ala",
  "Al-Ghashiyah",
  "Al-Fajr",
  "Al-Balad",
  "Ash-Shams",
  "Al-Layl",
  "Ad-Duhaa",
  "Ash-Sharh",
  "At-Tin",
  "Al-Alaq",
  "Al-Qadr",
  "Al-Bayyinah",
  "Az-Zalzalah",
  "Al-Adiyat",
  "Al-Qariah",
  "At-Takathur",
  "Al-Asr",
  "Al-Humazah",
  "Al-Fil",
  "Quraysh",
  "Al-Maun",
  "Al-Kawthar",
  "Al-Kafirun",
  "An-Nasr",
  "Al-Masad",
  "Al-Ikhlas",
  "Al-Falaq",
  "An-Nas",
];

console.log("🔍 Database Enum Analysis:");
console.log(`Total surahs in database enum: ${DATABASE_ENUM_VALUES.length}`);

// Key differences noticed:
const KEY_DIFFERENCES = {
  "Ali 'Imran": "Ali Imran", // Remove apostrophe
  "Al-An'am": "Al-Anam", // Remove apostrophe
  "Al-A'raf": "Al-Araf", // Remove apostrophe
  "Ar-Ra'd": "Ar-Rad", // Different transliteration
  "Ta-Ha": "Taha", // Different hyphenation
  "Al-'Ankabut": "Al-Ankabut", // Remove apostrophe
  "Al-Waqi'ah": "Al-Waqiah", // Different transliteration
  "Al-Jumu'ah": "Al-Jumuah", // Different transliteration
  "Al-Ma'arij": "Al-Maarij", // Different transliteration
  "An-Nazi'at": "An-Naziat", // Different transliteration
  "'Abasa": "Abasa", // Remove apostrophe
  "Al-A'la": "Al-Ala", // Remove apostrophe
  "Al-'Alaq": "Al-Alaq", // Remove apostrophe
  "Al-'Adiyat": "Al-Adiyat", // Remove apostrophe
  "Al-Qari'ah": "Al-Qariah", // Different transliteration
  "Al-Ma'un": "Al-Maun", // Remove apostrophe
};

console.log("\n🔧 Key naming differences found:");
Object.entries(KEY_DIFFERENCES).forEach(([ourName, dbName]) => {
  console.log(`  "${ourName}" → "${dbName}"`);
});

console.log(
  "\n✅ Fix: Update surahs-complete.ts to match database enum exactly."
);
