import { DataSource, Repository } from 'typeorm';
import { Feed, FeedView } from './feed.entity';
import { Injectable } from '@nestjs/common';
import { QueryFeedDto } from './dto/query-feed.dto';
import { Cursor, SearchType } from './dto/search-feed.dto';

@Injectable()
export class FeedRepository extends Repository<Feed> {
  constructor(private dataSource: DataSource) {
    super(Feed, dataSource.createEntityManager());
  }

  async searchFeedList(
    find: string,
    limit: number,
    type: SearchType,
    offset: number,
    cursor?: { createdAt: string },
  ): Promise<[Feed[], number, Cursor]> {
    const queryBuilder = this.createQueryBuilder('feed_view')
      .innerJoinAndSelect('feed_view.blog', 'rss_accept')
      .where(this.getWhereCondition(type), { find: `%${find}%` })
      .skip(offset)
      .take(limit);

    if (cursor) {
      queryBuilder.andWhere(`(feed.createdAt < :createdAt)`, {
        createdAt: cursor.createdAt,
      });
    }

    const total = await queryBuilder.getCount();

    const { raw, entities } = await queryBuilder.getRawAndEntities();

    const nextCursor = null;
    // raw.length > 0
    //   ? new Cursor(
    //       raw[raw.length - 1].relevance,
    //       entities[entities.length - 1].createdAt,
    //     )
    //   : null;

    const feedsData = entities as Feed[];
    return [feedsData, total, nextCursor];
  }

  private getWhereCondition(type: string): string {
    switch (type) {
      case 'title':
        return 'feed_view.title LIKE :find';
      case 'blogName':
        return 'rss_accept.name LIKE :find';
      case 'all':
        return 'feed_view.title LIKE :find OR rss_accept.name LIKE :find';
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
          return `order_id < (${subQuery})`;
        }
        return '';
      })
      .orderBy('order_id', 'DESC')
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
