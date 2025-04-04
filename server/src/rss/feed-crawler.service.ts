import { BadRequestException, Injectable } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { FeedRepository } from '../feed/feed.repository';
import { RssParserService } from './rss-parser.service';
import { RssAccept } from './rss.entity';
import { Feed } from '../feed/feed.entity';
import { AIService, AIType } from '../ai/ai.service';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { TagService } from '../tag/tag.service';

@Injectable()
export class FeedCrawlerService {
  constructor(
    private readonly feedRepository: FeedRepository,
    private readonly rssParser: RssParserService,
    private readonly feedAI: AIService,
    private readonly tagService: TagService,
  ) {}

  async loadRssFeeds(rssUrl: string) {
    return await this.fetchRss(rssUrl);
  }

  async saveRssFeeds(feeds: Partial<Feed>[]) {
    return await this.feedRepository.save(feeds);
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
        const content = await this.crawlingFeedContent(feed.link);
        const summary = await this.feedAI.postAIReq(AIType.Summary, content);
        const AITags = await this.feedAI.postAIReq(AIType.Tag, content);
        const tags = await this.tagService.getTags(AITags);
        const date = new Date(feed.pubDate);
        const contentLength = this.getContentLength(content);
        const formattedDate = date.toISOString().slice(0, 19).replace('T', ' ');
        const thumbnail = await this.rssParser.getThumbnailUrl(feed.link);
        return {
          title: this.rssParser.customUnescape(feed.title),
          path: decodeURIComponent(feed.link),
          thumbnail,
          createdAt: formattedDate,
          summary,
          contentLength,
          tags,
        };
      }),
    );
  }

  async crawlingFeedContent(feedUrl: string) {
    if (!feedUrl) {
      throw new BadRequestException('rssUrl이 없습니다.');
    }

    try {
      const html = await this.fetchHtmlContent(feedUrl);
      const content = this.extractContent(feedUrl, html);

      if (!content) {
        throw new BadRequestException('내용이 비어 있습니다.');
      }
      return content;
    } catch (error) {
      throw new BadRequestException(`피드 내용 크롤링 실패: ${error.message}`);
    }
  }

  private async fetchHtmlContent(feedUrl: string): Promise<string> {
    try {
      const res = await axios.get(feedUrl);
      return res.data;
    } catch (error) {
      throw new Error('HTML 콘텐츠를 가져오는 데 실패했습니다.');
    }
  }

  private extractContent(feedUrl: string, html: string): string | null {
    const $ = cheerio.load(html);
    let content: string | null = null;

    switch (true) {
      case feedUrl.includes('velog'):
        content = $('.atom-one').eq(0).text();
        break;
      case feedUrl.includes('tistory'):
        content = $('.contents_style').text();
        break;
      case feedUrl.includes('medium'):
        content = $('section').text();
        break;
      default:
        content = '아직 지원하지 않는 플랫폼 입니다.';
    }

    return content;
  }

  private getContentLength(content: string) {
    return content.replace('\n', '').length;
  }
}
