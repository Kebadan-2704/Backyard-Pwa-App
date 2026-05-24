const fs = require('fs');
const path = require('path');
const sourceMap = require('source-map');

async function resolveStackTrace() {
  const assetsDir = path.join(__dirname, 'dist', 'assets');
  if (!fs.existsSync(assetsDir)) return console.error('No dist/assets');
  
  const files = fs.readdirSync(assetsDir);
  const mapFile = files.find(f => f.startsWith('index-') && f.endsWith('.js.map'));
  
  if (!mapFile) {
    console.error('Source map not found. Rebuild with sourcemaps enabled.');
    return;
  }
  
  const mapPath = path.join(assetsDir, mapFile);
  const rawSourceMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  const consumer = await new sourceMap.SourceMapConsumer(rawSourceMap);
  
  console.log('xr:', consumer.originalPositionFor({ line: 11, column: 32309 }));
  console.log('Sr:', consumer.originalPositionFor({ line: 11, column: 32367 }));
  console.log('H_e:', consumer.originalPositionFor({ line: 80, column: 143140 }));
  
  consumer.destroy();
}

resolveStackTrace();
