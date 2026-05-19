module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
    // 한국어 subject는 영문 case 규칙 적용 불가
    'subject-case': [0],
    'scope-enum': [
      2,
      'always',
      [
        'canvas',
        'node',
        'edge',
        'layout',
        'store',
        'ai',
        'auth',
        'collab',
        'mobile',
        'embed',
        'ui',
        'hooks',
        'a11y',
        'i18n',
        'perf',
        'deps',
      ],
    ],
  },
};
