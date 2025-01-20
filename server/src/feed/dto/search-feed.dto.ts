import { Feed, FeedView } from '../feed.entity';
import {
  IsDate,
  IsDefined,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type, Transform, plainToClass } from 'class-transformer';

export enum SearchType {
  TITLE = 'title',
  BLOGNAME = 'blogName',
  ALL = 'all',
}

export class FeedIndex {
  @IsDate()
  createAt: Date;

  @IsInt()
  @Min(1, { message: 'feed index는 1보다 커야합니다.' })
  @Type(() => Number)
  feedId: number;

  constructor(createAt: Date, feedId: number) {
    this.createAt = createAt;
    this.feedId = feedId;
  }
}

export class Cursor {
  @IsInt({
    message: 'cursor의 페이지 번호는 정수입니다.',
  })
  @Min(1, { message: 'cursor의 페이지 번호는 1보다 커야합니다.' })
  @Type(() => Number)
  curPage: number;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return plainToClass(FeedIndex, JSON.parse(value));
    }
    return plainToClass(FeedIndex, value);
  })
  @ValidateNested()
  @Type(() => FeedIndex)
  preIndex: FeedIndex;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return plainToClass(FeedIndex, JSON.parse(value));
    }
    return plainToClass(FeedIndex, value);
  })
  @ValidateNested()
  @Type(() => FeedIndex)
  nextIndex: FeedIndex;

  constructor(curPage: number, preIndex: FeedIndex, nextIndex: FeedIndex) {
    this.curPage = curPage;
    this.preIndex = preIndex;
    this.nextIndex = nextIndex;
  }
}

export class SearchFeedReq {
  @IsDefined({
    message: '검색어를 입력해주세요.',
  })
  @IsString()
  find: string;

  @IsDefined({
    message: '검색 타입을 입력해주세요.',
  })
  @IsEnum(SearchType, {
    message: '검색 타입은 title, blogName, all 중 하나여야 합니다.',
  })
  type: SearchType;

  @IsInt({
    message: '페이지 번호는 정수입니다.',
  })
  @Min(1, { message: '페이지 번호는 1보다 커야합니다.' })
  @Type(() => Number)
  page?: number = 1;

  @IsInt({
    message: '한 페이지에 보여줄 개수는 정수입니다.',
  })
  @Min(1, { message: '개수 제한은 1보다 커야합니다.' })
  @Type(() => Number)
  limit?: number = 4;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        const parsedValue = JSON.parse(value);
        return plainToClass(FeedIndex, parsedValue);
      } catch (error) {
        throw new Error('Invalid JSON format for cursor');
      }
    }
    return plainToClass(FeedIndex, value);
  })
  @Type(() => Cursor)
  cursor?: Cursor;

  constructor(partial: Partial<SearchFeedReq>) {
    Object.assign(this, partial);
  }
}

export class SearchFeedResult {
  constructor(
    private id: number,
    private blogName: string,
    private title: string,
    private path: string,
    private createdAt: Date,
  ) {}

  static feedsToResults(feeds: Feed[]): SearchFeedResult[] {
    return feeds.map((item) => {
      return new SearchFeedResult(
        item.id,
        item.blog.name,
        item.title,
        item.path,
        item.createdAt,
      );
    });
  }

  static feedViewsToResults(feedViews: FeedView[]): SearchFeedResult[] {
    return feedViews.map((item) => {
      return new SearchFeedResult(
        item.feedId,
        item.blogName,
        item.title,
        item.path,
        item.createdAt,
      );
    });
  }
}

export class SearchFeedRes {
  constructor(
    private totalCount: number,
    private result: SearchFeedResult[],
    private totalPages: number,
    private limit: number,
    private cursor: Cursor,
  ) {}
}
