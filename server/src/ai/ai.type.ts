type Prompt = {
  role: String;
  content: String;
};

type AINeed = {
  API_KEY: String;
  CLOVASTUDIO_REQUEST_ID: String;
  PROMPT: Prompt;
  URL: URL;
  LIMITLENGTH?: number;
};
