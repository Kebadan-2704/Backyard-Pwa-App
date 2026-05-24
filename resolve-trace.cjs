const fs = require('fs');
const sourceMap = require('source-map');

async function resolveStackTrace() {
  const mapPath = 'dist/assets/index-CNZCyIRB.js.map';
  if (!fs.existsSync(mapPath)) {
    console.error('Source map not found. Rebuild with sourcemaps enabled.');
    return;
  }
  
  const rawSourceMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  const consumer = await new sourceMap.SourceMapConsumer(rawSourceMap);
  
  const pos = consumer.originalPositionFor({
    line: 29,
    column: 28664 // Error stack trace column
  });
  
  console.log('Original position:', pos);
  
  const pos2 = consumer.originalPositionFor({
    line: 29,
    column: 23914 // xA column
  });
  console.log('Original xA position:', pos2);
  
  consumer.destroy();
}

resolveStackTrace();
