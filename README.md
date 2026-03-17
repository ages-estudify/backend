# Backend - NestJS + PostgreSQL

Este projeto é uma API backend desenvolvida com **NestJS**, utilizando **PostgreSQL** como banco de dados e **Docker** para o banco (o Nest roda localmente com `npm run start:dev`).

## Tecnologias utilizadas

- Node.js
- NestJS
- Prisma ORM
- PostgreSQL
- Docker / Docker Compose (apenas para o Postgres)
- Swagger (documentação da API)
- Husky (Git hooks)
- lint-staged (linting em arquivos staged)
- Prettier (formatação de código)
- ESLint (linting de código)

---

## Estrutura de pastas

```
backend/
├── prisma/
│   ├── schema.prisma         # Schema do banco de dados
│   └── migrations/           # Migrações do banco
├── src/
│   ├── main.ts              # Bootstrap da aplicação, CORS, prefixo, versionamento, Swagger
│   ├── app.module.ts         # Módulo raiz
│   ├── prisma.service.ts     # Serviço do Prisma
│   └── users/
│       ├── users.module.ts
│       ├── users.controller.ts
│       ├── users.service.ts
│       └── *.spec.ts
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── .env.example
├── docker-compose.yml        # Usar apenas o serviço postgres
├── nest-cli.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── README.md
```

---

## Git Hooks e Convenções

O projeto utiliza **Husky** para configurar Git hooks que garantem a qualidade do código e padronização dos commits.

### Hooks configurados

- **pre-commit:** Executa `lint-staged` para rodar ESLint e Prettier nos arquivos modificados antes de cada commit.
- **commit-msg:** Valida o formato da mensagem de commit.
- **pre-push:** Verifica se o nome da branch segue o padrão definido antes de fazer push.

### Convenção de mensagens de commit

As mensagens de commit devem seguir o formato:

```
tipo(id_clickup): descrição da mudança
```

**Exemplos válidos:**

- `feature(86ag34u4q): add suporte a dark mode`
- `fix(abc123): corrige erro de validação`
- `chore(123def): atualiza dependências`

**Tipos permitidos:** `feature`, `fix`, `hotfix`, `chore`, `refactor`, `arch`, `docs`, `test`

**Regras:**

- O ID do ClickUp deve estar entre parênteses e ser alfanumérico.
- Deve haver um espaço após os dois pontos.
- A descrição deve ter pelo menos 5 caracteres.

### Convenção de nomes de branch

Os nomes de branches devem seguir o padrão:

```
tipo(id_clickup)/nome-da-branch
```

**Exemplos válidos:**

- `feature(86ag34u4q)/add-dark-mode`
- `fix(abc123)/fix-validation-error`
- `chore(123def)/update-dependencies`

Branches principais: `develop`, `main`

**Regras:**

- O nome deve ser em minúsculas, com hífens separando palavras.
- Deve começar com o tipo e ID entre parênteses, seguido de barra e nome descritivo.

---

## API – prefixo e versionamento

- **Prefixo global:** `/api`
- **Versionamento:** URI com `/v1`

Os endpoints ficam no formato: `http://localhost:3000/api/v1/<recurso>`.

Exemplo: `GET http://localhost:3000/api/v1/users`

---

## Documentação Swagger

A documentação interativa da API está em:

**http://localhost:3000/api/v1/docs**

---

## Comandos do Prisma

O projeto utiliza **Prisma** como ORM. Aqui estão os principais comandos:

### Gerar o cliente Prisma

Gera o cliente TypeScript baseado no schema definido em `prisma/schema.prisma`:

```bash
npx prisma generate
```

### Executar migrações (Desenvolvimento)

Aplica mudanças no schema do banco de dados e gera uma nova migração:

```bash
npx prisma migrate dev --name <nome-da-migracao>
```

Exemplo:

```bash
npx prisma migrate dev --name add-user-table
```

### Visualizar dados no Prisma Studio

Abre uma interface gráfica para visualizar e editar dados do banco:

```bash
npx prisma studio
```

O Studio estará disponível em **http://localhost:5555**

### Resetar banco de dados (Desenvolvimento)

Remove todas as migrações e dados, recriando o banco do zero:

```bash
npx prisma migrate reset
```

### Verificar status das migrações

Verifica se há migrações pendentes ou diferenças entre o schema e o banco:

```bash
npx prisma migrate status
```

### Seed do banco (Opcional)

Se houver um arquivo de seed configurado, execute:

```bash
npx prisma db seed
```

**Nota:** Para configurar o seed, adicione no `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

---

## Pré-requisitos

- Node.js
- npm
- Docker e Docker Compose (para subir apenas o Postgres)

Verifique as instalações:

```bash
node --version
npm --version
docker --version
docker-compose --version
```

---

## Configuração do projeto

O projeto utiliza variáveis de ambiente definidas em um arquivo `.env`. Use o `.env.example` como base:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/backend?schema=public"
```

**Nota:** O Prisma utiliza uma única string de conexão `DATABASE_URL` ao invés de múltiplas variáveis como no TypeORM.

---

## Rodando a aplicação

**1. Subir apenas o Postgres (ignorar o backend no compose):**

```bash
docker-compose up -d postgres
```

**2. Instalar dependências:**

```bash
npm install
```

**3. Gerar o cliente Prisma:**

```bash
npx prisma generate
```

**4. Executar migrações do banco:**

```bash
npx prisma migrate dev --name init
```

**5. Rodar o Nest em modo desenvolvimento:**

```bash
npm run start:dev
```

A API estará disponível em **http://localhost:3000** (porta 3000).

---

## Acessando a aplicação

| Recurso        | URL                               |
| -------------- | --------------------------------- |
| API base       | http://localhost:3000/api/v1      |
| Swagger (docs) | http://localhost:3000/api/v1/docs |

Exemplo de endpoint:

```
GET /api/v1/users
```

---

## Parar a aplicação

Para parar apenas o container do Postgres:

```bash
docker-compose down
```

Para remover também o volume do banco:

```bash
docker-compose down -v
```

O Nest é interrompido com `Ctrl+C` no terminal onde está rodando `npm run start:dev`.
