import { DataSource, Repository } from 'typeorm';
import { Feed, FeedView } from './feed.entity';
import { Injectable } from '@nestjs/common';
import { QueryFeedDto } from './dto/query-feed.dto';
import { Cursor, FeedIndex, SearchType } from './dto/search-feed.dto';

export interface JoinedFeed {
  feedId: number;
  blogName: string;
  blogPlatform: string;
  title: string;
  path: string;
  createdAt: Date;
  thumbnail: string;
  viewCount: number;
}

@Injectable()
export class FeedRepository extends Repository<Feed> {
  constructor(private dataSource: DataSource) {
    super(Feed, dataSource.createEntityManager());
  }

  async findFeedPagination(queryFeedDto: QueryFeedDto) {
    const { lastId, limit } = queryFeedDto;

    const query = this.createQueryBuilder('f')
      .select([
        'f.id AS feedId',
        'f.title AS title',
        'f.path AS path',
        'f.created_at AS createdAt',
        'f.thumbnail AS thumbnail',
        'f.view_count AS viewCount',
        'r.name AS blogName',
        'r.blog_platform AS blogPlatform',
      ])
      .where((qb) => {
        if (lastId) {
          const subQuery = qb
            .subQuery()
            .select('created_at')
            .from(Feed, 'f')
            .where('f.id = :lastId', { lastId })
            .getQuery();
          return `created_at <= (${subQuery}) AND f.id != :lastId`;
        }
      })
      .innerJoin('rss_accept', 'r', 'f.blog_id = r.id')
      .orderBy('f.created_at', 'DESC')
      .limit(limit + 1);

    return await query.getRawMany();
  }

  async findFeedById(feedId: number): Promise<JoinedFeed> {
    const query = this.createQueryBuilder('f')
      .select([
        'f.id AS feedId',
        'f.title AS title',
        'f.path AS path',
        'f.created_at AS createdAt',
        'f.thumbnail AS thumbnail',
        'f.view_count AS viewCount',
        'r.name AS blogName',
        'r.blog_platform AS blogPlatform',
      ])
      .where('f.id = :feedId', { feedId })
      .innerJoin('rss_accept', 'r', 'f.blog_id = r.id');
    return await query.getRawOne();
  }

  async searchFeedList(
    find: string,
    limit: number,
    type: SearchType,
    page: number,
    cursor?: Cursor,
  ): Promise<[Feed[], number, Cursor]> {
    // if (!cursor) {
    //   return this.searchFeedListByBatch(find, limit, type, page);
    // }
    const offset = cursor
      ? (Math.abs(page - cursor.curPage) - 1) * limit
      : (page - 1) * limit;
    const queryBuilder = this.createQueryBuilder('feed')
      .innerJoinAndSelect('feed.blog', 'rss_accept')
      .where(this.getWhereCondition(type), { find: `%${find}%` })
      .orderBy('feed.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (cursor) {
      if (cursor.curPage < page) {
        queryBuilder.andWhere(
          '(feed.createdAt < :createAt or feed.createdAt = :createAt and feed.id > :feedId)',
          {
            createAt: cursor.nextIndex.createAt,
            feedId: cursor.nextIndex.feedId,
          },
        );
      } else if (cursor.curPage > page) {
        queryBuilder.andWhere(
          '(feed.createdAt > :createAt or feed.createdAt = :createAt and feed.id < :feedId)',
          {
            createAt: cursor.preIndex.createAt,
            feedId: cursor.preIndex.feedId,
          },
        );
      } else {
        queryBuilder.andWhere(
          '(feed.createdAt >= :preCreateAt and feed.createdAt <= :nextCreateAt)',
          {
            preCreateAt: cursor.preIndex.createAt,
            nextCreateAt: cursor.preIndex.feedId,
          },
        );
      }
    }
    const [feeds, total] = await queryBuilder.getManyAndCount();
    const preIndex =
      feeds.length > 0 ? new FeedIndex(feeds[0].createdAt, feeds[0].id) : null;
    const nextIndex =
      feeds.length > 0
        ? new FeedIndex(
            feeds[feeds.length - 1].createdAt,
            feeds[feeds.length - 1].id,
          )
        : null;
    const resultCursor = new Cursor(page, preIndex, nextIndex);
    return [feeds, total, resultCursor];
  }

