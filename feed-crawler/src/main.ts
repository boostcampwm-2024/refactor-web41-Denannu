import logger from './common/logger.js';
import { feedCrawler } from './feed-crawler.js';
import { mysqlConnection } from './common/mysql-access.js';
import { ONE_SECOND } from './common/constant';

async function runCrawler() {
  logger.info('==========작업 시작==========');
  const startTime = Date.now();
  await feedCrawler.start();
  const endTime = Date.now();
  const executionTime = endTime - startTime;
  await mysqlConnection.end();
  logger.info(`실행 시간: ${executionTime / ONE_SECOND}seconds`);
  logger.info('==========작업 완료==========');
}

runCrawler();
