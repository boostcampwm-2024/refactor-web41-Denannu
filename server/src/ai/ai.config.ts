import { ConfigService } from '@nestjs/config';

export interface AIConfig {
  API_KEY: string;
  CLOVASTUDIO_REQUEST_ID: string;
  URL: URL;
  LIMITLENGTH: number;
  PROMPT: {
    role: string;
    content: string;
  };
}

export const AISummaryConfig = (
  configService: ConfigService,
  summaryMaxLength: number,
): AIConfig => ({
  API_KEY: configService.get<string>('API_KEY'),
  CLOVASTUDIO_REQUEST_ID: configService.get<string>(
    'CLOVASTUDIO_REQUEST_ID_SUMMARY',
  ),
  URL: configService.get<URL>('CLOVASTUDIO_URL_SUMMARY'),
  LIMITLENGTH: summaryMaxLength,
  PROMPT: {
    role: 'system',
    content: `- 당신은 반드시 ${summaryMaxLength} 글자 미만의 요약을 제공하는 텍스트 요약 어시스턴트입니다.
  - 주어진 XML 형태의 텍스트를 분석하고 핵심 주제를 추출합니다.
  - 이 글에 대한 요약은 해당 글을 홍보하고자 하는 목적으로 사용되며, 내부 내용에 대한 상세 사항은 응답에 포함되면 안됩니다.
  - 답변 형태 : ~~~한 주제에 대해 다루고 있는 포스트입니다.`,
  },
});
