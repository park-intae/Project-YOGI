import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import * as cheerio from 'cheerio';
import { firstValueFrom } from 'rxjs';

interface ParsedPlan {
  name: string;
  bizcd: string;
  telecomcd: string;
  charge_idn: string;
  planUrl: string;
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly TARGET_URL =
    'https://www.epost.go.kr/comm.alddl.RetrieveAlddlChargeList.comm';

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 우체국 사이트에서 요금제 정보를 긁어와 DB의 planUrl을 업데이트합니다.
   */
  async updatePlanUrls(): Promise<{
    totalScraped: number;
    updated: number;
    failed: number;
  }> {
    this.logger.log(`Starting URL pre-scraping from ${this.TARGET_URL}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get(this.TARGET_URL, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        }),
      );

      const html = response.data;
      const $ = cheerio.load(html);

      const scrapedPlans: ParsedPlan[] = [];

      // 요금제 항목 탐색: 클릭 이벤트 속성이 있는 요소를 직접 찾습니다.
      $(
        '[onclick*="goChoicePhoneCharge"], [href*="goChoicePhoneCharge"], [onclick*="jsSelectChargeOrder"]',
      ).each((i, el) => {
        const container = $(el).closest('li, tr, .alddl_list_box, .list_item');
        const goodNmNode = container.find('.good_nm').clone();
        goodNmNode.find('span').remove();
        const titleText = goodNmNode.text().replace(/\s+/g, ' ').trim();
        const text =
          titleText ||
          $(el).text().replace(/\s+/g, ' ').trim() ||
          container.text().replace(/\s+/g, ' ').trim();
        const attr = $(el).attr('onclick') || $(el).attr('href') || '';

        const match = attr.match(
          /goChoicePhoneCharge\([^)]*\)|jsSelectChargeOrder\([^)]*\)/,
        );
        if (match) {
          const paramsString = match[0].match(/\(([^)]+)\)/);
          if (paramsString && paramsString[1]) {
            const params = paramsString[1]
              .split(',')
              .map((p) => p.replace(/['"]/g, '').trim());

            let bizcd, telecomcd, charge_idn;
            if (
              match[0].startsWith('goChoicePhoneCharge') &&
              params.length >= 4
            ) {
              bizcd = params[1];
              telecomcd = params[2];
              charge_idn = params[3];
            } else if (
              match[0].startsWith('jsSelectChargeOrder') &&
              params.length >= 3
            ) {
              bizcd = params[0];
              telecomcd = params[1];
              charge_idn = params[2];
            }

            if (bizcd && telecomcd && charge_idn) {
              const nameMatch = text.substring(0, 30);

              const planUrl = `https://www.epost.go.kr/comm.alddlord.RetrieveChargeDtl.comm?phonepaydivcd=N&bizcd=${bizcd}&telecomcd=${telecomcd}&charge_idn=${charge_idn}`;

              // 중복 방지 (planUrl 전체가 고유해야 함)
              if (!scrapedPlans.find((p) => p.planUrl === planUrl)) {
                scrapedPlans.push({
                  name: nameMatch,
                  bizcd,
                  telecomcd,
                  charge_idn,
                  planUrl,
                });
              }
            }
          }
        }
      });

      this.logger.log(
        `Successfully scraped ${scrapedPlans.length} plans from the target site.`,
      );

      // DB 병합 작업 (Upsert 형태의 업데이트)
      let updatedCount = 0;
      let failedCount = 0;

      const dbPlans = await this.prisma.plan.findMany();

      for (const scraped of scrapedPlans) {
        // 크롤링된 텍스트 중 불필요한 공백/개행/플러스기호 제거하여 매칭
        const normalizedScrapedName = scraped.name.replace(/[\s+]+/g, '');

        // DB에 존재하는 요금제 중 이름이 포함되거나 일치하는 것 찾기
        const matchedDbPlan = dbPlans.find((p) => {
          const normalizedDbName = p.planName.replace(/[\s+]+/g, '');
          return (
            normalizedScrapedName.includes(normalizedDbName) ||
            normalizedDbName.includes(normalizedScrapedName)
          );
        });

        if (matchedDbPlan) {
          try {
            await this.prisma.plan.update({
              where: { id: matchedDbPlan.id },
              data: { planUrl: scraped.planUrl },
            });
            updatedCount++;
          } catch (e) {
            this.logger.error(
              `Failed to update URL for plan ${matchedDbPlan.planName}`,
              e,
            );
            failedCount++;
          }
        }
      }

      this.logger.log(
        `URL DB Sync Complete. Updated: ${updatedCount}, Failed: ${failedCount}`,
      );

      return {
        totalScraped: scrapedPlans.length,
        updated: updatedCount,
        failed: failedCount,
      };
    } catch (error) {
      this.logger.error('Failed to fetch/parse the target site.', (error as Error).stack);
      throw error;
    }
  }
}
