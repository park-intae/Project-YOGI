import * as fs from 'fs';
const scraped = JSON.parse(fs.readFileSync('scraped.json', 'utf-8'));
const counts: any = {};
scraped.forEach((s: any) => {
  const match = s.attr.match(/goChoicePhoneCharge\(([^)]+)\)/);
  if (match) {
    const p = match[1].split(',');
    const idn = p[3].replace(/['"]/g,'').trim();
    if (!counts[idn]) counts[idn] = [];
    counts[idn].push(s.title);
  }
});
for (const idn in counts) {
  if (counts[idn].length > 1) {
    console.log('Duplicate IDN ' + idn + ':', counts[idn]);
  }
}
