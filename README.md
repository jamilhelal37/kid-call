# Kid Call

Kid Call is a small backend service for managing children associated with authenticated users and, in future iterations, recording calls made for those children.

The project currently provides a protected REST API for creating and retrieving kid records. Authentication is delegated to [Supabase Auth](https://supabase.com/docs/guides/auth), while application data is stored in Supabase Postgres.

## Project status

This repository is an early backend implementation.

### Implemented

- Verify Supabase access tokens on every API request.
- Add a kid for the authenticated user.
- Retrieve kids associated with a specified user ID.
- Automatically confirm kids created by an admin.
- Create an initial admin account with a seed script.
- Validate incoming kid data with Joi.
- Handle errors centrally through an Express error-handling middleware that returns consistent JSON responses.
- Run and deploy the service on Cloudflare Workers via Wrangler.

### Planned

- Initiate calls for a kid.
- Store active or requested calls in `public.calls`.
- Store call history in `public.call_logs`.
- Expose admin endpoints for listing and confirming kids.
- Add automated tests.

The code contains an empty `callKid` controller and an unrouted `getAllKids` controller as placeholders for some of this work.

## Domain model

An authenticated Supabase user can own multiple kids. Calls and call logs are expected to link both the user who initiated the action and the kid involved.

```mermaid
erDiagram
    AUTH_USERS ||--o{ KIDS : owns
    AUTH_USERS ||--o{ CALLS : initiates
    AUTH_USERS ||--o{ CALL_LOGS : initiates
    KIDS ||--o{ CALLS : receives
    KIDS ||--o{ CALL_LOGS : appears_in

    AUTH_USERS {
        uuid id PK
        string email
        jsonb app_metadata
    }

    KIDS {
        int8 id PK
        uuid user_id FK
        string full_name
        string classroom
        boolean is_confirmed
    }

    CALLS {
        uuid id PK
        uuid user_id FK
        uuid kid_id FK
        timestamp timestamp
    }

    CALL_LOGS {
        uuid id PK
        uuid user_id FK
        uuid kid_id FK
        timestamp timestamp
    }
```

Only `public.kids` is used by the current API. `public.calls` and `public.call_logs` describe the intended calling workflow shown in the project design.

## Request flow

1. A client authenticates through Supabase Auth and receives an access token.
2. The client sends the token as `Authorization: Bearer <token>`.
3. `protectedRoute` finds the matching Supabase public key and verifies the ES256 JWT.
4. The middleware adds the user's `id`, `email`, and application `role` to `req.user`.
5. The kids router validates the request and runs the corresponding controller.
6. The controller accesses Supabase using the server-side service key.
7. If a validator or controller throws an `AppError`, Express 5 forwards it to the central error handler, which sends a consistent JSON response.

All routes are protected because the authentication middleware is registered before the API router in `app.js`. The error handler is registered after the router, so it can catch errors thrown anywhere downstream.

## Project structure

```text
.
|-- app.js                         # Express application, route registration, and app export
|-- worker.js                      # Cloudflare Workers entry point (serves the Express app)
|-- wrangler.toml                  # Wrangler / Cloudflare Workers configuration
|-- .env.example                   # Template of required environment variables
|-- kids/
|   |-- kids.js                    # Kid controllers and Supabase queries
|   |-- urls.js                    # /api/kids route definitions
|   `-- validators.js              # Joi request validation
|-- middlewares/
|   |-- error-handler.js           # Central Express error-handling middleware
|   `-- protected-route.js         # Bearer-token authentication middleware
|-- seeds/
|   `-- seed-admin.js              # Creates the initial Supabase admin user
|-- utils/
|   |-- app-error.js               # AppError class for application errors
|   |-- create-supabase-client.js  # Shared privileged Supabase client
|   `-- token-verification.js      # JWT and JWKS verification
|-- package.json
`-- README.md
```

The project uses native ECMAScript modules (`"type": "module"`).

## Getting started

### Prerequisites

- Node.js 18 or newer
- npm
- A Supabase project
- A `public.kids` table matching the domain model above
- A Cloudflare account (to run and deploy the Worker with Wrangler)

### Installation

```bash
npm install
```

Copy the example file and fill in your Supabase values:

```bash
cp .env.example .env.dev
```

The application no longer loads environment variables itself (the `dotenv` dependency was removed). For the Node scripts they are injected by `dotenv-cli` from `.env.dev` or `.env.prod`; on Cloudflare Workers they come from Wrangler (`[vars]` in `wrangler.toml` and `wrangler secret put` for secrets). The required variables are:

```dotenv
LISTEN_PORT=3000
SUPABASE_URL=https://your-project-id.supabase.co
DB_SECRET=your-database-secret
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_SERVICE_KEY=your-service-role-key
```

`DB_SECRET` is present in `.env.example` but is not read by the application.

The service-role key bypasses normal Supabase access controls. Keep it server-side, never expose it to a browser or mobile client, and never commit `.env`, `.env.dev`, `.env.prod`, or `.dev.vars`.

### Create the admin user

```bash
npm run seed-admin
```

The script creates `admin@example.com` with `app_metadata.role` set to `admin`. It prints a generated password once; store it securely. Running the command again skips creation when that email already exists.

### Run the service

The app runs on Cloudflare Workers through the `cloudflare:node` compatibility layer. `worker.js` is the Workers entry point and binds the port; `app.js` exports the configured Express `app` without listening.

Local development against the Workers runtime:

```bash
npx wrangler dev        # or: npm run wdev (expects an [env.dev] block in wrangler.toml)
```

Deploy to Cloudflare:

```bash
npm run deploy
```

Set production secrets with `wrangler secret put <NAME>` (for example `SUPABASE_SERVICE_KEY`); secrets are not read from `.env` files once deployed.

The `npm run dev` and `npm run prod` scripts load `.env.dev` / `.env.prod` via `dotenv-cli` and run `app.js` under Node. Because `app.js` no longer calls `app.listen` (only `worker.js` binds a port), these scripts currently load the app without starting an HTTP listener; use `wrangler dev` to serve requests locally.

## API

Base path: `/api/kids`

Every request requires this header:

```http
Authorization: Bearer <supabase-access-token>
```

### Add a kid

```http
POST /api/kids
Content-Type: application/json
Authorization: Bearer <supabase-access-token>

{
  "full_name": "Maya Ahmed",
  "classroom": "2A"
}
```

Validation rules:

- `full_name` is required and must contain at least 2 characters.
- `classroom` is required and must contain 2 to 3 characters.

The authenticated user's ID is used as `user_id`. A kid created by an admin is immediately stored with `is_confirmed: true`; other users create unconfirmed records. A successful request returns `200 OK`.

The controller also supports an optional `user_id` in the body for admin-oriented use, but the current validator does not accept or validate it as part of the public API contract.

### Get kids for a user

```http
GET /api/kids/:id
Authorization: Bearer <supabase-access-token>
```

Example:

```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  http://localhost:3000/api/kids/USER_ID
```

The response is a JSON array containing all rows in `public.kids` whose `user_id` matches `:id`.

> Note: the current controller does not restrict `:id` to the authenticated user's ID or to admins. Add an ownership/role check before treating this endpoint as production-ready.

## Authentication and roles

Tokens are verified against the project's Supabase JWKS endpoint:

```text
https://<SUPABASE_PROJECT_ID>.supabase.co/auth/v1/.well-known/jwks.json
```

The verifier expects ES256 tokens and reads the application role from `app_metadata.role`. The seed script assigns the `admin` role to the initial admin account. Regular authenticated users may have no explicit role.

## Error handling

Errors are managed in one place rather than being formatted at each call site.

- `utils/app-error.js` defines `AppError`, a subclass of `Error` with a `message`, a `statusCode` (default `500`), and optional `details`. Validators and controllers signal failures by throwing `new AppError(message, statusCode, details)` instead of writing a response directly.
- `middlewares/error-handler.js` is the central Express error handler. It is registered last in `app.js`, after the kids router, so it can catch errors thrown anywhere downstream. Because the project runs Express 5, errors thrown or rejected inside `async` route handlers are forwarded to it automatically — no per-controller `try/catch` is required.

The handler builds the response as follows:

- The HTTP status comes from `err.statusCode`, defaulting to `500`.
- For server errors (`statusCode >= 500`), the `error` field is masked to `"Internal Server Error"` so internal messages are not leaked. For client errors (4xx), the actual `err.message` is returned.
- When the error carries `details`, they are included under a `details` field.
- If a response has already been sent (`res.headersSent`), the error is delegated to Express's default handler.

Responses use the shape `{ "error": string, "details"?: unknown }`.

A failed validation (`400`) returns the Joi messages:

```json
{
  "error": "\"full_name\" length must be at least 2 characters long",
  "details": { "...": "the underlying Joi error" }
}
```

A Supabase failure (`500`) masks the message but still surfaces the originating error in `details`:

```json
{
  "error": "Internal Server Error",
  "details": { "...": "the underlying Supabase error" }
}
```

## Development notes

- The service targets the Cloudflare Workers runtime: `app.js` exports the Express app and `worker.js` adapts it with `httpServerHandler` from `cloudflare:node`. The `nodejs_compat` flag is enabled in `wrangler.toml`.
- Wrangler's local state lives in `.wrangler/`, which is gitignored and regenerated on each `wrangler dev` run.
- There is no public health-check route; the global authentication middleware protects every request.
- Database migrations are not currently included, so the Supabase schema must be created separately.
- Database failures flow through the central error handler as structured JSON. The 5xx message is masked to `"Internal Server Error"`, but the originating Supabase error is still surfaced in the `details` field.
- No test or lint command is configured yet.

These limitations are useful starting points for the next development phase, especially before exposing the service outside a controlled environment.
