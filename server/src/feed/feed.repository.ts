import { DataSource, Repository } from 'typeorm';
import { Feed, FeedView } from './feed.entity';
import { Injectable } from '@nestjs/common';
import { QueryFeedDto } from './dto/query-feed.dto';
import { SearchType } from './dto/search-feed.dto';

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

  async searchFeedList(
    find: string,
    limit: number,
    type: SearchType,
    offset: number,
  ): Promise<[Feed[], number]> {
    const queryBuilder = this.createQueryBuilder('feed_view')
      .innerJoinAndSelect('feed_view.blog', 'rss_accept')
      .where(this.getWhereCondition(type), { find: `%${find}%` })
      .skip(offset)
      .take(limit);

    return queryBuilder.getManyAndCount();
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
