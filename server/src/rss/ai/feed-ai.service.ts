export class FeedAIService {
  async findImpactfulMessageByFeed(feedData: String) {
    const API_KEY = 'nv-f7ef7973181443efa0cf781646d54435fOB2';
    const URL =
      'https://clovastudio.stream.ntruss.com/testapp/v1/api-tools/summarization/v2';

    const callClovaLLM = async (feedData) => {
      try {
        const body = {
          texts: [
            "문서: 뒤의 문자열들을 홍보하는 요약 메세지를 50자 이내로로 작성해줘. 요약은 '~~에 대해서 설명하는 글입니다.' 형태로 하되 주어지는 문자열들은 XML 형태야. 문서:" +
              feedData,
          ],
          segMinSize: 300,
          includeAiFilters: true,
          autoSentenceSplitter: true,
          segCount: 2,
        };
        const response = await fetch(URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${API_KEY}`, // 발급받은 API 키를 입력
            'X-NCP-CLOVASTUDIO-REQUEST-ID': 'e2dab9d0ca3c471caf107098ec40ecd2', // 유일한 요청 ID
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('응답 데이터:', data);
      } catch (error) {
        console.error('에러 발생:', error);
      }
    };
    await callClovaLLM(feedData);
  }
}
