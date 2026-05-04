# Creating a Locked-Down Deploy User

This guide walks through creating a dedicated `deploy` user on your server that CI can SSH into, but can only run the deploy script — nothing else.

Do all of these steps **on the server**, SSHed in as root, unless stated otherwise.

---

## Step 1 — Create the user

```bash
adduser deploy
```

It will prompt for a password — set one, you'll need it temporarily in Step 5. After setup is complete, CI will never use it.

---

## Step 2 — Create the `.ssh` directory

```bash
mkdir -p /home/deploy/.ssh
```

---

## Step 3 — Add the CI public key to authorized_keys

On your **local machine**, print the public key:

```bash
cat ~/.ssh/ci_deploy_key.pub
```

Copy the entire output line. It starts with `ssh-ed25519 AAAA...`.

Back on the server, open the authorized_keys file:

```bash
nano /home/deploy/.ssh/authorized_keys
```

Paste the key **with a restriction prefix** — all on one single line:

```
command="/home/deploy/deploy.sh",no-port-forwarding,no-agent-forwarding,no-pty ssh-ed25519 AAAA...your key here... ci-deploy
```

The line has three parts, all on one line with no line breaks:
- `command="...",no-port-forwarding,no-agent-forwarding,no-pty` — the restrictions
- `ssh-ed25519` — the key type
- `AAAA...` — your actual public key content

Save and exit (`Ctrl+X`, `Y`, `Enter`).

---

## Step 4 — Fix permissions

SSH is strict about permissions and will silently refuse to work if they are wrong:

```bash
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

---

## Step 5 — Create the deploy script

```bash
nano /home/deploy/deploy.sh
```

Paste this content:

```bash
#!/bin/bash
set -e

echo "Starting deploy at $(date)"

cd /app
git pull
docker compose up -d --build

echo "Deploy finished at $(date)"
```

Make it executable:

```bash
chmod +x /home/deploy/deploy.sh
```

---

## Step 6 — Give deploy ownership of the app directory

The deploy script runs as the `deploy` user, so it needs to own `/app`:

```bash
sudo chown -R deploy:deploy /app
```

If `/app` doesn't exist yet:

```bash
mkdir /app
chown -R deploy:deploy /app
```

---

## Step 7 — Clone the repository into /app

Switch to the deploy user:

```bash
su - deploy
```

Clone your repo:

```bash
cd /app
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .
```

Do a first manual run to make sure everything works:

```bash
docker compose up -d --build
```

Exit back to root:

```bash
exit
```

---

## Step 8 — Disable password login on the server

```bash
sudo nano /etc/ssh/sshd_config
```

Find and set:

```
PasswordAuthentication no
PermitRootLogin no
```

Restart SSH:

```bash
sudo systemctl restart ssh
```

> ⚠️ Before doing this, open a second terminal and verify you can still connect with your personal key. If that works, it is safe to disable passwords.

---

## Step 9 — Verify the CI key is locked down

From your **local machine**, test connecting with the CI key:

```bash
ssh -i ~/.ssh/ci_deploy_key deploy@YOUR_SERVER_IP
```

Expected behavior:
- Connects without asking for a password
- Immediately runs `deploy.sh` and prints the output
- Exits — no interactive shell

If you get a shell prompt instead, the `command=` restriction was not saved correctly — go back to Step 3.

---

## What you end up with

| Key | Who uses it | What it can do |
|---|---|---|
| `hetzner_key` | You, from your local machine | Full shell as deploy |
| `ci_deploy_key` | GitHub Actions | Only runs `deploy.sh` |

The `authorized_keys` file will look like this:

```
# your personal access - full shell
ssh-ed25519 AAAA...hetzner_key.pub... my-laptop

# CI access - deploy script only
command="/home/deploy/deploy.sh",no-port-forwarding,no-agent-forwarding,no-pty ssh-ed25519 AAAA...ci_deploy_key.pub... ci-deploy
```