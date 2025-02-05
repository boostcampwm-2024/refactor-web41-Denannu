import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { delay } from 'rxjs/operators';

@Injectable()
export class FeedAIService {
  private API_KEY: String;
  private CLOVASTUDIO_REQUEST_ID: String;
  private URL: URL;
  private headers;
  private prompt;
  static limitLength = 120;
  static reReqCount = 5;

  constructor(private readonly configService: ConfigService) {
    this.API_KEY = this.configService.get<string>('API_KEY');
    this.CLOVASTUDIO_REQUEST_ID = this.configService.get<string>(
      'CLOVASTUDIO_REQUEST_ID',
    );
    this.headers = {
      Authorization: `Bearer ${this.API_KEY}`,
      'X-NCP-CLOVASTUDIO-REQUEST-ID': `${this.CLOVASTUDIO_REQUEST_ID}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };
    this.URL = this.configService.get<URL>('CLOVASTUDIO_URL');
    this.prompt = {
      role: 'system',
      content: `- 당신은 반드시 ${FeedAIService.limitLength} 글자 미만의 요약을 제공하는 텍스트 요약 어시스턴트입니다.
- 주어진 XML 형태의 텍스트를 분석하고 핵심 주제를 추출합니다.
- 이 글에 대한 요약은 해당 글을 홍보하고자 하는 목적으로 사용되며, 내부 내용에 대한 상세 사항은 응답에 포함되면 안됩니다.
- 답변 형태 : ~~~한 주제에 대해 다루고 있는 포스트입니다.`,
    };
  }

  async summaryFeed(feedData: String) {
    try {
      const body = {
        messages: [
          this.prompt,
          {
            role: 'assistant',
            content: feedData,
          },
        ],
        topP: 0.6,
        topK: 0,
        maxTokens: 35,
        temperature: 0.1,
        repeatPenalty: 2.0,
        stopBefore: [],
        includeAiFilters: true,
      };
      let count = 0;
      let resLength = -1;
      let result = '';
      while (
        (resLength <= 0 || resLength > FeedAIService.limitLength) &&
        count < FeedAIService.reReqCount
      ) {
        const response = await fetch(this.URL, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(body),
        });
        if (response.status === 429) {
          console.warn('Rate limit 초과. 재시도 중...');
          await delay(500);
          continue;
        }
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('응답 스트림이 없습니다.');
        }
        result = await this.filterResponse(response);
        resLength = result.length;
        count++;
      }
      if (resLength > FeedAIService.limitLength || resLength <= 0) {
        result = '요약 데이터가 유효하지 않습니다.';
      }
      console.log('응답 데이터:', result);
      return result;
    } catch (error) {
      console.error('에러 발생:', error);
      return '';
    }
  }

  async filterResponse(response: Response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let accumulatedText = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const isResult = chunk.match(/event:result/g);
      if (!isResult) continue;
      const dataMatches = chunk.match(/\"message\":\s*(\{.*?\})/g);

      if (dataMatches) {
        dataMatches.forEach((data) => {
          try {
            const jsonString = data.replace('"message":', '').trim();
            const parsedData = JSON.parse(jsonString);
            if (parsedData.content) {
              accumulatedText = parsedData.content.trim();

              const lastDotIndex = accumulatedText.lastIndexOf('.');
              accumulatedText = accumulatedText.substring(0, lastDotIndex + 1);
            }
          } catch (error) {
            console.error('JSON 파싱 실패:', error);
          }
        });
      }
    }
    await reader.cancel();
    return accumulatedText;
  }
}
