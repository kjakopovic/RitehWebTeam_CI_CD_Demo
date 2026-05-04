# CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment. Every push is automatically linted, tested, and — if on `main` — deployed to the production server.

---

## How it works

### On a pull request or feature branch push

```
push to any branch except main
        │
        ▼
  _build.yml (reusable)
    ├── npm ci
    ├── npm run lint
    └── npm run test
```

This ensures no broken code ever makes it to `main`.

### On a push to main

```
push to main
        │
        ▼
  _build.yml (reusable)
    ├── npm ci
    ├── npm run lint
    └── npm run test
        │
        ▼ (only if build passes)
  _deploy.yml (reusable)
    ├── write SSH private key to CI runner
    ├── add server fingerprint to known_hosts
    └── ssh deploy@SERVER → runs deploy.sh
```

Build must pass before deploy is attempted. If lint or tests fail, the server is never touched.

---

## File structure

```
.github/
  workflows/
    _build.yml      # reusable: install, lint, test
    _deploy.yml     # reusable: SSH into server and trigger deploy
    on-pr.yml       # caller: runs _build on PRs and non-main branches
    on-main.yml     # caller: runs _build then _deploy on main
```

### `_build.yml`

Reusable workflow triggered via `workflow_call`. Runs inside the `./backend` directory:

- `npm ci` — clean install from lockfile
- `npm run lint` — ESLint across `src/` and `services/`
- `npm run test` — Jest with coverage

### `_deploy.yml`

Reusable workflow triggered via `workflow_call`. Requires two secrets passed explicitly from the caller:

- `SSH_PRIVATE_KEY` — private half of the CI deploy key
- `SERVER_IP` — production server IP address

Steps:
1. Writes the private key to `~/.ssh/id_ed25519` on the CI runner (temporary, gone after job finishes)
2. Runs `ssh-keyscan` to add the server fingerprint to `known_hosts` (prevents interactive prompt)
3. SSHes into the server as the `deploy` user — the server's `authorized_keys` restricts this key to only run `deploy.sh`, so no command is specified here

### `on-pr.yml`

Triggers on:
- `push` to any branch except `main`
- `pull_request`

Calls `_build.yml` only.

### `on-main.yml`

Triggers on:
- `push` to `main`

Calls `_build.yml`, then `_deploy.yml` with `needs: build` to enforce ordering.

---

## Secrets

Set these in your repo under **Settings → Secrets and variables → Actions**:

| Secret name | Description |
|---|---|
| `SSH_PRIVATE_KEY` | Contents of `ci_deploy_key` (the private key, including header/footer lines) |
| `SERVER_IP` | Your Hetzner server's public IP address |

Secrets are masked in all logs — they never appear in plain text.

---

## Server-side setup

The server runs two Docker services defined in `docker-compose.yml`:

| Service | Description |
|---|---|
| `db` | PostgreSQL 18 on internal port 5432, exposed as 7777 |
| `backend` | Express/TypeScript app built from `./backend`, exposed on port 3000 |

The deploy process on the server is handled by `/home/deploy/deploy.sh`:

```bash
#!/bin/bash
set -e
cd /app
git pull
docker compose up -d --build
```

`set -e` ensures the script stops immediately if any command fails, so a broken `git pull` never leads to a bad `docker compose` restart.

---

## Security model

| Layer | What it does |
|---|---|
| Dedicated `deploy` user | CI never touches root or your personal account |
| Key-based auth only | Password login is disabled on the server |
| `command=` restriction in `authorized_keys` | The CI key can only run `deploy.sh` — no shell, no port forwarding, nothing else |
| Secrets in GitHub | Private key never lives in the repository |
| `needs: build` in pipeline | Deploy is blocked if any test or lint check fails |

---

## Local development

```bash
# Start services
make run

# Rebuild and start
make rebuild

# Stop services
make stop

# Build TypeScript
make build

# Lint
make lint

# Test
make test
```