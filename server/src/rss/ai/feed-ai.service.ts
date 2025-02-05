import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FeedAIService {
  private API_KEY: String;
  private CLOVASTUDIO_REQUEST_ID: String;
  private URL: URL;
  private headers;
  private prompt;

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
      content: `- 당신은 텍스트 요약 어시스턴트입니다.
- 주어진 XML 형태의 텍스트를 분석하고 핵심 주제를 추출하여 50자 이하 요약을 제공합니다.
- 이 글에 대한 요약은 해당 글을 홍보하고자 하는 목적으로 사용되며, 내부 내용에 대한 상세한 부분은 요약에 포함되면 안됩니다.
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
        maxTokens: 256,
        temperature: 0.1,
        repeatPenalty: 2.0,
        stopBefore: [],
        includeAiFilters: true,
        seed: 0,
      };

      const response = await fetch(this.URL, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('응답 스트림이 없습니다.');
      }
      const accumulatedText = await this.filterResponse(response);
      console.log('응답 데이터:', accumulatedText);
      return accumulatedText;
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
      const dataMatches = chunk.match(/data:\s*(\{.*?\})/g);

      if (dataMatches) {
        dataMatches.forEach((data) => {
          try {
            const jsonString = data.replace('data:', '').trim() + '}';
            const parsedData = JSON.parse(jsonString);
            if (parsedData.message?.content) {
              accumulatedText += parsedData.message.content;
            }
          } catch (error) {
            console.error('JSON 파싱 실패:', error);
          }
        });
      }
    }

    return accumulatedText;
  }
}
