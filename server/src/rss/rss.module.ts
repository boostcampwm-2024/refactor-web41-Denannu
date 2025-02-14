import { Module } from '@nestjs/common';
import { RssController } from './rss.controller';
import { RssService } from './rss.service';
import {
  RssRejectRepository,
  RssRepository,
  RssAcceptRepository,
} from './rss.repository';
import { FeedCrawlerService } from './feed-crawler.service';
import { FeedRepository } from '../feed/feed.repository';
import { RssParserService } from './rss-parser.service';
import { EmailModule } from '../common/email/email.module';
import { AIModule } from '../ai/ai.module';
import { TagModule } from '../tag/tag.module';
import { TagService } from '../tag/tag.service';
import { TagRepository } from '../tag/tag.repository';
import { AIService } from '../ai/ai.service';

@Module({
  imports: [EmailModule, AIModule, TagModule],
  controllers: [RssController],
  providers: [
    RssService,
    FeedCrawlerService,
    RssParserService,
    RssRepository,
    RssAcceptRepository,
    RssRejectRepository,
    FeedRepository,
    TagService,
    TagRepository,
    AIService,
  ],
})
export class RssModule {}
