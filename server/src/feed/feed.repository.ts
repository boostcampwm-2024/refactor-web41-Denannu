import { DataSource, Repository } from 'typeorm';
import { Feed, FeedView } from './feed.entity';
import { Injectable } from '@nestjs/common';
import { QueryFeedDto } from './dto/query-feed.dto';
import { Cursor, FeedIndex, SearchType } from './dto/search-feed.dto';
import { reject } from 'lodash';

@Injectable()
export class FeedRepository extends Repository<Feed> {
  constructor(private dataSource: DataSource) {
    super(Feed, dataSource.createEntityManager());
  }

  async searchFeedList(
    find: string,
    limit: number,
    type: SearchType,
    page: number,
    cursor?: Cursor,
  ): Promise<[Feed[], number, Cursor]> {
    if (page === 1) {
      const abortController1 = new AbortController();
      const abortController2 = new AbortController();
      const result = await Promise.race([
        this.searchFeedListByStandard(
          find,
          limit,
          type,
          page,
          cursor,
          abortController1,
        ),
        this.searchFeedListByBatch(find, limit, type, page, abortController2),
      ]);
      abortController1.abort();
      abortController2.abort();
      return result;
    }
    return this.searchFeedListByStandard(find, limit, type, page, cursor);
  }

  private async searchFeedListByStandard(
    find: string,
    limit: number,
    type: SearchType,
    page: number,
    cursor?: Cursor,
    abortController?: AbortController,
  ): Promise<[Feed[], number, Cursor]> {
    const signal = abortController?.signal;
    try {
      if (signal) {
        if (signal.aborted) {
          throw new Error('search Promise(standard) aborted');
        }

        signal.addEventListener('abort', () => {
          throw new Error('search Promise(standard) aborted');
        });
      }
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
        feeds.length > 0
          ? new FeedIndex(feeds[0].createdAt, feeds[0].id)
          : null;
      const nextIndex =
        feeds.length > 0
          ? new FeedIndex(
              feeds[feeds.length - 1].createdAt,
              feeds[feeds.length - 1].id,
            )
          : null;
      const resultCursor = new Cursor(page, preIndex, nextIndex);
      return [feeds, total, resultCursor];
    } catch (e) {
      if (signal?.aborted) return [null, 0, null];
      throw e;
    }
  }

  private async searchFeedListByBatch(
    find: string,
    limit: number,
    type: SearchType,
    page: number,
    abortController?: AbortController,
  ): Promise<[Feed[], number, Cursor]> {
    try {
      const unfilteredTotal = await this.createQueryBuilder('feed').getCount();
      const getTotal = this.createQueryBuilder('feed')
        .innerJoinAndSelect('feed.blog', 'rss_accept')
        .where(this.getWhereCondition(type), { find: `%${find}%` })
        .getCount();

      const [total, feeds] = await Promise.all([
        getTotal,
        this.findFeedWhile(find, limit, type, unfilteredTotal, abortController),
      ]);
      const preIndex =
        feeds.length > 0
          ? new FeedIndex(feeds[0].createdAt, feeds[0].id)
          : null;
      const nextIndex =
        feeds.length > 0
          ? new FeedIndex(
              feeds[feeds.length - 1].createdAt,
              feeds[feeds.length - 1].id,
            )
          : null;
      const resultCursor = new Cursor(page, preIndex, nextIndex);
      return [feeds, total, resultCursor];
    } catch (e) {
      if (abortController?.signal.aborted) return [null, 0, null];
      throw e;
    }
  }

  private async findFeedWhile(
    find: string,
    limit: number,
    type: SearchType,
    unfilteredTotal: number,
    abortController?: AbortController,
  ): Promise<Feed[]> {
    const signal = abortController?.signal;
    let leftData = limit;
    let batchNum = 0;
    const batchSize = 1000;
    let feeds = [];
    while (leftData > 0 && batchNum < unfilteredTotal) {
      if (signal && signal.aborted) {
        throw new Error('search Promise(batch) aborted');
      }
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
    return feeds;
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
