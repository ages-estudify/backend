# Backend - NestJS + PostgreSQL

Este projeto é uma API backend desenvolvida com **NestJS**, utilizando **PostgreSQL** como banco de dados e **Docker** para o banco (o Nest roda localmente com `npm run start:dev`).

## Tecnologias utilizadas

- Node.js
- NestJS
- TypeORM
- PostgreSQL
- Docker / Docker Compose (apenas para o Postgres)
- Swagger (documentação da API)

---

## Estrutura de pastas

```
backend/
├── src/
│   ├── main.ts              # Bootstrap da aplicação, CORS, prefixo, versionamento, Swagger
│   ├── app.module.ts         # Módulo raiz
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
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=backend
DB_HOST=localhost
DB_PORT=5432
```

---

## Rodando a aplicação

**1. Subir apenas o Postgres (ignorar o backend no compose):**

```bash
docker-compose up -d postgres
```

**2. Instalar dependências e rodar o Nest em modo desenvolvimento:**

```bash
npm install
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
