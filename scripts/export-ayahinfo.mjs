#!/usr/bin/env node
/**
 * Exports word-level bounding boxes from the Quran Android `ayahinfo_1260`
 * SQLite database into compact per-page JSON files for the Mushaf prototype.
 *
 * Data source: the `glyphs` table of `ayahinfo_1260.db`, shipped with the
 * mobile repo. That database originates from the GPL-licensed quran_android
 * project (https://github.com/quran/quran_android). Coordinates are in the
 * SOURCE IMAGE pixel space of the width_1260 page images (1260 x 2048), the
 * same images served from https://android.quran.com/data/width_1260/.
 *
 * A "word" is identified by `sura_number:ayah_number:position` (e.g. "2:255:1")
 * — the canonical word id used everywhere in the prototype (`location`).
 *
 * Run once locally (output is committed to git so previews are self-contained):
 *   node scripts/export-ayahinfo.mjs [path/to/ayahinfo_1260.db]
 */

import Database from "better-sqlite3";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizePageBoxes, normalizeRawBox } from "./bbox-normalize.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_DB_PATH =
  "/Users/haroon/AgenticSystems/cluade-code/Quranalysis-Repos/Quranalysis-Mobile/Quranalysis-Mobile/assets/databases/ayahinfo_1260.db";

const SOURCE_IMAGE_WIDTH = 1260;
const SOURCE_IMAGE_HEIGHT = 2048;
const FIRST_PAGE = 1;
const LAST_PAGE = 604;

function main() {
  const dbPath = process.argv[2] ?? DEFAULT_DB_PATH;
  const outDir = resolve(__dirname, "..", "public", "data", "ayahinfo");
  mkdirSync(outDir, { recursive: true });

  const db = new Database(dbPath, { readonly: true, fileMustExist: true });

  // One row per glyph, ordered for deterministic, reading-order output.
  const stmt = db.prepare(
    `SELECT sura_number, ayah_number, position, line_number,
            min_x, max_x, min_y, max_y
       FROM glyphs
      WHERE page_number = ?
      ORDER BY line_number, position`,
  );

  let pagesWritten = 0;
  let totalWords = 0;
  let repairedBoxes = 0;

  for (let page = FIRST_PAGE; page <= LAST_PAGE; page++) {
    const rows = stmt.all(page);

    const words = normalizePageBoxes(
      rows.map((r) => {
        const { x, y, w, h } = normalizeRawBox(
          r.min_x,
          r.max_x,
          r.min_y,
          r.max_y,
        );
        if (
          Math.abs(r.max_x - r.min_x) < 10 ||
          Math.abs(r.max_y - r.min_y) < 8
        ) {
          repairedBoxes += 1;
        }
        return {
          id: `${r.sura_number}:${r.ayah_number}:${r.position}`,
          line: r.line_number,
          x,
          y,
          w,
          h,
        };
      }),
    );

    const payload = {
      page,
      w: SOURCE_IMAGE_WIDTH,
      h: SOURCE_IMAGE_HEIGHT,
      words,
    };

    const padded = String(page).padStart(3, "0");
    writeFileSync(join(outDir, `page-${padded}.json`), JSON.stringify(payload));

    pagesWritten += 1;
    totalWords += words.length;
  }

  db.close();

  console.log(
    `[export-ayahinfo] wrote ${pagesWritten} pages, ${totalWords} words, ${repairedBoxes} repaired boxes -> ${outDir}`,
  );
}

main();
