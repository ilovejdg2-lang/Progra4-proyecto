# design-mock

DEV ONLY. A fake backend so a designer can browse the admin area with invented data, with no database or real backend. Never deploy it, never import it from `src/`.

## Run

```powershell
npm run dev:mock
```

Opens the app on http://127.0.0.1:5174 and the fake API on http://127.0.0.1:5221 (both bound to loopback). Ctrl+C stops both. State is in memory and resets on restart.

## Fake account

- Identifier: `admin@mock.test`
- Password: `mock1234`

It is a SuperAdmin, so the whole sidebar shows. Creating a user asks for an email code; the mock code is `123456`.

## What is mocked

Login and token refresh, profile, permissions matrix, language, navbar logo, notification sources (stock alerts, volunteering, donations, sales, producer notifications) and Usuarios (list, detail, create, edit, enable/disable, point assignments as empty lists). About 27 users with long names, inactive users and Vendedor users.

Anything else: GET returns `[]` and logs `UNMOCKED GET <path>`; writes return 501 with a JSON message and log it.

## Extend

Add one row to the `routes` table in `server.mjs`: `[method, /path regex/, ({ params, body }) => [status, json]]`. Run `node tools/design-mock/selfcheck.mjs` to check the core routes.

## How it works

`dev.mjs` starts `server.mjs` and vite with `DEV_BACKEND_URL` set only in the child environment, so the vite dev proxy forwards `/api` to the mock. Nothing in `src/` or `vite.config.js` changes.
