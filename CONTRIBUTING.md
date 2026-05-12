# Contributing to RestaurantOS

Thank you for your interest in contributing! We welcome contributions from the community.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/RestaurantOS.git
   ```
3. Set up the development environment:
   ```bash
   cd RestaurantOS
   # Start the database
   docker run -d --name restaurantos-db \
     -e POSTGRES_DB=restaurantos \
     -e POSTGRES_PASSWORD=postgres \
     -p 5432:5432 postgres:16-alpine
   # Server setup
   cd server
   npm install
   npx prisma generate
   npx prisma db push
   npx tsx prisma/seed.ts
   # Client setup
   cd ../client
   npm install
   ```

## Development

Run both server and client in development mode:

```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

## Code Style

- TypeScript strict mode is enabled — please respect it
- Follow existing patterns in the codebase
- Run `npx tsc --noEmit` in both `server/` and `client/` before committing

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Ensure TypeScript compiles cleanly in both server and client
4. Update the CHANGELOG.md if adding a feature
5. Open a pull request describing your changes

## Commit Messages

Follow conventional commits pattern:

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation
- `refactor:` — code restructuring
- `perf:` — performance improvement
- `chore:` — maintenance tasks

## Questions?

Open a GitHub discussion or issue for any questions.
