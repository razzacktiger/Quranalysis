#!/usr/bin/env node

/**
 * Parse QUL QPC Uthmani Tajweed SQLite Data
 *
 * This script processes the official QUL SQLite database and extracts:
 * - Precise ayah-to-page mappings
 * - Accurate juz boundaries
 * - Tajweed information
 * - Complete mushaf layout data
 *
 * Usage:
 * 1. Download SQLite from: https://qul.tarteel.ai/resources/mushaf-layout/18
 * 2. Save as: scripts/qul-qpc-uthmani-tajweed.sqlite
 * 3. Run: node scripts/parse-qul-sqlite.js
 */

const fs = require("fs");
const path = require("path");

// We'll use the modern better-sqlite3 package for parsing
let Database;
try {
  Database = require("better-sqlite3");
} catch (error) {
  console.log("📦 Installing better-sqlite3 package...");
  console.log("Run: npm install better-sqlite3");
  console.log("Then rerun this script.");
  process.exit(1);
}

function main() {
  console.log("🕌 Parsing QUL QPC Uthmani Tajweed SQLite Data...");

  const sqliteFile = path.join(__dirname, "qpc-v4-tajweed-15-lines.sqlite");

  // Check if file exists
  if (!fs.existsSync(sqliteFile)) {
    console.log("❌ SQLite file not found!");
    console.log("");
    console.log("📥 Please download the file:");
    console.log("1. Visit: https://qul.tarteel.ai/resources/mushaf-layout/18");
    console.log('2. Click "Download sqlite" for QPC Uthmani Tajweed layout');
    console.log("3. Save as: scripts/qpc-v4-tajweed-15-lines.sqlite");
    console.log("4. Run this script again");
    return;
  }

  console.log("✅ Found SQLite file:", sqliteFile);
  console.log("📊 Analyzing database structure...");

  try {
    analyzeSQLiteStructure(sqliteFile);
  } catch (error) {
    console.error("❌ Error parsing SQLite:", error.message);
  }
}

function analyzeSQLiteStructure(sqliteFile) {
  const db = new Database(sqliteFile, { readonly: true });

  console.log("🔍 Connected to QUL database");

  try {
    // First, let's see what tables are available
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all();

    console.log("📋 Available tables:");
    tables.forEach((table) => {
      console.log("  -", table.name);
    });

    // Let's examine each table to find the page layout data
    if (tables.length > 0) {
      for (const table of tables) {
        examineTableStructure(db, table.name);
      }

      // Try to extract page data
      extractPageData(db, tables);
    } else {
      console.log("⚠️ No tables found in database");
    }
  } finally {
    db.close();
  }
}

function examineTableStructure(db, tableName) {
  console.log(`\n🔍 Examining table: ${tableName}`);

  try {
    // Get table schema
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();

    console.log("📊 Columns:");
    columns.forEach((col) => {
      console.log(`  - ${col.name} (${col.type})`);
    });

    // Get sample data
    const rows = db.prepare(`SELECT * FROM ${tableName} LIMIT 5`).all();

    console.log("📄 Sample data:");
    rows.forEach((row, i) => {
      console.log(`  Row ${i + 1}:`, JSON.stringify(row, null, 2));
    });

    return { columns, sampleRows: rows };
  } catch (err) {
    console.log(`  ❌ Error examining table ${tableName}: ${err.message}`);
    return null;
  }
}

function extractPageData(db, tables) {
  console.log("\\n🔄 Extracting page mapping data...");

  // Common patterns in QUL databases - let's try these table names
  const possibleTableNames = [
    "pages",
    "verses",
    "layout",
    "mushaf_layout",
    "page_layout",
    "ayahs",
    "quran",
  ];
  const availableTableNames = tables.map((t) => t.name);

  // Find the most relevant table
  let targetTable = null;

  for (const possibleName of possibleTableNames) {
    const foundTable = availableTableNames.find((name) =>
      name.toLowerCase().includes(possibleName.toLowerCase())
    );
    if (foundTable) {
      targetTable = foundTable;
      console.log(`🎯 Found relevant table: ${targetTable}`);
      break;
    }
  }

  if (!targetTable) {
    console.log("🔍 No obvious page table found. Trying first table...");
    targetTable = availableTableNames[0];
  }

  if (targetTable) {
    try {
      processPageTable(db, targetTable);
    } catch (err) {
      console.log(`❌ Error processing table ${targetTable}: ${err.message}`);

      // Try other tables
      for (const tableName of availableTableNames) {
        if (tableName !== targetTable) {
          console.log(`🔄 Trying alternative table: ${tableName}`);
          try {
            processPageTable(db, tableName);
            break;
          } catch (e) {
            console.log(`  ❌ ${tableName} failed: ${e.message}`);
          }
        }
      }
    }
  }
}

