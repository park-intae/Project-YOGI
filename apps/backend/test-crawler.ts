import axios from 'axios';
import * as cheerio from 'cheerio';

async function run() {
  try {
    const url = 'https://www.epost.go.kr/comm.alddl.RetrieveAlddlChargeList.comm';
    console.log(`Fetching ${url}...`);
    
    // Add User-Agent to avoid simple blocking
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);
    
    console.log(`HTML fetch success. Length: ${html.length}`);
    
    // Attempt 1: Search for any a-tags that might be related to plan details
    const links = $('a').toArray();
    // Search for telecomcd, bizcd, or any plan names
    const lines = html.split('\n');
    let planCount = 0;
    interface PlanData {
      name: string;
      action: string | null;
    }
    const plans: PlanData[] = [];

    $('.alddl_charge_list li, .charge_list_item, .charge_list tr, .alddl_list_box, li.item, .list_item').each((i, el) => {
       const text = $(el).text().replace(/\s+/g, ' ').trim();
       const htmlContent = $(el).html() || '';
       if (text.includes('기본료') && htmlContent.includes('goChoicePhoneCharge(')) {
          // Try to extract the parameters from goChoicePhoneCharge or jsSelectChargeOrder
          const match = htmlContent.match(/goChoicePhoneCharge\([^)]*\)|jsSelectChargeOrder\([^)]*\)/);
          const nameMatch = $(el).find('h4, h3, .tit, .title, strong.tit').text().trim() || text.substring(0, 30);
          plans.push({ name: nameMatch, action: match ? match[0] : null });
       }
    });
    
    // If we didn't find them with a specific list item selector, just search globally for goChoicePhoneCharge
    if (plans.length === 0) {
        $('[onclick*="goChoicePhoneCharge"], [href*="goChoicePhoneCharge"], [onclick*="jsSelectChargeOrder"]').each((i, el) => {
           const onclick = $(el).attr('onclick') || $(el).attr('href');
           const text = $(el).text().trim() || $(el).closest('li, tr, div').text().replace(/\s+/g, ' ').substring(0, 30);
           plans.push({ name: text, action: onclick || null });
        });
    }

    console.log(`\nAnalysis complete. Found ${plans.length} plan elements.`);
    console.log(plans.slice(0, 5));

    // Test GET request for detail page
    const detailUrl = 'https://www.epost.go.kr/comm.alddlord.RetrieveChargeDtl.comm?phonepaydivcd=N&bizcd=C0018&srch_telecomcd=C03&charge_idn=14';
    console.log(`\nTesting GET request to detail URL: ${detailUrl}`);
    const detailRes = await axios.get(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (detailRes.data.includes('선불데이터안심') || detailRes.data.includes('기본료')) {
       console.log('Success! The detail page can be accessed via GET with query parameters.');
    } else {
       console.log('Failed. The detail page might require a POST request or cookies.');
    }
    
  } catch (error) {
    console.error('Error fetching page:', (error as Error).message);
  }
}

run();
