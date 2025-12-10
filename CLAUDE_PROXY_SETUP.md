# Using Your Claude Subscription with Constellation

This guide explains how to use your **Claude Pro/Max subscription** with Constellation instead of paying for API tokens.

## Overview

By default, Constellation requires an Anthropic API key which charges per token. However, you can use **CLIProxyAPI** to leverage your existing Claude subscription (Pro or Max) at no additional cost.

### How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Constellation  │────▶│   CLIProxyAPI    │────▶│  Anthropic API  │
│  (localhost)    │     │  (port 8317)     │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                        │
        │  Dummy API Key        │  OAuth Bearer Token    │
        │  (X-Api-Key)          │  (Authorization)       │
        └───────────────────────┴────────────────────────┘
```

CLIProxyAPI acts as a transparent proxy that:
1. Accepts requests with a dummy API key
2. Strips the API key header
3. Adds your OAuth Bearer token from your Claude subscription
4. Forwards the request to Anthropic's API

## Prerequisites

- **Claude Pro or Max subscription** at [claude.ai](https://claude.ai)
- One of: macOS, Linux, or Windows

## Installation

### macOS (Homebrew)

```bash
# Install CLIProxyAPI
brew install cliproxyapi

# Start the service (runs in background)
brew services start cliproxyapi
```

### Linux

```bash
# One-line installer
curl -fsSL https://raw.githubusercontent.com/brokechubb/cliproxyapi-installer/refs/heads/master/cliproxyapi-installer | bash
```

### Windows

Download the latest release from [GitHub Releases](https://github.com/router-for-me/CLIProxyAPI/releases) or use the desktop GUI application.

### Docker

```bash
docker run --rm -p 8317:8317 \
  -v /path/to/config.yaml:/CLIProxyAPI/config.yaml \
  -v /path/to/auth-dir:/root/.cli-proxy-api \
  eceasy/cli-proxy-api:latest
```

## Authentication

### Step 1: Login with Claude OAuth

```bash
cli-proxy-api --claude-login
```

This will:
1. Open your default browser to Anthropic's OAuth page
2. Ask you to sign in with your Claude account
3. Store the OAuth tokens locally in `~/.cli-proxy-api/`

> **Tip:** If you're on a headless server, use `--no-browser` to get a URL you can open manually.

### Step 2: Verify the Proxy is Running

The proxy runs on **port 8317** by default. Test it:

```bash
curl http://localhost:8317/v1/models
```

You should see a list of available Claude models.

## Configuring Constellation

### Option 1: Environment Variable

Set the proxy URL before starting Constellation:

```bash
export ANTHROPIC_BASE_URL=http://localhost:8317
npm run dev
```

### Option 2: In-App Configuration

1. Open Constellation
2. Go to Settings
3. Under "API Configuration", enable "Use Proxy"
4. Set Proxy URL to `http://localhost:8317`
5. Enter any dummy value for API key (e.g., `sk-dummy`)

## Troubleshooting

### "Connection refused" on port 8317

The proxy isn't running. Start it:

```bash
# macOS
brew services start cliproxyapi

# Linux (if installed as service)
systemctl start cliproxyapi

# Manual start
cli-proxy-api
```

### "Unauthorized" or "Invalid token"

Your OAuth token may have expired. Re-authenticate:

```bash
cli-proxy-api --claude-login
```

### Proxy works but Constellation shows errors

Ensure Constellation is configured to use `http://localhost:8317` as the base URL, not the default Anthropic API endpoint.

## Token Refresh

CLIProxyAPI automatically refreshes your OAuth tokens before they expire. The tokens are stored in:

- **macOS/Linux:** `~/.cli-proxy-api/claude-{email}.json`
- **Windows:** `%USERPROFILE%\.cli-proxy-api\claude-{email}.json`

## Security Notes

- OAuth tokens are stored locally on your machine
- The proxy only runs on localhost by default (not exposed to network)
- Never share your `~/.cli-proxy-api/` directory

## Resources

- [CLIProxyAPI GitHub](https://github.com/router-for-me/CLIProxyAPI)
- [CLIProxyAPI Documentation](https://help.router-for.me/)
- [Original Setup Guide](https://gist.github.com/chandika/c4b64c5b8f5e29f6112021d46c159fdd)
- [Alternative: ai-cli-proxy-api](https://github.com/tiendung/ai-cli-proxy-api)

## Cost Comparison

| Method | Cost |
|--------|------|
| Anthropic API | ~$15/million input tokens, ~$75/million output tokens (Claude Opus) |
| Claude Pro subscription | $20/month flat rate |
| Claude Max subscription | $100-200/month flat rate |

For heavy usage, your subscription can provide significant savings!
