[86ag34uh1](https://app.clickup.com/t/86ag34uh1)
<!--
    [ID da task no Clickup](URL para a task no Clickup)
-->

## Descrição
<!--
    Descrição sobre o que foi feito nessa branch
-->


## Instruções para teste (se necessário)
<!--
    Caso necessário, instruções de como testar as mudanças realizadas. Ex: abrir o swagger e chamar x endpoint.
-->



## Tipo de mudança
- [ ] 🐛 Bugfix (correção de uma falha existente)
- [ ] ✨ Nova feature (adição de nova funcionalidade)
- [ ] ♻️ Refatoração (mudança estrutural que não altera o comportamento final)
- [ ] 📚 Documentação (atualizações no README, Swagger, comentários)
- [ ] ⚙️ Configuração / Core (mudanças em dependências, CI/CD, Docker)

## Checklist de Padrões NestJS
- [ ] As validações de DTO (ex: `class-validator`, `class-transformer`) estão implementadas.
- [ ] A documentação do **Swagger** (`@ApiProperty`, `@ApiResponse`, etc.) foi atualizada (se aplicável).

## Testes
- [ ] Testes unitários co-localizados (`*.spec.ts`) foram criados/atualizados para services, guards, utils e mappers alterados.
- [ ] O comando `npm run test:ci` passa com sucesso (inclui cobertura mínima de 80%).
- [ ] Se algum arquivo ficou sem teste, há waiver aprovado em `.github/test-waivers.txt` ou `[test-waiver:path]` na descrição do PR.

## Checklist Geral
- [ ] O código passou pelo linter (`npm run lint`).
- [ ] O código foi formatado corretamente (`npm run format`).
- [ ] Realizei uma auto-revisão do meu próprio código.