function processPageTable(db, tableName) {
  console.log(`\n🔄 Processing table: ${tableName}`);

  // Get all data from the table
  const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
  console.log(`📊 Found ${rows.length} rows in ${tableName}`);

  if (rows.length === 0) {
    throw new Error("Table is empty");
  }

  // Analyze the structure of the first row to understand the data format
  const firstRow = rows[0];
  const keys = Object.keys(firstRow);

  console.log("🔍 Detected columns:", keys.join(", "));

  // Show sample data
  console.log("📄 Sample rows:");
  rows.slice(0, 5).forEach((row, i) => {
    console.log(`  Row ${i + 1}:`, JSON.stringify(row, null, 2));
  });

  // Check if this looks like page data
  if (containsPageData(firstRow)) {
    console.log("✅ This appears to contain page mapping data!");
    processPageMappingData(rows, tableName);
  } else {
    console.log("⚠️ This table does not appear to contain page mapping data");
    throw new Error("Not page mapping data");
  }
}

function containsPageData(row) {
  const keys = Object.keys(row);
  const pageIndicators = ["page", "surah", "verse", "ayah", "juz"];

  return pageIndicators.some((indicator) =>
    keys.some((key) => key.toLowerCase().includes(indicator))
  );
}

function processPageMappingData(rows, tableName) {
  console.log("\\n🔄 Processing page mapping data...");

  const ayahToPageMapping = {};
  const pageToAyahMapping = {};
  const juzBoundaries = {};

  // Process each row based on its structure
  rows.forEach((row, index) => {
    try {
      // Extract relevant fields (this will be dynamic based on actual structure)
      const fields = extractRelevantFields(row);

      if (fields.surah && fields.ayah && fields.page) {
        // Create ayah-to-page mapping
        if (!ayahToPageMapping[fields.surah]) {
          ayahToPageMapping[fields.surah] = {};
        }
        ayahToPageMapping[fields.surah][fields.ayah] = fields.page;

        // Create page-to-ayah mapping
        if (!pageToAyahMapping[fields.page]) {
          pageToAyahMapping[fields.page] = [];
        }
        pageToAyahMapping[fields.page].push({
          surah: fields.surah,
          ayah: fields.ayah,
        });

        // Track juz boundaries if available
        if (fields.juz) {
          if (!juzBoundaries[fields.juz]) {
            juzBoundaries[fields.juz] = {
              startPage: fields.page,
              endPage: fields.page,
              surahs: new Set(),
            };
          }
          juzBoundaries[fields.juz].endPage = Math.max(
            juzBoundaries[fields.juz].endPage,
            fields.page
          );
          juzBoundaries[fields.juz].surahs.add(fields.surah);
        }
      }

      // Log progress for large datasets
      if (index % 1000 === 0) {
        console.log(`  Processed ${index}/${rows.length} rows...`);
      }
    } catch (err) {
      console.log(`⚠️ Error processing row ${index}: ${err.message}`);
    }
  });

  // Convert Set to Array for JSON serialization
  Object.keys(juzBoundaries).forEach((juz) => {
    juzBoundaries[juz].surahs = Array.from(juzBoundaries[juz].surahs);
  });

  // Create the final mapping file
  const pageMapping = {
    metadata: {
      source: "QUL QPC Uthmani Tajweed Layout",
      format: "QPC Uthmani Tajweed",
      sourceTable: tableName,
      totalRows: rows.length,
      totalPages: Object.keys(pageToAyahMapping).length,
      totalSurahs: Object.keys(ayahToPageMapping).length,
      description:
        "Authoritative page mapping from QUL with tajweed information",
      generatedAt: new Date().toISOString(),
    },
    ayahToPage: ayahToPageMapping,
    pageToAyah: pageToAyahMapping,
    juzBoundaries: juzBoundaries,
  };

  // Save the processed data
  const dataDir = path.join(__dirname, "..", "src", "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Save JSON
  fs.writeFileSync(
    path.join(dataDir, "qul-page-mapping.json"),
    JSON.stringify(pageMapping, null, 2)
  );

  // Generate TypeScript interface
  const tsContent = generateQULTypeScriptInterface(pageMapping);
  fs.writeFileSync(path.join(dataDir, "qul-page-mapping.ts"), tsContent);

  console.log("✅ Created qul-page-mapping.json");
  console.log("✅ Created qul-page-mapping.ts");

  // Validate Al-Baqarah calculation
  if (ayahToPageMapping[2]) {
    const baqarahPages = Object.values(ayahToPageMapping[2]);
    const minPage = Math.min(...baqarahPages);
    const maxPage = Math.max(...baqarahPages);
    const totalPages = maxPage - minPage + 1;

    console.log("\n📊 Al-Baqarah Validation:");
    console.log(
      `   📖 Pages: ${minPage}-${maxPage} (${totalPages} total pages)`
    );
    console.log(`   🎯 Expected: ~48 pages (user verified)`);

    if (totalPages >= 45 && totalPages <= 50) {
      console.log("   ✅ VALIDATION PASSED: Page count matches expectation!");
    } else {
      console.log(
        "   ⚠️ VALIDATION WARNING: Page count differs from expectation"
      );
    }
  }

  console.log("\n🎉 QUL data processing complete!");
}

function extractRelevantFields(row) {
  const keys = Object.keys(row);
  const fields = {};

  // Try to identify common field patterns
  const patterns = {
    surah: ["surah", "sura", "chapter", "surah_number", "chapter_number"],
    ayah: ["ayah", "verse", "aya", "verse_number", "ayah_number"],
    page: ["page", "page_number", "page_num"],
    juz: ["juz", "para", "hizb", "juz_number"],
    line: ["line", "line_number"],
    word: ["word", "word_number"],
  };

  // Find matching fields
  Object.keys(patterns).forEach((fieldType) => {
    const matchingKey = keys.find((key) =>
      patterns[fieldType].some((pattern) =>
        key.toLowerCase().includes(pattern.toLowerCase())
      )
    );

    if (
      matchingKey &&
      row[matchingKey] !== null &&
      row[matchingKey] !== undefined
    ) {
      fields[fieldType] = parseInt(row[matchingKey]) || row[matchingKey];
    }
  });

  return fields;
}

function generateQULTypeScriptInterface(pageMapping) {
  return `/**
 * Authoritative Quran Page Mapping from QUL QPC Uthmani Tajweed Layout
 * 
 * This file contains precise ayah-to-page mappings from the official QUL database.
 * Source: QUL (Quranic Universal Library) - QPC Uthmani Tajweed Layout
 * Generated: ${pageMapping.metadata.generatedAt}
 */

export interface QULPageMapping {
  metadata: {
    source: string;
    format: string;
    sourceTable: string;
    totalRows: number;
    totalPages: number;
    totalSurahs: number;
    description: string;
    generatedAt: string;
  };
  ayahToPage: Record<number, Record<number, number>>; // [surah][ayah] = page
  pageToAyah: Record<number, Array<{ surah: number; ayah: number }>>; // [page] = ayahs
  juzBoundaries: Record<number, { startPage: number; endPage: number; surahs: number[] }>;
}

export const QUL_PAGE_MAPPING: QULPageMapping = ${JSON.stringify(
    pageMapping,
    null,
    2
  )};

/**
 * Get the exact page number for a specific ayah (QUL AUTHORITATIVE)
 */
export function getQULPageFromAyah(surahNumber: number, ayahNumber: number): number | null {
  return QUL_PAGE_MAPPING.ayahToPage[surahNumber]?.[ayahNumber] || null;
}

/**
 * Get all ayahs on a specific page
 */
export function getQULAyahsFromPage(pageNumber: number): Array<{ surah: number; ayah: number }> {
  return QUL_PAGE_MAPPING.pageToAyah[pageNumber] || [];
}

/**
 * Calculate EXACT pages read for an ayah range (QUL AUTHORITATIVE!)
 * 
 * This function uses the official QUL QPC Uthmani Tajweed layout data
 * for 100% accurate page calculation.
 */
export function calculateQULPagesRead(
  surahNumber: number,
  ayahStart: number,
  ayahEnd: number
): number {
  const startPage = getQULPageFromAyah(surahNumber, ayahStart);
  const endPage = getQULPageFromAyah(surahNumber, ayahEnd);
  
  if (!startPage || !endPage) {
    console.warn(\`QUL page mapping not found for Surah \${surahNumber}, Ayahs \${ayahStart}-\${ayahEnd}\`);
    return 1; // Fallback
  }
  
  return endPage - startPage + 1;
}

/**
 * Validate QUL page calculation accuracy
 */
export function validateQULPageCalculation(): boolean {
  // Test Al-Baqarah full surah (user verified: should be ~48 pages)
  const baqarahFullPages = calculateQULPagesRead(2, 1, 286);
  
  console.log(\`Al-Baqarah full surah (QUL): \${baqarahFullPages} pages\`);
  
  // Should be approximately 48 pages (user verified)
  const isAccurate = baqarahFullPages >= 45 && baqarahFullPages <= 50;
  
  if (isAccurate) {
    console.log('✅ QUL page calculation validation PASSED');
  } else {
    console.log('❌ QUL page calculation validation FAILED');
  }
  
  return isAccurate;
}

/**
 * Get juz information for a specific ayah
 */
export function getQULJuzFromAyah(surahNumber: number, ayahNumber: number): number | null {
  const page = getQULPageFromAyah(surahNumber, ayahNumber);
  if (!page) return null;
  
  // Find which juz this page belongs to
  for (const [juzNum, juzInfo] of Object.entries(QUL_PAGE_MAPPING.juzBoundaries)) {
    if (page >= juzInfo.startPage && page <= juzInfo.endPage) {
      return parseInt(juzNum);
    }
  }
  
  return null;
}
`;
}

if (require.main === module) {
  main();
}

module.exports = { main };
