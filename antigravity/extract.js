const fs = require('fs');

const svgData = fs.readFileSync('C:/Users/ParkIntae/Desktop/project/project_yogi/antigravity/design_preview.svg', 'utf8');
const base64Match = svgData.match(/data:image\/png;base64,([^"']+)/);

if (base64Match && base64Match[1]) {
  const base64Data = base64Match[1];
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync('C:/Users/ParkIntae/Desktop/project/project_yogi/antigravity/design_preview_extracted.png', buffer);
  console.log('Successfully extracted and saved as design_preview_extracted.png');
} else {
  console.log('No base64 image found');
}
