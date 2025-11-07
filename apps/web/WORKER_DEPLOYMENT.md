# Worker Deployment Guide

## Production Deployment

### Build the Worker
```bash
yarn build:worker
```

This compiles `worker.ts` to `dist/worker.js`.

### Start the Worker
```bash
yarn start:worker
```

This runs the compiled JavaScript file using Node.js.

## Environment Variables Required

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

## Deployment Platforms

### Railway
1. Create new project
2. Connect repository
3. Set build command: `yarn install && yarn build:worker`
4. Set start command: `yarn start:worker`
5. Add environment variables

### Render
1. Create new Background Worker
2. Build command: `yarn install && yarn build:worker`
3. Start command: `yarn start:worker`
4. Add environment variables

### Fly.io
1. Create `fly.toml` in `apps/web/`
2. Deploy with: `fly deploy`

## Development
```bash
yarn dev:worker
# or
yarn start:worker:dev
```

Both use `tsx` for hot reloading during development.

