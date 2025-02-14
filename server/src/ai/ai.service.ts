import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { delay } from 'rxjs/operators';
import { AIConfig, AISummaryConfig, AITagConfig } from './ai.config';

export enum AIType {
  Summary,
  Tag,
}

const contentMaxLength = 7600;
const summaryMaxLength = 120;
const summaryContentMinLength = 120;
const tagMaxLength = 100;

@Injectable()
export class AIService {
  private summaryConfig: AIConfig;
  private tagConfig: AIConfig;
  static reReqCount = 5;

  constructor(private readonly configService: ConfigService) {
    this.summaryConfig = AISummaryConfig(
      this.configService,
      summaryMaxLength,
      summaryContentMinLength,
    );
    this.tagConfig = AITagConfig(this.configService, tagMaxLength);
  }

  getConfigByType(type: AIType) {
    if (type == AIType.Summary) return this.summaryConfig;
    if (type == AIType.Tag) return this.tagConfig;
    else return null;
  }

  getHeader(type: AIType) {
    const AIConfig = this.getConfigByType(type);
    if (!AIConfig) return null;
    return {
      Authorization: `Bearer ${AIConfig.API_KEY}`,
      'X-NCP-CLOVASTUDIO-REQUEST-ID': `${AIConfig.CLOVASTUDIO_REQUEST_ID}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
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

  cutContent(feedData: string, length: number) {
    return feedData.length < length ? feedData : feedData.substring(0, length);
  }

  async postAIReq(type: AIType, feedData: string) {
    try {
      const AIConfig = this.getConfigByType(type);
      if (feedData.length < AIConfig.MIN_CONTENT_LENGTH) {
        return '';
      }
      const cutData = this.cutContent(feedData, contentMaxLength);
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
          headers: this.getHeader(type),
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

        const responseData = await response.json();
        const responseText = responseData.result.message.content;
        result = await this.filterResponse(type, responseText);
        resLength = result.length;
        count++;
      }
      if (resLength > AIConfig.LIMITLENGTH || resLength <= 0) {
        throw new Error('유효하지 않은 응답 데이터입니다.');
      }
      return result;
    } catch (error) {
      console.error('에러 발생:', error);
      return 'FAILED';
    }
  }

  async filterResponse(type: AIType, response: string) {
    if (type == AIType.Summary) {
      return await this.summaryResFilter(response);
    }
    if (type == AIType.Tag) {
      return response;
    }
    return '';
  }

  async summaryResFilter(result: string) {
    let content = this.cutContent(result, this.summaryConfig.LIMITLENGTH);
    const lastDotIndex = content.lastIndexOf('.');
    content = content.substring(0, lastDotIndex + 1);
    return content;
  }
}
