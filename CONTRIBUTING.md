# Contributing to @cloudlayerio/sdk

## Development Setup

```bash
git clone https://github.com/cloudlayerio/cloudlayerio-js.git
cd cloudlayerio-js
npm install
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build ESM + CJS + types |
| `npm run dev` | Build in watch mode |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Lint with Biome |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format with Biome |
| `npm run format:check` | Check formatting |
| `npm run typecheck` | TypeScript type checking |

## Code Style

This project uses [Biome](https://biomejs.dev/) for linting and formatting. Configuration is in `biome.json`.

## Testing

Tests use [Vitest](https://vitest.dev/) with mocked `fetch`. Test files live in `tests/` mirroring the `src/` structure.

```bash
npm test              # Run all tests
npm run test:coverage # Run with coverage report
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run all quality checks: `npm run typecheck && npm test && npm run lint && npm run format:check`
5. Commit and push
6. Open a pull request

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Commit: `chore: release vX.Y.Z`
4. Create a GitHub Release with tag `vX.Y.Z`
5. CI automatically publishes to npm
