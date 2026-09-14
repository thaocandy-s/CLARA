# Backend

TypeScript modular monolith. Auth: session cookie `clara_session` (httpOnly), scrypt password hashes.

```bash
cd backend
npm install
npm test
npm run dev             # http://localhost:3000 (migrate + demo seed)
```

Frontend Vite proxies `/api` → `:3000`. Demo: `demo@clara.app` / `Demo@1234`.

`DATABASE_PATH` tùy chọn. Migrations: `db/migrations/*.sql`.
