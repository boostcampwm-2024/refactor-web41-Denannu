// commitlint.config.js
module.exports = {
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w+)\(#(\d+)\):\s(.+)$/u,
      headerCorrespondence: ["type", "subject"],
    },
  },
  rules: {
    "header-pattern": [2, "always"],

    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "refactor",
        "perf",
        "style",
        "docs",
        "test",
        "chore",
        "clean",
      ],
    ],
  },
  plugins: [
    {
      rules: {
        "header-pattern": ({ header }, when = "always") => {
          const regex = /^(\w+)\(#(\d+)\):\s(.+)$/u;
          const pass = regex.test(header);
          return [
            pass,
            `커밋 메시지는 다음 형식을 따라야 합니다:\n` +
              `[타입]: [설명]\n` +
              `예:feat(#이슈번호): 기능 설명`,
          ];
        },
      },
    },
  ],
};
