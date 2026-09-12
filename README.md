<div align="center">
  <img src="./src/lib/assets/logo.png" alt="Kapan" width="120" />
  <h1>kapan</h1>
  <p>[kaˈpan] <b>noun, turk.</b></p>
  <p>a trap that automatically catches free games before they disappear.</p>
</div>

---

## What is kapan?

**kapan** is a self-hosted web app that hunts for free games so you don't have to. It checks Steam and Epic Games for limited-time 100% discount offers and automatically redeems them to your account. All on a configurable schedule, running silently in the background via Docker.

- 'Headless' browser automation handles the actual redeeming
- Cron-based scheduling per store
- Push notifications via multiple providers when games are claimed
- Full history log of every redemption attempt
- Zero external dependencies beyond Docker

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Running

The image is published to `ghcr.io/enercif/kapan` for `linux/amd64` and `linux/arm64` - no clone needed.

1. Generate an encryption key

   macOS / Linux

   ```bash
   openssl rand -hex 32
   ```

   Windows PowerShell

   ```powershell
   -join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })
   ```

2. Start the container - one command, env and volume included (replace the key):

   ```bash
   docker run -d --name kapan --restart unless-stopped \
     -p 3000:3000 -p 6080:6080 \
     -e ENCRYPTION_KEY=<your-key> \
     -e ORIGIN=http://localhost:3000 \
     -e TZ=<your-zimezone> \
     -v kapan-data:/app/.data \
     ghcr.io/enercif/kapan:latest
   ```

3. Open [http://localhost:3000](http://localhost:3000) and configure your stores.

4. Hit **Login** on a store card, then open the noVNC button in the header to complete the login.
   The X server and VNC only run while a login or redeem is in progress - port 6080 is closed the rest of the time.

### Running with Docker Compose

Prefer a compose file? Put an `.env` next to a `compose.yaml`:

```env
ENCRYPTION_KEY=
ORIGIN=http://localhost:3000
TZ=
```

```yaml
services:
  kapan:
    image: ghcr.io/enercif/kapan:latest
    container_name: kapan
    restart: unless-stopped
    ports:
      - '3000:3000'
      - '6080:6080'
    env_file:
      - .env
    volumes:
      - kapan-data:/app/.data

volumes:
  kapan-data:
```

Then pull and start it:

```bash
docker compose pull && docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000) and log in to your stores as above.

Available tags: `latest`, `main`, version tags such as `1.2.3` / `1.2`, and `sha-<commit>`.

### Updating

Docker run - pull the new image and recreate the container (the `kapan-data` volume keeps your data):

```bash
docker pull ghcr.io/enercif/kapan:latest
docker rm -f kapan
```

Then run the `docker run` command from above again.

Docker Compose:

```bash
docker compose pull && docker compose up -d
```

### Development

```bash
pnpm install
pnpm dev
```

## Version 1.0 Roadmap

The following features are planned before the `v1.0` release:

- [ ] **Better Login Flow**: replace the current noVNC setup with an in-app dialog that streams the browser session, enabling interactive login without exposing a VNC port
- [ ] **More stores**: expand beyond Steam and Epic Games (e.g. GOG, Prime Gaming)
- [ ] **More notification providers**: add support for additional push notification services beyond ntfy and Telegram
- [ ] **Multiple profiles per store**: manage and redeem games across several accounts for the same store
- [ ] **Automatic login**: store encrypted credentials in the database and log in automatically without any manual interaction
- [ ] **i18n**: internationalization support for multiple languages in the UI

## Support

If you find kapan useful, consider buying me a coffee ☕

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/enercif)

## License

This project is licensed under [MIT](LICENSE).
