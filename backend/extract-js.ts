import axios from 'axios';
import * as cheerio from 'cheerio';
async function run() {
  const url = 'https://www.epost.go.kr/comm.alddl.RetrieveAlddlChargeList.comm';
  const response = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const $ = cheerio.load(response.data);
  const planNames: any[] = [];
  $('[onclick*="goChoicePhoneCharge"], [href*="goChoicePhoneCharge"], [onclick*="jsSelectChargeOrder"]').each((i, el) => {
    const container = $(el).closest('li, tr, .alddl_list_box, .list_item');
    const goodNmNode = container.find('.good_nm').clone();
    goodNmNode.find('span').remove();
    const titleText = goodNmNode.text().replace(/\s+/g, ' ').trim();
    if (titleText) {
      planNames.push({
        attr: $(el).attr('onclick') || $(el).attr('href') || '',
        title: titleText
      });
    }
  });
  const uniquePlans = [...new Map(planNames.map(item => [item.attr, item])).values()];
  require('fs').writeFileSync('scraped.json', JSON.stringify(uniquePlans, null, 2));
  console.log('Saved to scraped.json. Total:', uniquePlans.length);
}
run();
