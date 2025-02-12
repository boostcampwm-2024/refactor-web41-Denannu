import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

export function ApiGetFeedSummary() {
  return applyDecorators(
    ApiOperation({
      summary: '피드 홍보용 요약글 조회 API',
    }),
    ApiOkResponse({
      description: 'Ok',
      schema: {
        properties: {
          message: {
            type: 'string',
          },
          data: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              summary: { type: 'string' },
            },
          },
        },
      },
      example: {
        message: '요약 조회 완료',
        data: [
          {
            id: 1,
            summary: '~~~에 대해 설명하는 포스트입니다.',
          },
        ],
      },
    }),
  );
}
