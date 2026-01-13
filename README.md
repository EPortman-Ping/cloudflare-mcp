# Cloudflare Workers MCP Server + Ping Identity

This repository features three implementations of [Model Context Protocol (MCP)](https://modelcontextprotocol.io/docs/getting-started/intro) servers, built on [Cloudflare Workers](https://developers.cloudflare.com/workers/) and integrated with Ping Identity solutions.

These servers act as a secure bridge between AI agents (like Claude Code or Claude Desktop) and your enterprise APIs, ensuring that every action taken by the AI is authenticated and authorized via your existing Ping Identity infrastructure.

1. PingOne
    - Uses the [Cloudflare Workers OAuth Provider](https://github.com/cloudflare/workers-oauth-provider)

2. PingOne AIC
    - Uses Dynamic Client Registration for mcp client onboarding
    - Uses Token Exchange to generate tokens for downstream APIs

3. PingFederate
    - Uses Dynamic Client Registration for mcp client onboarding
    - Uses Token Exchange to generate tokens for downstream APIs

## Projects

1. [PingOne](/remote-mcp-pingone/)
    - **Identity Provider:** PingOne Multi-Tenant
    - **Key Feature:** Uses the Cloudflare Workers OAuth Provider library to act as an OIDC Client to PingOne

2. [PingOne Advanced Identity Cloud](/remote-mcp-pingone-aic/)
    - **Identity Provider:** PingOne Advanced Identity Cloud
    - **Key Feature:** Implements Dynamic Client Registration (DCR) for seamless MCP client onboarding and Token Exchange for downstream API security

3. [PingFederate](/remote-mcp-ping-federate/)
    - **Identity Provider:** PingFederate
    - **Key Feature:** Implements Dynamic Client Registration (DCR) for seamless MCP client onboarding and Token Exchange for downstream API security

## Getting Started
To deploy any of these servers:
1. Navigate to the specific project directory
2. Follow the detailed README.md within that directory for setup and configuration instructions