  private async searchFeedListByBatch(
    find: string,
    limit: number,
    type: SearchType,
    page: number,
  ): Promise<[Feed[], number, Cursor]> {
    let batchNum = 0;
    const batchSize = 1000;
    const unfilteredTotal = await this.createQueryBuilder('feed').getCount();
    const total = await this.createQueryBuilder('feed')
      .innerJoinAndSelect('feed.blog', 'rss_accept')
      .where(this.getWhereCondition(type), { find: `%${find}%` })
      .getCount();
    let leftData = limit;
    let feeds = [];
    while (leftData > 0 && batchNum < unfilteredTotal) {
      const subQuery = this.createQueryBuilder()
        .subQuery()
        .select('feedSub.id', 'id')
        .addSelect(
          'ROW_NUMBER() OVER (ORDER BY feedSub.createdAt DESC)',
          'orderId',
        )
        .from(Feed, 'feedSub')
        .orderBy('feedSub.createdAt', 'DESC')
        .skip(batchNum)
        .take(batchSize)
        .getQuery();
      const queryBuilder = this.createQueryBuilder('feed')
        .innerJoin(subQuery, 'feedSub', 'feedSub.id = feed.id')
        .innerJoinAndSelect('feed.blog', 'rss_accept')
        .andWhere(this.getWhereCondition(type), { find: `%${find}%` })
        .orderBy('feed.createdAt', 'DESC')
        .take(leftData);

      const [tnsData, tnsCount] = await queryBuilder.getManyAndCount();
      feeds = feeds.concat(tnsData);
      leftData -= tnsCount;
      batchNum += batchSize;
    }

    const preIndex =
      feeds.length > 0 ? new FeedIndex(feeds[0].createdAt, feeds[0].id) : null;
    const nextIndex =
      feeds.length > 0
        ? new FeedIndex(
            feeds[feeds.length - 1].createdAt,
            feeds[feeds.length - 1].id,
          )
        : null;
    const resultCursor = new Cursor(page, preIndex, nextIndex);
    return [feeds, total, resultCursor];
  }

  private getWhereCondition(type: string): string {
    switch (type) {
      case 'title':
        return 'feed.title LIKE :find';
      case 'blogName':
        return 'rss_accept.name LIKE :find';
      case 'all':
        return '(feed.title LIKE :find OR rss_accept.name LIKE :find)';
    }
  }

  async findAllStatisticsOrderByViewCount(limit: number) {
    return this.find({
      select: ['id', 'title', 'viewCount'],
      order: {
        viewCount: 'DESC',
      },
      take: limit,
    });
  }
}

@Injectable()
export class FeedViewRepository extends Repository<FeedView> {
  constructor(private dataSource: DataSource) {
    super(FeedView, dataSource.createEntityManager());
  }

  /**
   * @deprecated this method is deprecated. Use FeedRepository.findFeedPagination instead.
   */
  async findFeedPagination(queryFeedDto: QueryFeedDto) {
    const { lastId, limit } = queryFeedDto;
    const query = this.createQueryBuilder()
      .where((qb) => {
        if (lastId) {
          const subQuery = qb
            .subQuery()
            .select('order_id')
            .from('feed_view', 'fv')
            .where('fv.feed_id = :lastId', { lastId })
            .getQuery();
          return `order_id > (${subQuery})`;
        }
        return '';
      })
      .take(limit + 1);

    return await query.getMany();
  }

  async findFeedById(feedId: number) {
    const feed = await this.createQueryBuilder()
      .where('feed_id = :feedId', { feedId })
      .getOne();
    return feed;
  }
}
