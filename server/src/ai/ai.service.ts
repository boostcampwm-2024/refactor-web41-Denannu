import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { delay } from 'rxjs/operators';
import { AIConfig, AISummaryConfig } from './ai.config';

export enum AIType {
  Summary,
}

const contentMaxLength = 7600;

@Injectable()
export class AIService {
  private summaryConfig: AIConfig;
  static reReqCount = 5;
  static summaryMaxLength = 120;

  constructor(private readonly configService: ConfigService) {
    this.summaryConfig = AISummaryConfig(
      this.configService,
      AIService.summaryMaxLength,
    );
  }

  getConfigByType(type: AIType) {
    if (type == AIType.Summary) return this.summaryConfig;
    else return null;
  }

  getHeader(type: AIType) {
    const AIConfig = this.getConfigByType(type);
    if (!AIConfig) return null;
    return {
      Authorization: `Bearer ${AIConfig.API_KEY}`,
      'X-NCP-CLOVASTUDIO-REQUEST-ID': `${AIConfig.CLOVASTUDIO_REQUEST_ID}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };
  }

  getBody(type: AIType, feedData: String) {
    const AIConfig = this.getConfigByType(type);
    if (!AIConfig) return null;
    return {
      messages: [
        AIConfig.PROMPT,
        {
          role: 'assistant',
          content: feedData,
        },
      ],
      topP: AIConfig.TOPP,
      topK: AIConfig.TOPK,
      maxTokens: AIConfig.MAXTOKENS,
      temperature: AIConfig.TEMPERATURE,
      repeatPenalty: AIConfig.REPEATPENALTY,
      stopBefore: AIConfig.STOPBEFORE,
      includeAiFilters: AIConfig.INCLUDEAIFILTERS,
    };
  }

  cutContent(feedData: String) {
    return feedData.length < contentMaxLength
      ? feedData
      : feedData.substring(0, contentMaxLength);
  }

  async postAIReq(type: AIType, feedData: String) {
    try {
      const AIConfig = this.getConfigByType(type);
      const cutData = this.cutContent(feedData);
      const body = this.getBody(type, cutData);
      let count = 0;
      let resLength = -1;
      let result = '';
      while (
        (resLength <= 0 || resLength > AIConfig.LIMITLENGTH) &&
        count < AIService.reReqCount
      ) {
        const response = await fetch(AIConfig.URL, {
          method: 'POST',
          headers: this.getHeader(AIType.Summary),
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
      if (resLength > AIConfig.LIMITLENGTH || resLength <= 0) {
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
