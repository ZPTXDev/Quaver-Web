<h1 align="center" style="border-bottom: none;">Quaver-Web</h1>
<h3 align="center">Web dashboard add-on for Quaver.</h3>
<p align="center">
    <a href="https://go.zptx.dev/discord">
        <img alt="Discord" src="https://img.shields.io/discord/334654301651730432?label=chat%20with%20us&style=flat-square">
    </a>
</p>

# ⚠️ Warning

Quaver-Web is in an experimental state. Unless you have good reason to, you should not be using it, especially in conjunction with a public instance of Quaver.

Please proceed with caution. If you need help, getting it started regardless, feel free to ask your question in the Discord server above.

# 🚀 Getting Started

## Prerequisites

Quaver-Web requires a functional instance of Quaver to work.

Ensure your Quaver configuration includes the following:

```json
"features": {
    "web": {
        "enabled": true,
        "port": 3000,
        "allowedOrigins": [
            "http://localhost"
        ],
        "encryptionKey": "Type an encryption key here",
        "https": {
            "enabled": false,
            "key": "key.pem",
            "cert": "cert.pem"
        },
        "dashboardURL": "http://example.com"
    }
}
```

Please modify the configuration as necessary. You may refer to [Quaver Configuration Guide](https://github.com/ZPTXDev/Quaver/blob/master/CONFIGURATION.md) for more information.

## Setup

1. Clone the repository and run `npm install` to install dependencies.
2. Create a `.env` file in the root directory of the project and add the following:

```env
PUBLIC_WEBSOCKET_HOST=http://localhost:3000
PUBLIC_DISCORD_CLIENT_ID=123456789012345678
PUBLIC_SUPPORT_SERVER=http://discord.gg/
PUBLIC_PREMIUM_URL=http://example.com/premium
PRIVATE_SECURE=false
```

> Note: `PRIVATE_SECURE` must be set to `false` if you are running Quaver-Web on HTTP instead of HTTPS.

3. Run `npm run build` to build the project.
4. Run `npm run preview` to start the preview server. (default port is 4173)
5. Navigate to `http://localhost:4173` to view the dashboard.
