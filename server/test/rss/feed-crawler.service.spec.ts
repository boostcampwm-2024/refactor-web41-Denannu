import { FeedCrawlerService } from '../../src/rss/feed-crawler.service';
import { Test, TestingModule } from '@nestjs/testing';
import { FeedRepository } from '../../src/feed/feed.repository';
import { RssParserService } from '../../src/rss/rss-parser.service';
import { AIService } from '../../src/ai/ai.service';

describe('FeedCrawlerService', () => {
  let feedCrawlerService: FeedCrawlerService;
  let feedRepository: FeedRepository;
  let rssParserService: RssParserService;
  let aiService: AIService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedCrawlerService,
        {
          provide: FeedRepository,
          useValue: {},
        },
        {
          provide: RssParserService,
          useValue: {},
        },
        {
          provide: AIService,
          useValue: {},
        },
      ],
    }).compile();

    feedCrawlerService = module.get<FeedCrawlerService>(FeedCrawlerService);
    feedRepository = module.get<FeedRepository>(FeedRepository);
    rssParserService = module.get<RssParserService>(RssParserService);
    aiService = module.get<AIService>(AIService);
  });

  describe('플랫폼 게시글 본문 크롤링', () => {
    const testCases = [
      {
        platform: 'velog',
        fakeUrl: 'https://velog.io/@test',
        fakeHtml: `
          <html>
            <body>
              <div class="atom-one">velog 콘텐츠</div>
            </body>
          </html>
        `,
        expected: 'velog 콘텐츠',
      },
      {
        platform: 'tistory',
        fakeUrl: 'htts://tistory.com/@test',
        fakeHtml: `
          <html>
            <body>
              <div class="contents_style">tistory 콘텐츠</div>
            </body>
          </html>
        `,
        expected: 'tistory 콘텐츠',
      },
      {
        platform: 'medium',
        fakeUrl: 'htts://medium.com/@test',
        fakeHtml: `
          <html>
            <body class="vsc-initialized">
              <div id="root">
                <section>medium 콘텐츠</section>
              </div>
            </body>
          </html>
        `,
        expected: 'medium 콘텐츠',
      },
    ];

    it.each(testCases)('플랫폼 게시글 본문 크롤링: %s', async (testCase) => {
      jest
        .spyOn<any, any>(feedCrawlerService, 'fetchHtmlContent')
        .mockResolvedValue(testCase.fakeHtml);
      expect(
        await feedCrawlerService.crawlingFeedContent(testCase.fakeUrl),
      ).toBe(testCase.expected);
    });
  });

  it('잘못된 URL로 크롤링 시 BadRequestException 발생', async () => {
    await expect(feedCrawlerService.crawlingFeedContent('')).rejects.toThrow(
      'rssUrl이 없습니다.',
    );
  });

  it('크롤링 실패 시 BadRequestException 발생', async () => {
    jest
      .spyOn<any, any>(feedCrawlerService, 'fetchHtmlContent')
      .mockRejectedValue(new Error('test error'));
    await expect(
      feedCrawlerService.crawlingFeedContent('https://velog.io/@test'),
    ).rejects.toThrow('피드 내용 크롤링 실패: test error');
  });

  it('크롤링한 내용이 비어 있을 경우 BadRequestException 발생', async () => {
    jest
      .spyOn<any, any>(feedCrawlerService, 'fetchHtmlContent')
      .mockResolvedValue('');
    await expect(
      feedCrawlerService.crawlingFeedContent('https://velog.io/@test'),
    ).rejects.toThrow('피드 내용 크롤링 실패: 내용이 비어 있습니다.');
  });
});
