# Backend - NestJS + PostgreSQL

Este projeto é uma API backend desenvolvida com **NestJS**, utilizando **PostgreSQL** como banco de dados e **Docker** para containerização.

## Tecnologias utilizadas

* Node.js
* NestJS
* TypeORM
* PostgreSQL
* Docker
* Docker Compose

---

# Pré-requisitos

Antes de rodar o projeto, é necessário ter instalado:

* Docker
* Docker Compose

Verifique as instalações:

```bash
docker --version
docker-compose --version
```

---

# Configuração do projeto

O projeto utiliza variáveis de ambiente definidas em um arquivo `.env`.

Exemplo de `.env`:

```env
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=nestdb
```

---

# Rodando a aplicação

Dentro da pasta raiz do projeto execute:

```bash
docker-compose up --build
```

---

# Acessando a aplicação

Após subir os containers, a API estará disponível em:

```
http://localhost:3000
```

Exemplo de endpoint disponível:

```
GET /users
```

---

# Parar a aplicação

Para parar os containers:

```bash
docker-compose down
```

Se quiser remover também o volume do banco de dados:

```bash
docker-compose down -v
```

---