#!/usr/bin/env node
/**
 * sync-blog.js
 * Merges individual _posts/*.json files → _data/blog.json
 * Merges individual _works/*.json files → _data/works.json
 * Merges individual _team/*.json files  → _data/team.json
 *
 * Run: node scripts/sync-blog.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function readJSONDir(dir) {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) return [];

  return fs.readdirSync(fullDir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        const content = fs.readFileSync(path.join(fullDir, f), 'utf8');
        return JSON.parse(content);
      } catch (e) {
        console.warn(`⚠️  Could not parse ${f}: ${e.message}`);
        return null;
      }
    })
    .filter(Boolean);
}

function writeJSON(filePath, data) {
  const full = path.join(ROOT, filePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`✅ Written: ${filePath}`);
}

// ── BLOG POSTS ──
const posts = readJSONDir('_posts')
  .sort((a, b) => new Date(b.date) - new Date(a.date)); // newest first

if (posts.length > 0) {
  writeJSON('_data/blog.json', { posts });
  console.log(`   ${posts.length} post(s) synced.`);
}

// ── WORKS / CASE STUDIES ──
const works = readJSONDir('_works')
  .sort((a, b) => (b.year || '').localeCompare(a.year || '') || a.title.localeCompare(b.title));

if (works.length > 0) {
  writeJSON('_data/works.json', { works });
  console.log(`   ${works.length} case study/studies synced.`);
}

// ── TEAM ──
const team = readJSONDir('_team')
  .sort((a, b) => (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name));

if (team.length > 0) {
  writeJSON('_data/team.json', { team });
  console.log(`   ${team.length} team member(s) synced.`);
}

console.log('\n🎉 Sync complete.');
