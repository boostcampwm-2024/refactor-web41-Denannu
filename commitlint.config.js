module.exports = {
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w+)\(#(\d+)\):\s(.+)$/u, // feat(#n): 설명 형식
      headerCorrespondence: ["type", "issue", "subject"],
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
              `feat(#3): 설명\n` +
              `예: feat(#42): 새로운 기능 추가`,
          ];
        },
      },
    },
  ],
};
