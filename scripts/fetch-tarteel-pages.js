#!/usr/bin/env node

/**
 * Fetch TarteelAI Page Data
 *
 * This script downloads the authoritative page mapping data from TarteelAI
 * which provides accurate ayah-to-page mappings for different mushaf layouts.
 *
 * Source: https://github.com/TarteelAI/quran-assets/tree/main/pages
 *
 * Usage: node scripts/fetch-tarteel-pages.js
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
  console.log("🕌 Fetching TarteelAI Page Data...");

  try {
    // Try multiple public Quran data sources
    const dataSources = [
      {
        name: "Al-Quran Cloud",
        url: "https://api.alquran.cloud/v1/meta",
        type: "api",
      },
      {
        name: "Quran.com Pages",
        url: "https://api.quran.com/api/v4/quran/verses/uthmani",
        type: "api",
      },
      {
        name: "Manual Page Data",
        url: null,
        type: "manual",
      },
    ];

    console.log("📥 Downloading page mapping data...");

    // Fetch Uthmani page data (most relevant for QPC Uthmani Tajweed)
    const pageUthmani = await fetchJSON(pageDataUrls.page_uthmani);
    console.log("✅ Downloaded Uthmani page data");

    // Fetch surah metadata
    const surahsMeta = await fetchJSON(pageDataUrls.meta_info);
    console.log("✅ Downloaded surah metadata");

    // Create data directory
    const dataDir = path.join(__dirname, "..", "src", "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save raw data for reference
    fs.writeFileSync(
      path.join(dataDir, "tarteel-page-uthmani.json"),
      JSON.stringify(pageUthmani, null, 2)
    );

    fs.writeFileSync(
      path.join(dataDir, "tarteel-surahs-meta.json"),
      JSON.stringify(surahsMeta, null, 2)
    );

    console.log("💾 Saved raw data files");

    // Process data into our format
    console.log("🔄 Processing page mapping data...");

    const ayahToPageMapping = {};
    const pageToAyahMapping = {};

    // Process each page
    Object.entries(pageUthmani).forEach(([pageNumber, pageData]) => {
      const page = parseInt(pageNumber);

      pageData.forEach((ayahRef) => {
        const [surah, ayah] = ayahRef.split(":").map(Number);

        // Create ayah-to-page mapping
        if (!ayahToPageMapping[surah]) {
          ayahToPageMapping[surah] = {};
        }
        ayahToPageMapping[surah][ayah] = page;

        // Create page-to-ayah mapping
        if (!pageToAyahMapping[page]) {
          pageToAyahMapping[page] = [];
        }
        pageToAyahMapping[page].push({ surah, ayah });
      });
    });

    // Create the authoritative page mapping file
    const pageMapping = {
      metadata: {
        source: "TarteelAI Quran Assets",
        format: "Uthmani Mushaf",
        totalPages: Object.keys(pageUthmani).length,
        description: "Accurate ayah-to-page mapping for Uthmani mushaf layout",
        generatedAt: new Date().toISOString(),
      },
      ayahToPage: ayahToPageMapping,
      pageToAyah: pageToAyahMapping,
    };

    // Save processed mapping
    fs.writeFileSync(
      path.join(dataDir, "quran-page-mapping.json"),
      JSON.stringify(pageMapping, null, 2)
    );

    console.log("✅ Created quran-page-mapping.json");

    // Generate TypeScript interface
    const tsInterface = generateTypeScriptInterface(pageMapping);
    fs.writeFileSync(path.join(dataDir, "quran-page-mapping.ts"), tsInterface);

    console.log("✅ Created TypeScript interface");

    // Statistics
    const totalSurahs = Object.keys(ayahToPageMapping).length;
    const totalPages = Object.keys(pageToAyahMapping).length;

    console.log("\n📊 Statistics:");
    console.log(`   📖 Total Surahs: ${totalSurahs}`);
    console.log(`   📄 Total Pages: ${totalPages}`);
    console.log(
      `   🔢 Total Ayahs: ${Object.values(ayahToPageMapping).reduce(
        (sum, surah) => sum + Object.keys(surah).length,
        0
      )}`
    );

    // Test Al-Baqarah calculation
    const baqarahPages = Object.values(ayahToPageMapping[2] || {});
    const minPage = Math.min(...baqarahPages);
    const maxPage = Math.max(...baqarahPages);
    console.log(
      `   🕌 Al-Baqarah: Pages ${minPage}-${maxPage} (${
        maxPage - minPage + 1
      } pages)`
    );

    console.log("\n🎉 Success! TarteelAI page data integrated.");
    console.log("📁 Files created:");
    console.log("   - src/data/quran-page-mapping.json");
    console.log("   - src/data/quran-page-mapping.ts");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

function generateTypeScriptInterface(pageMapping) {
  return `/**
 * Authoritative Quran Page Mapping Data from TarteelAI
 * 
 * This file contains accurate ayah-to-page mappings for the Uthmani mushaf.
 * Source: TarteelAI Quran Assets
 * Generated: ${pageMapping.metadata.generatedAt}
 */

export interface PageMapping {
  metadata: {
    source: string;
    format: string;
    totalPages: number;
    description: string;
    generatedAt: string;
  };
  ayahToPage: Record<number, Record<number, number>>; // [surah][ayah] = page
  pageToAyah: Record<number, Array<{ surah: number; ayah: number }>>; // [page] = ayahs
}

export const QURAN_PAGE_MAPPING: PageMapping = ${JSON.stringify(
    pageMapping,
    null,
    2
  )};

/**
 * Get the page number for a specific ayah
 */
export function getPageFromAyah(surahNumber: number, ayahNumber: number): number | null {
  return QURAN_PAGE_MAPPING.ayahToPage[surahNumber]?.[ayahNumber] || null;
}

/**
 * Get all ayahs on a specific page
 */
export function getAyahsFromPage(pageNumber: number): Array<{ surah: number; ayah: number }> {
  return QURAN_PAGE_MAPPING.pageToAyah[pageNumber] || [];
}

/**
 * Calculate exact pages read for an ayah range (ACCURATE!)
 */
export function calculatePagesRead(
  surahNumber: number,
  ayahStart: number,
  ayahEnd: number
): number {
  const startPage = getPageFromAyah(surahNumber, ayahStart);
  const endPage = getPageFromAyah(surahNumber, ayahEnd);
  
  if (!startPage || !endPage) {
    console.warn(\`Page mapping not found for Surah \${surahNumber}, Ayahs \${ayahStart}-\${ayahEnd}\`);
    return 1; // Fallback
  }
  
  return endPage - startPage + 1;
}
`;
}

if (require.main === module) {
  main();
}

module.exports = { main };
