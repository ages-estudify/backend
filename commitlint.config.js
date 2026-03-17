module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-empty': [2, 'never'], // Torna o que está nos parênteses obrigatório
    'type-enum': [2, 'always', ['feature', 'fix', 'hotfix', 'chore', 'refactor']],
    'subject-case': [0], // Permite qualquer case na mensagem para não ser chato
  },
};
