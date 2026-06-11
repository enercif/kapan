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

### Running with Docker Compose

1. Generate an enctyption Key

   macOS / Linux

   ```bash
   openssl rand -hex 32
   ```

   Windows PowerShell

   ```powershell
   -join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })
   ```

2. Create a `.env` file:

   ```env
   ENCRYPTION_KEY=
   ORIGIN=http://localhost:3000
   ```

3. Start the container:

   ```bash
   docker compose up -d
   ```

4. Open [http://localhost:3000](http://localhost:3000) and configure your stores.

5. Open [http://localhost:6080/vnc.html](http://localhost:6080/vnc.html) and connect to login into the stores.

### Development

```bash
pnpm install
pnpm dev
```

## Version 1.0 Roadmap

The following features are planned before the `v1.0` release:

- [ ] **Better Login Flow**: replace the current noVNC setup with an in-app dialog that streams the browser session, enabling interactive login without exposing a VNC port
- [ ] **More stores**: expand beyond Steam and Epic Games (e.g. GOG, Prime Gaming, Humble Bundle)
- [ ] **More notification providers**: add support for additional push notification services beyond ntfy and Telegram
- [ ] **Multiple profiles per store**: manage and redeem games across several accounts for the same store
- [ ] **Automatic login**: store encrypted credentials in the database and log in automatically without any manual interaction
- [ ] **i18n**: internationalization support for multiple languages in the UI

## Support

If you find kapan useful, consider buying me a coffee ☕

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/enercif)

## License

This project is licensed under [MIT](LICENSE).
