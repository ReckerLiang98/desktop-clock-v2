// ═══════════════════════════════════════════════════════════
//  SVG → PNG icon generator (cat clock)
// ═══════════════════════════════════════════════════════════

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function main() {
  const svg = fs.readFileSync(path.join(__dirname, '..', 'assets', 'icon.svg'), 'utf8');

  for (const size of [256, 32]) {
    const outPath = path.join(__dirname, '..', 'assets', `icon-${size}.png`);
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(outPath);
    const stat = fs.statSync(outPath);
    console.log(`Wrote ${outPath} (${stat.size} bytes)`);
  }
  console.log('Done.');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
