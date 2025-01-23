import { FeedView } from '../feed.entity';
import { JoinedFeed } from '../feed.repository';

export class FeedPaginationResponseDto {
  private constructor(
    private id: number,
    private author: string,
    private blogPlatform: string,
    private title: string,
    private path: string,
    private createdAt: Date,
    private thumbnail: string,
    private viewCount: number,
    private isNew: boolean,
  ) {}

  private static toFeedPaginationResponseDto(feed: FeedPaginationResult) {
    return new FeedPaginationResponseDto(
      feed.feedId,
      feed.blogName,
      feed.blogPlatform,
      feed.title,
      feed.path,
      feed.createdAt,
      feed.thumbnail,
      feed.viewCount,
      feed.isNew,
    );
  }

  public static mapToPaginationResponseDtoArray(
    FeedList: FeedPaginationResult[],
  ) {
    return FeedList.map(this.toFeedPaginationResponseDto);
  }
}

export type FeedPaginationResult = JoinedFeed & { isNew: boolean };

export class FeedTrendResponseDto {
  private constructor(
    private id: number,
    private author: string,
    private blogPlatform: string,
    private title: string,
    private path: string,
    private createdAt: Date,
    private thumbnail: string,
    private viewCount: number,
  ) {}

  private static toFeedTrendResponseDto(feed: JoinedFeed) {
    return new FeedTrendResponseDto(
      feed.feedId,
      feed.blogName,
      feed.blogPlatform,
      feed.title,
      feed.path,
      feed.createdAt,
      feed.thumbnail,
      feed.viewCount,
    );
  }

  public static toFeedTrendResponseDtoArray(FeedList: JoinedFeed[]) {
    return FeedList.map(this.toFeedTrendResponseDto);
  }
}
