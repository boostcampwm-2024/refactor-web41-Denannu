import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { Feed } from '../../src/feed/feed.entity';
import { RssAccept } from '../../src/rss/rss.entity';
import { RedisService } from '../../src/common/redis/redis.service';

describe('All view count statistic E2E Test : GET /api/statistic/all', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = global.testApp;
    const moduleFixture: TestingModule = global.testModuleFixture;
    const dataSource = moduleFixture.get<DataSource>(DataSource);
    const rssAcceptRepository = dataSource.getRepository(RssAccept);
    const feedRepository = dataSource.getRepository(Feed);
    const redisService = app.get(RedisService);
    const [blog] = await Promise.all([
      rssAcceptRepository.save({
        id: 1,
        name: 'test',
        userName: 'test',
        email: 'test@test.com',
        rssUrl: 'https://test.com/rss',
      }),
      redisService.redisClient.set('test1234', 'test'),
    ]);
    await feedRepository.save([
      {
        id: 1,
        createdAt: '2024-11-26 09:00:00',
        title: 'test1',
        path: 'test1',
        viewCount: 5,
        thumbnail: 'https://test.com/test.png',
        blog: blog,
      },
      {
        id: 2,
        createdAt: '2024-11-26 09:00:00',
        title: 'test2',
        path: 'test2',
        viewCount: 4,
        thumbnail: 'https://test.com/test.png',
        blog: blog,
      },
      {
        id: 3,
        createdAt: '2024-11-26 09:00:00',
        title: 'test3',
        path: 'test3',
        viewCount: 3,
        thumbnail: 'https://test.com/test.png',
        blog: blog,
      },
      {
        id: 4,
        createdAt: '2024-11-26 09:00:00',
        title: 'test4',
        path: 'test4',
        viewCount: 2,
        thumbnail: 'https://test.com/test.png',
        blog: blog,
      },
      {
        id: 5,
        createdAt: '2024-11-26 09:00:00',
        title: 'test5',
        path: 'test5',
        viewCount: 1,
        thumbnail: 'https://test.com/test.png',
        blog: blog,
      },
    ]);
  });

  describe('관리자 권한이 없을 경우', () => {
    it('관리자 쿠키가 없다.', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/statistic/all?limit=1.1',
      );
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('인증되지 않은 요청입니다.');
    });
    it('관리자 쿠키가 만료되었다.', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/statistic/all?limit=1.1')
        .set('Cookie', 'sessionId=test4321');
      expect(response.status).toBe(401);
      expect(response.body.message).toBe('인증되지 않은 요청입니다.');
    });
  });

  describe('관리자 권한이 있을 경우', () => {
    describe('limit 값을 올바르게 입력하지 않았을 경우', () => {
      it('실수를 입력한다.', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/statistic/all?limit=1.1')
          .set('Cookie', 'sessionId=test1234');
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('정수로 입력해주세요.');
      });
      it('문자열을 입력한다.', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/statistic/all?limit=test')
          .set('Cookie', 'sessionId=test1234');
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('정수로 입력해주세요.');
      });

      it('음수를 입력한다.', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/statistic/all?limit=-100')
          .set('Cookie', 'sessionId=test1234');
        expect(response.status).toBe(400);
        expect(response.body).toStrictEqual({
          message: 'limit 값은 1 이상이어야 합니다.',
        });
      });
    });

    describe('limit 값을 올바르게 입력했을 경우', () => {
      it('값을 입력 하지 않는다.', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/statistic/all')
          .set('Cookie', 'sessionId=test1234');
        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
          message: '전체 조회수 통계 조회 완료',
          data: [
            {
              id: 1,
              title: 'test1',
              viewCount: 5,
            },
            {
              id: 2,
              title: 'test2',
              viewCount: 4,
            },
            {
              id: 3,
              title: 'test3',
              viewCount: 3,
            },
            {
              id: 4,
              title: 'test4',
              viewCount: 2,
            },
            {
              id: 5,
              title: 'test5',
              viewCount: 1,
            },
          ],
        });
      });
      it('양수를 입력한다.', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/statistic/all?limit=1')
          .set('Cookie', 'sessionId=test1234');
        expect(response.status).toBe(200);
        expect(response.body).toStrictEqual({
          message: '전체 조회수 통계 조회 완료',
          data: [
            {
              id: 1,
              title: 'test1',
              viewCount: 5,
            },
          ],
        });
      });
    });
  });
});
