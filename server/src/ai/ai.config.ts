import { ConfigService } from '@nestjs/config';

export interface AIConfig {
  MIN_CONTENT_LENGTH: number;
  API_KEY: string;
  CLOVASTUDIO_REQUEST_ID: string;
  URL: URL;
  LIMITLENGTH: number;
  PROMPT: {
    role: string;
    content: string;
  };
  TOPP: number;
  TOPK: number;
  MAXTOKENS: number;
  TEMPERATURE: number;
  REPEATPENALTY: number;
  STOPBEFORE: Array<String>;
  INCLUDEAIFILTERS: true;
}

export const AISummaryConfig = (
  configService: ConfigService,
  summaryMaxLength: number,
  summaryContentMinLength: number,
): AIConfig => ({
  MIN_CONTENT_LENGTH: summaryContentMinLength,
  API_KEY: configService.get<string>('API_KEY'),
  CLOVASTUDIO_REQUEST_ID: configService.get<string>(
    'CLOVASTUDIO_REQUEST_ID_SUMMARY',
  ),
  URL: configService.get<URL>('CLOVASTUDIO_URL_SUMMARY'),
  LIMITLENGTH: summaryMaxLength,
  PROMPT: {
    role: 'system',
    content: `- 당신은 반드시 ${summaryMaxLength} 글자 미만의 요약을 제공하는 텍스트 요약 어시스턴트입니다.
  - 주어진 텍스트를 분석하고 핵심 주제를 추출하여 요약합니다.
  - 요약은 해당 글을 홍보하고자 하는 목적으로 사용되며, 내부 내용에 대한 상세 사항은 응답에 포함되면 안됩니다.
  - 답변 형태 : ~~~한 주제에 대해 다루고 있는 포스트입니다.`,
  },
  TOPP: 0.6,
  TOPK: 0,
  MAXTOKENS: 120,
  TEMPERATURE: 0.1,
  REPEATPENALTY: 2.0,
  STOPBEFORE: [],
  INCLUDEAIFILTERS: true,
});

export const AITagConfig = (
  configService: ConfigService,
  tagMaxLength: number,
): AIConfig => ({
  MIN_CONTENT_LENGTH: 10,
  API_KEY: configService.get<string>('API_KEY'),
  CLOVASTUDIO_REQUEST_ID: configService.get<string>(
    'CLOVASTUDIO_REQUEST_ID_TAG',
  ),
  URL: configService.get<URL>('CLOVASTUDIO_URL_TAG'),
  LIMITLENGTH: tagMaxLength,
  PROMPT: {
    role: 'system',
    content: `아래 글에서 핵심 키워드를 3개 이내로 추출해 주세요.
    
    [출력 형식]
    {"tags": ["키워드1", "키워드2", "키워드3"]}
    
    [출력 규칙]
    - 핵심 키워드는 3개 이내로 작성해 주세요.
    - 각 키워드는 단어 또는 2~3단어의 짧은 구문으로 작성해 주세요.
    - 중복되는 의미를 가진 키워드는 하나로 통합해 주세요.
    - 중요도가 동일할 경우 최대 3개의 키워드만 출력하고, 4개 이상 출력하지 않도록 하세요.`,
  },
  TOPP: 0.8,
  TOPK: 0,
  MAXTOKENS: 100,
  TEMPERATURE: 0.5,
  REPEATPENALTY: 5.0,
  STOPBEFORE: [],
  INCLUDEAIFILTERS: true,
});
