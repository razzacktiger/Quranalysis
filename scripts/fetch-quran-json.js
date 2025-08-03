#!/usr/bin/env node

/**
 * Fetch Complete Quran JSON with Page Mappings
 * 
 * This script downloads the complete quran.json from GitHub that includes
 * ayah-to-page mappings and other categorizations.
 * 
 * Source: https://github.com/azvox/quran.json
 * 
 * Usage: node scripts/fetch-quran-json.js
 */

const fs = require("fs");
const path = require("path");

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
}

async function main() {
  console.log("🕌 Fetching Complete Quran JSON with Page Mappings...");
  
  try {
    // GitHub raw file URL for the complete quran.json
    const quranJsonUrl = 'https://raw.githubusercontent.com/azvox/quran.json/master/quran.json';
    
    console.log("📥 Downloading complete Quran JSON...");
    const quranData = await fetchJSON(quranJsonUrl);
    
    console.log("✅ Downloaded successfully!");
    console.log(`📊 Data contains ${Object.keys(quranData).length} top-level properties`);
    
    // Analyze the structure
    const sampleKeys = Object.keys(quranData).slice(0, 5);
    console.log("🔍 Sample keys:", sampleKeys);
    
    if (sampleKeys.length > 0) {
      const firstItem = quranData[sampleKeys[0]];
      console.log("📄 Sample data structure:");
      console.log(JSON.stringify(firstItem, null, 2));
    }
    
    // Look for page information
    let hasPageInfo = false;
    let sampleWithPage = null;
    
    for (const key of Object.keys(quranData).slice(0, 10)) {
      const item = quranData[key];
      if (item && typeof item === 'object') {
        const itemKeys = Object.keys(item);
        if (itemKeys.some(k => k.toLowerCase().includes('page'))) {
          hasPageInfo = true;
          sampleWithPage = item;
          break;
        }
      }
    }
    
    if (hasPageInfo) {
      console.log("✅ Found page information!");
      console.log("📄 Sample with page data:");
      console.log(JSON.stringify(sampleWithPage, null, 2));
      
      // Process and create our page mapping
      processQuranData(quranData);
    } else {
      console.log("⚠️ No obvious page information found");
      console.log("💡 Let's check the data structure more carefully...");
      
      // Check if it's an array of verses
      if (Array.isArray(quranData)) {
        console.log(`📊 Data is an array with ${quranData.length} items`);
        if (quranData.length > 0) {
          console.log("📄 First array item:");
          console.log(JSON.stringify(quranData[0], null, 2));
        }
      } else {
        // Check nested structure
        const firstValue = quranData[Object.keys(quranData)[0]];
        if (Array.isArray(firstValue)) {
          console.log(`📊 Nested structure: ${Object.keys(quranData).length} top-level keys, first contains ${firstValue.length} items`);
          if (firstValue.length > 0) {
            console.log("📄 First nested item:");
            console.log(JSON.stringify(firstValue[0], null, 2));
          }
        }
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

function processQuranData(quranData) {
  console.log("\\n🔄 Processing Quran JSON data...");
  
  const ayahToPageMapping = {};
  const pageToAyahMapping = {};
  const juzBoundaries = {};
  
  // Process based on the structure we find
  let processedCount = 0;
  
  if (Array.isArray(quranData)) {
    // Array of verses
    quranData.forEach((verse, index) => {
      processVerse(verse, index);
    });
  } else {
    // Object structure
    Object.values(quranData).forEach((item, index) => {
      if (Array.isArray(item)) {
        item.forEach((verse, vIndex) => {
          processVerse(verse, `${index}.${vIndex}`);
        });
      } else {
        processVerse(item, index);
      }
    });
  }
  
  function processVerse(verse, id) {
    if (!verse || typeof verse !== 'object') return;
    
    // Try to extract page, surah, ayah information (FIXED FOR COMMUNITY DATA)
    const pageFields = ['pageid', 'page', 'page_number', 'pageNumber'];
    const surahFields = ['chapter_number', 'surah', 'surah_number', 'surahNumber', 'chapter'];
    const ayahFields = ['Ayah_number', 'ayah', 'ayah_number', 'ayahNumber', 'verse', 'verseNumber'];
    const juzFields = ['juzid', 'juz', 'juz_number', 'juzNumber', 'para'];
    
    const page = extractField(verse, pageFields);
    const surah = extractField(verse, surahFields);
    const ayah = extractField(verse, ayahFields);
    const juz = extractField(verse, juzFields);
    
    if (page && surah && ayah) {
      // Create ayah-to-page mapping
      if (!ayahToPageMapping[surah]) {
        ayahToPageMapping[surah] = {};
      }
      ayahToPageMapping[surah][ayah] = page;
      
      // Create page-to-ayah mapping
      if (!pageToAyahMapping[page]) {
        pageToAyahMapping[page] = [];
      }
      pageToAyahMapping[page].push({ surah: parseInt(surah), ayah: parseInt(ayah) });
      
      // Track juz boundaries
      if (juz) {
        if (!juzBoundaries[juz]) {
          juzBoundaries[juz] = { startPage: page, endPage: page, surahs: new Set() };
        }
        juzBoundaries[juz].endPage = Math.max(juzBoundaries[juz].endPage, page);
        juzBoundaries[juz].surahs.add(parseInt(surah));
      }
      
      processedCount++;
    }
  }
  
  function extractField(obj, possibleFields) {
    for (const field of possibleFields) {
      if (obj[field] !== undefined && obj[field] !== null) {
        return parseInt(obj[field]) || obj[field];
      }
    }
    return null;
  }
  
  // Convert Sets to Arrays
  Object.keys(juzBoundaries).forEach(juz => {
    juzBoundaries[juz].surahs = Array.from(juzBoundaries[juz].surahs);
  });
  
  console.log(`✅ Processed ${processedCount} verses with page information`);
  
  if (processedCount > 0) {
    // Create final mapping
    const pageMapping = {
      metadata: {
        source: "Complete Quran JSON (azvox/quran.json)",
        format: "Standard Mushaf",
        totalProcessed: processedCount,
        totalPages: Object.keys(pageToAyahMapping).length,
        totalSurahs: Object.keys(ayahToPageMapping).length,
        description: "Direct ayah-to-page mapping from community Quran JSON",
        generatedAt: new Date().toISOString(),
      },
      ayahToPage: ayahToPageMapping,
      pageToAyah: pageToAyahMapping,
      juzBoundaries: juzBoundaries,
    };
    
    // Save data
    const dataDir = path.join(__dirname, "..", "src", "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(dataDir, "community-page-mapping.json"),
      JSON.stringify(pageMapping, null, 2)
    );
    
    // Generate TypeScript
    const tsContent = generateCommunityTypeScript(pageMapping);
    fs.writeFileSync(
      path.join(dataDir, "community-page-mapping.ts"),
      tsContent
    );
    
    console.log("✅ Created community-page-mapping.json");
    console.log("✅ Created community-page-mapping.ts");
    
    // Validate Al-Baqarah
    if (ayahToPageMapping[2]) {
      const baqarahPages = Object.values(ayahToPageMapping[2]);
      const minPage = Math.min(...baqarahPages);
      const maxPage = Math.max(...baqarahPages);
      const totalPages = maxPage - minPage + 1;
      
      console.log("\\n📊 Al-Baqarah Validation:");
      console.log(`   📖 Pages: ${minPage}-${maxPage} (${totalPages} total pages)`);
      console.log(`   🎯 Expected: ~48 pages (user verified)`);
      
      if (totalPages >= 45 && totalPages <= 50) {
        console.log("   ✅ VALIDATION PASSED: Page count matches expectation!");
      } else {
        console.log("   ⚠️ VALIDATION WARNING: Page count differs from expectation");
      }
    }
    
    console.log("\\n🎉 Community Quran JSON processing complete!");
  } else {
    console.log("❌ No verses with page information found");
  }
}

function generateCommunityTypeScript(pageMapping) {
  return `/**
 * Community Quran Page Mapping
 * 
 * Source: Complete Quran JSON from community repository
 * Generated: ${pageMapping.metadata.generatedAt}
 */

export interface CommunityPageMapping {
  metadata: {
    source: string;
    format: string;
    totalProcessed: number;
    totalPages: number;
    totalSurahs: number;
    description: string;
    generatedAt: string;
  };
  ayahToPage: Record<number, Record<number, number>>;
  pageToAyah: Record<number, Array<{ surah: number; ayah: number }>>;
  juzBoundaries: Record<number, { startPage: number; endPage: number; surahs: number[] }>;
}

export const COMMUNITY_PAGE_MAPPING: CommunityPageMapping = ${JSON.stringify(pageMapping, null, 2)};

/**
 * Get page number for a specific ayah (COMMUNITY DATA)
 */
export function getCommunityPageFromAyah(surahNumber: number, ayahNumber: number): number | null {
  return COMMUNITY_PAGE_MAPPING.ayahToPage[surahNumber]?.[ayahNumber] || null;
}

/**
 * Calculate pages read using community data
 */
export function calculateCommunityPagesRead(
  surahNumber: number,
  ayahStart: number,
  ayahEnd: number
): number {
  const startPage = getCommunityPageFromAyah(surahNumber, ayahStart);
  const endPage = getCommunityPageFromAyah(surahNumber, ayahEnd);
  
  if (!startPage || !endPage) {
    console.warn(\`Community page mapping not found for Surah \${surahNumber}, Ayahs \${ayahStart}-\${ayahEnd}\`);
    return 1;
  }
  
  return endPage - startPage + 1;
}`;
}

if (require.main === module) {
  main();
}

module.exports = { main };