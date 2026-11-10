# Fleet Control API

WebAPI para controlar a utilização dos automóveis de uma empresa. Permite cadastrar automóveis e motoristas e registrar quando cada motorista utiliza um automóvel, garantindo que nenhum dos dois seja usado em duplicidade.

**Tecnologias:** Node.js, Express 5, PostgreSQL 17, Zod, arquitetura hexagonal, OpenAPI 3.1, Swagger UI, Scalar, Docker e Docker Compose.

**Idioma:** todo o código está em inglês, incluindo rotas, campos JSON, tabelas do banco, mensagens da API e documentação interativa. Este guia está em português.

## Sumário

- [Início rápido](#início-rápido)
- [Visão geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Como rodar com Docker](#como-rodar-com-docker)
- [Como rodar a API fora do Docker](#como-rodar-a-api-fora-do-docker)
- [Documentação interativa](#documentação-interativa)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Testes automatizados](#testes-automatizados)
- [Qualidade do código](#qualidade-do-código)
- [Passo a passo de uso](#passo-a-passo-de-uso)
- [Referência da API](#referência-da-api)
- [Regras de negócio](#regras-de-negócio)
- [Erros](#erros)
- [Arquitetura](#arquitetura)
- [Solução de problemas](#solução-de-problemas)

## Início rápido

```bash
docker compose up --build -d --wait
```

Depois, abra **<http://localhost:3000/docs>** no navegador. Os detalhes estão em [Como rodar com Docker](#como-rodar-com-docker) e [Como rodar a API fora do Docker](#como-rodar-a-api-fora-do-docker).

## Visão geral

| Recurso     | Rota          | O que permite                                                                 |
| ----------- | ------------- | ----------------------------------------------------------------------------- |
| Automóveis  | `/cars`       | Cadastrar, atualizar, excluir, recuperar e listar, com filtro por cor e marca |
| Motoristas  | `/drivers`    | Cadastrar, atualizar, excluir, recuperar e listar, com filtro por nome        |
| Utilizações | `/car-usages` | Iniciar e finalizar a utilização de um automóvel e listar o histórico         |

## Pré-requisitos

| Ferramenta                                                                           | Quando é necessária                                          |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) com Docker Compose | Sempre que o banco ou a API rodarem em contêiner             |
| [Node.js](https://nodejs.org/) 22.9 ou superior                                      | Apenas para rodar a API fora do Docker ou executar os testes |
| `curl`, Postman ou Insomnia                                                          | Para enviar requisições à API                                |

Confirme que o Docker está instalado e em execução:

```bash
docker compose version
```

```bash
docker info
```

## Como rodar com Docker

Execute os comandos na pasta raiz do projeto. Não é necessário criar um arquivo `.env`: sem ele, são usados os [valores padrão](#variáveis-de-ambiente).

**1. Construa as imagens e suba os contêineres:**

```bash
docker compose up --build -d --wait
```

Serão iniciados dois serviços: `db`, com o PostgreSQL, e `api`, com a aplicação. Com `--wait`, o comando só termina quando os dois estiverem prontos. As tabelas são criadas automaticamente quando a API inicia.

**2. Acesse o sistema:**

Abra **<http://localhost:3000/docs>** no navegador.

Os links de acesso também aparecem nos logs da API:

```bash
docker compose logs api
```

```text
Fleet Control API is running

  Documentation: http://localhost:3000/docs
  Swagger UI:    http://localhost:3000/docs/swagger/
  Scalar:        http://localhost:3000/docs/scalar
  OpenAPI:       http://localhost:3000/openapi.json
  Health check:  http://localhost:3000/health
  API:           http://localhost:3000
```

Se você tiver o Node.js instalado, um único comando sobe tudo e já mostra os links no final:

```bash
npm run docker:up
```

**3. Se algo não abrir, confira os serviços:**

```bash
docker compose ps
```

Os dois serviços devem aparecer como `healthy`. Com a configuração padrão, o PostgreSQL fica em `localhost:5433`, com usuário `postgres`, senha `postgres` e banco `fleet`.

### Comandos do dia a dia

Acompanhar os logs da API:

```bash
docker compose logs -f api
```

Reconstruir a API depois de alterar o código:

```bash
docker compose up --build -d api
```

Abrir o terminal do banco:

```bash
docker compose exec db psql -U postgres -d fleet
```

Parar os contêineres, mantendo os dados:

```bash
docker compose down
```

Parar os contêineres e **apagar todos os dados**:

```bash
docker compose down -v
```

## Como rodar a API fora do Docker

Esse modo é útil durante o desenvolvimento, pois a API reinicia sozinha a cada alteração no código. O banco continua no Docker.

**1. Suba somente o banco:**

```bash
docker compose up -d db
```

**2. Instale as dependências:**

```bash
npm install
```

**3. Inicie a API em modo de desenvolvimento:**

```bash
npm run dev
```

Assim que a API sobe, o terminal mostra os links de acesso:

```text
Fleet Control API is running

  Documentation: http://localhost:3000/docs
  Swagger UI:    http://localhost:3000/docs/swagger/
  Scalar:        http://localhost:3000/docs/scalar
  OpenAPI:       http://localhost:3000/openapi.json
  Health check:  http://localhost:3000/health
  API:           http://localhost:3000
```

**4. Acesse o sistema:** abra **<http://localhost:3000/docs>** no navegador.

Para iniciar sem o recarregamento automático, use `npm start`. Para ver os links de novo a qualquer momento, use `npm run links`.

Se o contêiner `api` estiver ativo, pare-o antes para liberar a porta 3000:

```bash
docker compose stop api
```

## Documentação interativa

Com a API em execução, abra `http://localhost:3000/docs` para escolher a documentação. A tela tem modo claro e escuro: segue o sistema na primeira visita e guarda a escolha feita no botão do topo.

| Endereço                              | Conteúdo                  |
| ------------------------------------- | ------------------------- |
| `http://localhost:3000/docs`          | Tela de escolha           |
| `http://localhost:3000/docs/swagger/` | Swagger UI                |
| `http://localhost:3000/docs/scalar`   | Scalar                    |
| `http://localhost:3000/openapi.json`  | Especificação OpenAPI 3.1 |

A tela de escolha está em português e mostra o símbolo de cada ferramenta. As duas documentações estão em inglês, como a API. A raiz `http://localhost:3000/` redireciona para a tela de escolha. Nas duas documentações é possível enviar requisições reais à API, portanto os dados cadastrados por elas ficam salvos no banco.

O Scalar carrega sua interface da CDN jsDelivr e precisa de acesso à internet. O Swagger UI é servido pela própria API.

## Variáveis de ambiente

O arquivo `.env` é opcional. Os valores abaixo valem quando a variável não está definida. Para personalizá-los, crie o arquivo a partir do exemplo e altere o que precisar:

```bash
cp .env.example .env
```

| Variável            | Padrão                                                   | Descrição                                                                                                                    |
| ------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `PORT`              | `3000`                                                   | Porta da API na sua máquina                                                                                                  |
| `POSTGRES_USER`     | `postgres`                                               | Usuário do banco                                                                                                             |
| `POSTGRES_PASSWORD` | `postgres`                                               | Senha do banco                                                                                                               |
| `POSTGRES_DB`       | `fleet`                                                  | Nome do banco principal                                                                                                      |
| `DB_PORT`           | `5433`                                                   | Porta do PostgreSQL na sua máquina                                                                                           |
| `APP_URL`           | `http://localhost:` seguido de `PORT`                    | Endereço exibido nos links de acesso. Defina-o quando a API estiver atrás de outro domínio, como `https://frota.empresa.com` |
| `DATABASE_URL`      | `postgres://postgres:postgres@localhost:5433/fleet`      | Conexão usada pela API quando roda fora do Docker                                                                            |
| `TEST_DATABASE_URL` | `postgres://postgres:postgres@localhost:5433/fleet_test` | Conexão usada pelos testes                                                                                                   |

Ao alterar usuário, senha, nome do banco ou `DB_PORT`, atualize também `DATABASE_URL` e `TEST_DATABASE_URL`. Dentro do Docker, a API monta a própria conexão a partir das variáveis `POSTGRES_*`.

Usuário, senha e nome do banco só são aplicados na primeira criação do volume. Para alterá-los depois, recrie o volume com `docker compose down -v`, o que apaga os dados.

## Testes automatizados

Os testes usam o executor nativo do Node.js e ficam em dois grupos:

| Grupo      | Pasta              | O que verifica                                                                                   | Precisa do banco |
| ---------- | ------------------ | ------------------------------------------------------------------------------------------------ | ---------------- |
| Unitários  | `test/unit`        | Todos os casos de uso, regras do domínio, rotas HTTP, validações, erros e limites da arquitetura | Não              |
| Integração | `test/integration` | API completa com PostgreSQL real, incluindo requisições simultâneas e documentação               | Sim              |

Instale as dependências uma vez:

```bash
npm install
```

Rodar somente os testes unitários:

```bash
npm run test:unit
```

Para os testes de integração, suba o banco antes:

```bash
docker compose up -d db
```

Rodar somente os testes de integração:

```bash
npm run test:integration
```

Rodar todos os testes:

```bash
npm test
```

Os testes de unidade trocam o PostgreSQL por adaptadores em memória, em `test/unit/support/in-memory-adapters.js`. Eles implementam as mesmas portas da aplicação, então cobrem todas as funcionalidades sem precisar de banco. Os testes de integração repetem os cenários com o PostgreSQL real, o que confirma também as restrições do banco e as requisições simultâneas.

Se o banco não estiver disponível, os testes de integração falham com a mensagem `Integration tests need PostgreSQL at ...`, indicando o comando para subi-lo.

Os testes de integração usam somente o banco `fleet_test`, que é limpo durante a execução, portanto os dados de `fleet` não são afetados. Para usar outro banco, defina `TEST_DATABASE_URL`.

## Qualidade do código

O projeto usa [ESLint](https://eslint.org/) para encontrar problemas no código e [Prettier](https://prettier.io/) para manter a formatação padronizada. As regras estão em `eslint.config.js` e `.prettierrc.json`.

Verificar o código:

```bash
npm run lint
```

Verificar a formatação sem alterar arquivos:

```bash
npm run format:check
```

Formatar todos os arquivos:

```bash
npm run format
```

Antes de enviar uma alteração, rode `npm run lint`, `npm run format:check` e `npm test`.

## Passo a passo de uso

Este roteiro percorre o fluxo completo em um banco vazio. Se já houver registros, ajuste os identificadores nos exemplos.

### 1. Cadastre um automóvel

```bash
curl -X POST http://localhost:3000/cars \
  -H "Content-Type: application/json" \
  -d '{"licensePlate": "ABC1D23", "color": "Black", "brand": "Fiat"}'
```

```json
{ "id": 1, "licensePlate": "ABC1D23", "color": "Black", "brand": "Fiat" }
```

### 2. Cadastre dois motoristas

```bash
curl -X POST http://localhost:3000/drivers \
  -H "Content-Type: application/json" \
  -d '{"name": "Maria Silva"}'
```

```bash
curl -X POST http://localhost:3000/drivers \
  -H "Content-Type: application/json" \
  -d '{"name": "Carlos Souza"}'
```

### 3. Inicie uma utilização

```bash
curl -X POST http://localhost:3000/car-usages \
  -H "Content-Type: application/json" \
  -d '{"driverId": 1, "carId": 1, "startDate": "2026-01-10T08:00:00-03:00", "reason": "Customer visit"}'
```

```json
{
  "id": 1,
  "startDate": "2026-01-10T11:00:00.000Z",
  "endDate": null,
  "reason": "Customer visit",
  "driver": { "id": 1, "name": "Maria Silva" },
  "car": { "id": 1, "licensePlate": "ABC1D23", "color": "Black", "brand": "Fiat" }
}
```

As datas são sempre retornadas em UTC. Por isso, 08:00 em `-03:00` aparece como 11:00 `Z`.

### 4. Veja a regra de negócio em ação

Tente entregar o mesmo automóvel ao segundo motorista:

```bash
curl -i -X POST http://localhost:3000/car-usages \
  -H "Content-Type: application/json" \
  -d '{"driverId": 2, "carId": 1, "startDate": "2026-01-10T09:00:00-03:00", "reason": "Delivery"}'
```

A API responde com status `409`:

```json
{ "error": "The car is already being used by a driver during this period." }
```

### 5. Finalize a utilização

```bash
curl -X PATCH http://localhost:3000/car-usages/1/finish \
  -H "Content-Type: application/json" \
  -d '{"endDate": "2026-01-10T18:00:00-03:00"}'
```

Para registrar o momento atual como término, envie a requisição sem corpo:

```bash
curl -X PATCH http://localhost:3000/car-usages/1/finish
```

Uma utilização só pode ser finalizada uma vez. Executar os dois comandos em sequência faz o segundo retornar `409`.

### 6. Liste as utilizações

```bash
curl http://localhost:3000/car-usages
```

### 7. Use os filtros

```bash
curl "http://localhost:3000/cars?color=black&brand=fiat"
```

```bash
curl "http://localhost:3000/drivers?name=silva"
```

## Referência da API

URL base: `http://localhost:3000`. Requisições com corpo devem usar o cabeçalho `Content-Type: application/json`.

### Automóveis

| Método   | Rota        | Descrição             | Sucesso |
| -------- | ----------- | --------------------- | ------- |
| `POST`   | `/cars`     | Cadastra um automóvel | `201`   |
| `PUT`    | `/cars/:id` | Atualiza um automóvel | `200`   |
| `DELETE` | `/cars/:id` | Exclui um automóvel   | `204`   |
| `GET`    | `/cars/:id` | Recupera um automóvel | `200`   |
| `GET`    | `/cars`     | Lista os automóveis   | `200`   |

Corpo de `POST` e `PUT`, com todos os campos obrigatórios:

| Campo          | Tipo  | Regras                                                                                                              |
| -------------- | ----- | ------------------------------------------------------------------------------------------------------------------- |
| `licensePlate` | texto | Formato antigo (`ABC1234` ou `ABC-1234`) ou Mercosul (`ABC1D23`). Deve ser única. É salva em maiúsculas e sem hífen |
| `color`        | texto | De 1 a 50 caracteres                                                                                                |
| `brand`        | texto | De 1 a 50 caracteres                                                                                                |

Filtros opcionais de `GET /cars`:

| Parâmetro | Comportamento                                         |
| --------- | ----------------------------------------------------- |
| `color`   | Valor exato, sem diferenciar maiúsculas de minúsculas |
| `brand`   | Valor exato, sem diferenciar maiúsculas de minúsculas |

Os filtros podem ser combinados. Um filtro enviado vazio é ignorado.

### Motoristas

| Método   | Rota           | Descrição                               | Sucesso |
| -------- | -------------- | --------------------------------------- | ------- |
| `POST`   | `/drivers`     | Cadastra um motorista                   | `201`   |
| `PUT`    | `/drivers/:id` | Atualiza um motorista                   | `200`   |
| `DELETE` | `/drivers/:id` | Exclui um motorista                     | `204`   |
| `GET`    | `/drivers/:id` | Recupera um motorista                   | `200`   |
| `GET`    | `/drivers`     | Lista os motoristas em ordem alfabética | `200`   |

Corpo de `POST` e `PUT`:

| Campo  | Tipo  | Regras                             |
| ------ | ----- | ---------------------------------- |
| `name` | texto | Obrigatório, de 1 a 150 caracteres |

Filtro opcional de `GET /drivers`:

| Parâmetro | Comportamento                                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| `name`    | Busca por parte do nome, sem diferenciar maiúsculas de minúsculas. Acentos são considerados: `Joao` não encontra `João` |

### Utilizações

| Método  | Rota                     | Descrição                                                | Sucesso |
| ------- | ------------------------ | -------------------------------------------------------- | ------- |
| `POST`  | `/car-usages`            | Inicia a utilização de um automóvel                      | `201`   |
| `PATCH` | `/car-usages/:id/finish` | Finaliza uma utilização                                  | `200`   |
| `GET`   | `/car-usages`            | Lista as utilizações, da mais recente para a mais antiga | `200`   |

Corpo de `POST /car-usages`, com todos os campos obrigatórios:

| Campo       | Tipo   | Regras                                                                                         |
| ----------- | ------ | ---------------------------------------------------------------------------------------------- |
| `driverId`  | número | Identificador de um motorista cadastrado                                                       |
| `carId`     | número | Identificador de um automóvel cadastrado                                                       |
| `startDate` | texto  | Data e hora ISO 8601 com fuso. Exemplos: `2026-01-10T08:00:00-03:00` ou `2026-01-10T11:00:00Z` |
| `reason`    | texto  | De 1 a 500 caracteres                                                                          |

Corpo opcional de `PATCH /car-usages/:id/finish`:

| Campo     | Tipo  | Regras                                                                                  |
| --------- | ----- | --------------------------------------------------------------------------------------- |
| `endDate` | texto | Data e hora ISO 8601 com fuso, posterior a `startDate`. Se omitida, usa o momento atual |

Em `POST`, `PATCH` e `GET`, cada utilização é retornada no formato abaixo. `endDate` é `null` enquanto ela estiver em andamento.

```json
{
  "id": 1,
  "startDate": "2026-01-10T11:00:00.000Z",
  "endDate": "2026-01-10T21:00:00.000Z",
  "reason": "Customer visit",
  "driver": { "id": 1, "name": "Maria Silva" },
  "car": { "id": 1, "licensePlate": "ABC1D23", "color": "Black", "brand": "Fiat" }
}
```

### Saúde

| Método | Rota      | Descrição                              | Respostas                                  |
| ------ | --------- | -------------------------------------- | ------------------------------------------ |
| `GET`  | `/health` | Verifica a API e a conexão com o banco | `200` disponível, `503` banco indisponível |

Com o banco indisponível, a resposta é:

```json
{ "status": "unavailable" }
```

## Regras de negócio

- Um automóvel só pode ser utilizado por um motorista por vez.
- Um motorista só pode utilizar um automóvel por vez.
- As duas regras valem para qualquer sobreposição de período, inclusive com utilizações já finalizadas. Um novo período pode começar exatamente no instante em que o anterior terminou.
- As regras são garantidas por restrições de exclusão no próprio PostgreSQL, então continuam válidas com requisições simultâneas.
- Automóveis e motoristas com utilizações registradas não podem ser excluídos, preservando o histórico.
- A data de término deve ser posterior à data de início. Uma utilização com início no futuro precisa receber um `endDate` também posterior a esse início ao ser finalizada.

## Erros

Os erros seguem este formato:

```json
{ "error": "Car not found." }
```

Erros de validação indicam cada campo com problema:

```json
{
  "error": "Invalid data.",
  "details": [
    { "field": "licensePlate", "message": "Must follow the format AAA-1234 or AAA1A23." },
    { "field": "color", "message": "Required field." }
  ]
}
```

| Status | Quando ocorre                                                                                                              |
| ------ | -------------------------------------------------------------------------------------------------------------------------- |
| `400`  | Campos, filtros, identificador ou JSON inválidos                                                                           |
| `404`  | Automóvel, motorista, utilização ou rota inexistente                                                                       |
| `409`  | Placa duplicada, automóvel ou motorista ocupado no período, exclusão de cadastro com histórico ou utilização já finalizada |
| `413`  | Corpo da requisição maior que o permitido                                                                                  |
| `422`  | Data de término igual ou anterior à data de início                                                                         |
| `500`  | Erro interno do servidor                                                                                                   |

### Mensagens de erro

| Status | Mensagem                                                        | Situação                                                              |
| ------ | --------------------------------------------------------------- | --------------------------------------------------------------------- |
| `400`  | `Invalid data.`                                                 | Campos, filtros ou identificador inválidos, com detalhes em `details` |
| `400`  | `The request body is not valid JSON.`                           | Corpo da requisição malformado                                        |
| `404`  | `Car not found.`                                                | Automóvel inexistente                                                 |
| `404`  | `Driver not found.`                                             | Motorista inexistente                                                 |
| `404`  | `Car usage not found.`                                          | Utilização inexistente                                                |
| `404`  | `Route not found.`                                              | Rota inexistente                                                      |
| `409`  | `A car with this license plate already exists.`                 | Placa duplicada                                                       |
| `409`  | `The car has usage records and cannot be deleted.`              | Exclusão de automóvel com histórico                                   |
| `409`  | `The driver has usage records and cannot be deleted.`           | Exclusão de motorista com histórico                                   |
| `409`  | `The car is already being used by a driver during this period.` | Automóvel ocupado no período                                          |
| `409`  | `The driver is already using a car during this period.`         | Motorista ocupado no período                                          |
| `409`  | `This car usage has already been finished.`                     | Utilização finalizada novamente                                       |
| `413`  | `The request body exceeds the allowed size.`                    | Corpo maior que 100 KB                                                |
| `422`  | `The end date must be later than the start date.`               | Período inválido                                                      |
| `500`  | `Internal server error.`                                        | Falha inesperada, registrada no log da API                            |

### Mensagens de validação

Em `details[].message`, cada campo com problema recebe uma destas mensagens:

| Mensagem                                              | Situação                                        |
| ----------------------------------------------------- | ----------------------------------------------- |
| `Required field.`                                     | Campo obrigatório ausente                       |
| `Must be a string.`                                   | Campo de texto com outro tipo                   |
| `Must not be empty.`                                  | Texto vazio ou só com espaços                   |
| `Must have at most N characters.`                     | Texto acima do limite                           |
| `Contains invalid characters.`                        | Texto com caractere nulo                        |
| `Must follow the format AAA-1234 or AAA1A23.`         | Placa fora do formato                           |
| `Must be a positive integer.`                         | Identificador inválido                          |
| `Invalid identifier.`                                 | Identificador acima de 2147483647               |
| `Must be an ISO 8601 date and time with a time zone.` | Data inválida ou sem fuso horário               |
| `Must be provided only once.`                         | Filtro repetido na URL, como `?color=a&color=b` |

## Arquitetura

O projeto segue a arquitetura hexagonal (portas e adaptadores). As dependências sempre apontam para o centro: o domínio não conhece nenhuma outra camada, e os detalhes de HTTP e banco ficam nas bordas.

```text
HTTP (Express) -> Casos de uso -> Domínio
                       |
                       v
                     Portas <- Adaptadores (PostgreSQL, relógio)
```

```text
.
├── db
│   ├── init                         Criação do banco de testes
│   └── migrations                   Estrutura das tabelas
├── src
│   ├── domain                       Entidades, regras e erros de negócio
│   ├── application
│   │   ├── ports                    Contratos exigidos pela aplicação
│   │   ├── use-cases                Casos de uso, que são as portas de entrada
│   │   └── create-use-cases.js      Monta os casos de uso a partir das portas
│   ├── adapters
│   │   ├── inbound/http             Rotas, validação, respostas, erros e documentação
│   │   └── outbound
│   │       ├── postgres             Repositórios, conexão e migrations
│   │       └── system-clock.js      Relógio do sistema
│   ├── config                       Leitura das variáveis de ambiente
│   ├── composition-root.js          Liga as portas aos adaptadores
│   └── main.js                      Inicialização da aplicação
├── test
│   ├── unit                         Casos de uso, domínio, HTTP e arquitetura, sem banco
│   │   └── support                  Adaptadores em memória usados nos testes
│   └── integration                  API completa com PostgreSQL real
├── scripts                          Comandos auxiliares, como a exibição dos links
├── docker-compose.yml
└── Dockerfile
```

| Camada                | Responsabilidade                                                            | Pode depender de         |
| --------------------- | --------------------------------------------------------------------------- | ------------------------ |
| `domain`              | Entidades `Car`, `Driver` e `CarUsage`, formato da placa e erros de negócio | Nada                     |
| `application`         | Orquestra os casos de uso e define as portas                                | `domain`                 |
| `adapters/inbound`    | Traduz HTTP em chamadas aos casos de uso                                    | `application` e `domain` |
| `adapters/outbound`   | Implementa as portas e traduz restrições do banco em erros de negócio       | `application` e `domain` |
| `composition-root.js` | Instancia os adaptadores e os injeta nos casos de uso                       | Todas                    |

Os testes em `test/unit/architecture.test.js` falham se o domínio, a aplicação ou os adaptadores de entrada importarem algo fora desses limites.

### Caminho de uma requisição

Exemplo de `POST /car-usages`:

1. `adapters/inbound/http/routes/car-usage-routes.js` valida o corpo com `startCarUsageSchema`, do Zod.
2. A rota chama o caso de uso `StartCarUsage`, em `application/use-cases/car-usage-use-cases.js`.
3. O caso de uso busca o motorista e o automóvel pelas portas `DriverRepository` e `CarRepository`. Se algum não existir, lança `DriverNotFoundError` ou `CarNotFoundError`.
4. O caso de uso cria a entidade `CarUsage` e a envia à porta `CarUsageRepository`.
5. `PostgresCarUsageRepository` grava o registro. Se o banco recusar por sobreposição de período, o adaptador converte a recusa em `CarUnavailableError` ou `DriverUnavailableError`.
6. `presenters.js` monta a resposta JSON. Se algo falhar, `error-handler.js` converte o tipo do erro em status HTTP:

| Tipo de erro do domínio | Status |
| ----------------------- | ------ |
| `InvalidValueError`     | `400`  |
| `NotFoundError`         | `404`  |
| `ConflictError`         | `409`  |
| `BusinessRuleError`     | `422`  |

### Onde fica cada regra

| Regra                                           | Local                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Formato e normalização da placa                 | `domain/license-plate.js`                                                                  |
| Término posterior ao início e finalização única | `domain/car-usage.js`                                                                      |
| Motorista e automóvel devem existir             | `application/use-cases/car-usage-use-cases.js`                                             |
| Um automóvel e um motorista por vez             | Restrição de exclusão em `db/migrations/001_create_tables.sql`, traduzida pelo repositório |
| Formato dos dados recebidos                     | `adapters/inbound/http/schemas`                                                            |

A regra de uso exclusivo fica no banco porque só ele a garante com requisições simultâneas. O repositório converte a violação em um erro de domínio, então a aplicação não depende do PostgreSQL.

### Como adicionar uma funcionalidade

1. Crie ou altere a entidade e os erros em `src/domain`.
2. Se a aplicação precisar de algo externo, declare o método na porta correspondente em `src/application/ports`.
3. Escreva o caso de uso em `src/application/use-cases`.
4. Implemente a porta no adaptador de saída, em `src/adapters/outbound`.
5. Exponha o caso de uso em uma rota e em um schema de validação em `src/adapters/inbound/http`.
6. Registre o caso de uso em `src/composition-root.js`.
7. Documente o endpoint em `src/adapters/inbound/http/docs/openapi.js`.
8. Adicione testes unitários e de integração.

Para trocar o PostgreSQL, por exemplo, basta criar novos adaptadores que estendam as classes de `src/application/ports` e registrá-los em `composition-root.js`.

Novas alterações de banco devem ser adicionadas em `db/migrations` com numeração crescente, como `002_change_name.sql`. Cada arquivo é aplicado uma única vez, na inicialização da API.

## Solução de problemas

**`docker: command not found`**

O Docker não está instalado ou não está no PATH. Instale o Docker Desktop e abra o aplicativo antes de repetir o comando.

**`Cannot connect to the Docker daemon`**

O Docker está instalado, mas não está em execução. Abra o Docker Desktop e aguarde a inicialização.

**`port is already allocated` ou `address already in use`**

Outro programa está usando a porta. Altere `PORT` ou `DB_PORT` no `.env`. Ao mudar `DB_PORT`, atualize também `DATABASE_URL` e `TEST_DATABASE_URL`. Depois, recrie os contêineres:

```bash
docker compose up -d
```

**A API não inicia ou `/health` não responde**

Consulte os logs:

```bash
docker compose logs api db
```

**`Invalid environment variables`**

Uma variável foi definida com valor inválido, como `PORT` fora do intervalo de 1 a 65535 ou `DATABASE_URL` vazia. Corrija o valor no `.env` ou remova a variável para usar o padrão.

**`database "fleet_test" does not exist`**

O banco de testes é criado apenas na primeira inicialização do volume. Para criá-lo em um volume já existente:

```bash
docker compose exec db psql -U postgres -c "CREATE DATABASE fleet_test;"
```

**`column "name" does not exist` ao iniciar a API**

O volume do banco foi criado por uma versão anterior do projeto, com tabelas em português. Recrie o volume, o que apaga os dados:

```bash
docker compose down -v
```

**Erro de autenticação no banco depois de alterar o `.env`**

O volume ainda guarda as credenciais originais. Volte aos valores anteriores ou recrie o volume, o que apaga os dados:

```bash
docker compose down -v
```
