import { Hono } from 'hono';
import { OAuthProvider, OAuthHelpers } from '@cloudflare/workers-oauth-provider';
import { createMcpHandler } from 'agents/mcp/server';
import { createTodoServer } from './mcp';
import { handleAuthorize, handlePingOneCallback, handleConsentApproval } from './auth/ping-handler';
import type { Env, Props } from './config';

/**
 * Worker Export - OAuth Server & MCP Gateway (HTTP Interface)
 *
 * Cloudflare Workers OAuth Provider, which serves as the public entry point for all incoming HTTP requests.
 * Manages the OAuth authorization and MCP communication flow.
 *   - OAuth Server: Implements the OAuth endpoints for MCP clients.
 *   - OIDC Client: Delegates user authentication to PingOne with a custom hono router.
 *   - Stateless Router: Serves a fresh MCP server instance per request (MCP SDK v2), with the
 *     authenticated session injected by the OAuth provider into the handler execution context.
 */
export default new OAuthProvider({
  authorizeEndpoint: '/authorize',
  clientRegistrationEndpoint: '/register',
  tokenEndpoint: '/token',
  defaultHandler: new Hono<{ Bindings: Env & { OAUTH_PROVIDER: OAuthHelpers } }>()
    .get('/authorize', handleAuthorize)
    .post('/authorize', handleConsentApproval)
    .get('/callback', handlePingOneCallback) as any,
  apiRoute: '/mcp',
  apiHandler: {
    fetch: (request, env, ctx) => {
      const props = (ctx as { props?: Props }).props!;
      return createMcpHandler(() => createTodoServer(env as Env, props))(request, env, ctx);
    },
  },
});
