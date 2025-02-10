import { BadRequestException, Injectable } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { FeedRepository } from '../feed/feed.repository';
import { RssParserService } from './rss-parser.service';
import { RssAccept } from './rss.entity';
import { Feed } from '../feed/feed.entity';
import { AIService, AIType } from '../ai/ai.service';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class FeedCrawlerService {
  constructor(
    private readonly feedRepository: FeedRepository,
    private readonly rssParser: RssParserService,
    private readonly feedAI: AIService,
  ) {}

  async loadRssFeeds(rssUrl: string) {
    return await this.fetchRss(rssUrl);
  }

  async saveRssFeeds(feeds: Partial<Feed>[]) {
    return await this.feedRepository.insert(feeds);
  }

  private async fetchRss(rssUrl: string): Promise<Partial<Feed>[]> {
    const xmlParser = new XMLParser();
    const response = await fetch(rssUrl, {
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
    });

    if (!response.ok) {
      throw new BadRequestException(`${rssUrl}에서 xml 추출 실패`);
    }

    const xmlData = await response.text();
    const objFromXml = xmlParser.parse(xmlData);

    if (!Array.isArray(objFromXml.rss.channel.item)) {
      objFromXml.rss.channel.item = [objFromXml.rss.channel.item];
    }

    return await Promise.all(
      objFromXml.rss.channel.item.map(async (feed) => {
        this.feedAI.postAIReq(AIType.Summary, feed.description);
        const date = new Date(feed.pubDate);
        const formattedDate = date.toISOString().slice(0, 19).replace('T', ' ');
        const thumbnail = await this.rssParser.getThumbnailUrl(feed.link);

        return {
          title: this.rssParser.customUnescape(feed.title),
          path: decodeURIComponent(feed.link),
          thumbnail,
          createdAt: formattedDate,
        };
      }),
    );
  }

  async crawlingFeedContent(feedUrl: string) {
    if (!feedUrl) {
      throw new BadRequestException('rssUrl이 없습니다.');
    }
    try {
      const res = await axios.get(feedUrl);
      const html = res.data;
      const $ = cheerio.load(html);

      let content: string;

      if (feedUrl.includes('velog')) {
        content = $('.atom-one').eq(0).text();
      } else if (feedUrl.includes('tistory')) {
        content = $('.contents_style').text();
      } else if (feedUrl.includes('medium')) {
        content = $('.ci.bh.fz.ga.gb.gc').eq(2).text();
      }

      if (!content) {
        throw new BadRequestException('크롤링 내용 없음');
      }
      return content;
    } catch (error) {
      throw new BadRequestException('피드 내용 크롤링 실패');
    }
  }

  private getContentLength(content: string) {
    return content.replace('\n', '').length;
  }
}
