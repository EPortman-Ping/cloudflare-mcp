import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { decodeJwt} from 'jose';
import { getActorToken, exchangeForTodoApiToken } from './auth';
import { TodoApiClient } from './todoApi.client';
import { type Props, type Env, API_ALLOWABLE_SCOPES } from './config';

interface McpToolContent {
  type: 'text';
  text: string;
};

/**
 * Creates a stateless MCP server instance (MCP SDK v2), one per request.
 *
 * Each instance registers controlled, authenticated access to MCP tools. It performs
 * Token Exchange (delegation) to obtain a token properly audienced for any downstream
 * APIs. The authenticated session (`props`) is captured by the caller and flows in
 * through the factory closure.
 */
export function createTodoServer(env: Env, props: Props): McpServer {
  const todoApiClient = new TodoApiClient(env.API_URL);

  const srv = new McpServer({
    name: 'MCP Server secured with PingOne AIC',
    version: '0.0.1',
  });

  srv.registerTool(
    'who_am_I',
    {
      description: 'Get the claims for the current session info, helpful for debugging.',
    },
    async () => {
      if (!props) {
        const mcpResponse: McpToolContent = { type: 'text', text: 'Error: User session not found.' };
        return { content: [mcpResponse], isError: true };
      };
      const mcpResponse: McpToolContent = { type: 'text', text: JSON.stringify(props.subjectClaims, null, 2) };
      return { content: [mcpResponse] };
    },
  );

  srv.registerTool(
    'peek_api_token_claims',
    {
      description: 'Get the token claims the MCP server will use on the downstream API on behalf of the current session, helpful for debugging.',
    },
    async () => {
      if (!props) {
        const mcpResponse: McpToolContent = { type: 'text', text: 'Error: User session not found.' };
        return { content: [mcpResponse], isError: true };
      };
      try {
        const subjectScopes = props.subjectClaims.scope as Array<string>;
        const actorScopes = subjectScopes.filter(scope => API_ALLOWABLE_SCOPES.includes(scope));
        const actorToken = await getActorToken(env, actorScopes);
        const apiToken = await exchangeForTodoApiToken(env, props.subjectToken, actorToken, actorScopes);
        const apiClaims = await decodeJwt(apiToken);
        const mcpResponse: McpToolContent = { type: 'text', text: JSON.stringify(apiClaims, null, 2) };
        return { content: [mcpResponse] };
      } catch (error: any) {
        const errorMessage = `Token Exchange/Introspection Failed: ${error.message || 'Unknown error'}`;
        const mcpResponse: McpToolContent = { type: 'text', text: errorMessage };
        return { content: [mcpResponse], isError: true };
      };
    },
  );

  srv.registerTool(
    'get_my_todo_list',
    {
      description: 'Get the Todo list for the current session from the Todo API.',
    },
    async () => {
      if (!props) {
        const mcpResponse: McpToolContent = { type: 'text', text: 'Error: User session not found.' };
        return { content: [mcpResponse], isError: true };
      };
      try {
        const subjectScopes = props.subjectClaims.scope as Array<string>;
        const actorScopes = subjectScopes.filter(scope => API_ALLOWABLE_SCOPES.includes(scope));
        const actorToken = await getActorToken(env, actorScopes);
        const apiToken = await exchangeForTodoApiToken(env, props.subjectToken, actorToken, actorScopes);
        const data = await todoApiClient.getTodos(apiToken);
        const mcpResponse: McpToolContent = { type: 'text', text: JSON.stringify(data, null, 2)};
        return { content: [mcpResponse] };
      } catch (error: any) {
        const errorMessage = `Get Todos failed: ${error.message || 'Unknown error'}`;
        const mcpResponse: McpToolContent = { type: 'text', text: errorMessage };
        return { content: [mcpResponse], isError: true };
      };
    },
  );

  srv.registerTool(
    'create_new_todo',
    {
      description: 'Adds a new todo to the current sessions Todo list by calling the Todo API.',
      inputSchema: z.object({
        text: z.string().describe('Todo item text'),
      }),
    },
    async (inputs) => {
      if (!props) {
        const mcpResponse: McpToolContent = { type: 'text', text: 'Error: User session not found.' };
        return { content: [mcpResponse], isError: true };
      };
      try {
        const subjectScopes = props.subjectClaims.scope as Array<string>;
        const actorScopes = subjectScopes.filter(scope => API_ALLOWABLE_SCOPES.includes(scope));
        const actorToken = await getActorToken(env, actorScopes);
        const apiToken = await exchangeForTodoApiToken(env, props.subjectToken, actorToken, actorScopes);
        const data = await todoApiClient.addTodo(apiToken, inputs.text);
        const mcpResponse: McpToolContent = { type: 'text', text: JSON.stringify(data, null, 2)};
        return { content: [mcpResponse] };
      } catch (error: any) {
        const errorMessage = `Create Todo failed: ${error.message || 'Unknown error'}`;
        const mcpResponse: McpToolContent = { type: 'text', text: errorMessage };
        return { content: [mcpResponse], isError: true };
      };
    },
  );

  srv.registerTool(
    'toggle_todo_status',
    {
      description: 'Marks an existing Todo as either completed or incomplete, using its ID and the target status',
      inputSchema: z.object({
        todoId: z.string().describe('The ID of the Todo to update'),
        completed: z.boolean().describe('The target status (true for complete, false for incomplete)'),
      }),
    },
    async (inputs) => {
      if (!props) {
        const mcpResponse: McpToolContent = { type: 'text', text: 'Error: User session not found.' };
        return { content: [mcpResponse], isError: true };
      };
      try {
        const subjectScopes = props.subjectClaims.scope as Array<string>;
        const actorScopes = subjectScopes.filter(scope => API_ALLOWABLE_SCOPES.includes(scope));
        const actorToken = await getActorToken(env, actorScopes);
        const apiToken = await exchangeForTodoApiToken(env, props.subjectToken, actorToken, actorScopes);
        const data = await todoApiClient.toggleTodo(apiToken, inputs.todoId, inputs.completed);
        const mcpResponse: McpToolContent = { type: 'text', text: JSON.stringify(data, null, 2)};
        return { content: [mcpResponse] };
      } catch (error: any) {
        const errorMessage = `Toggle Todo failed: ${error.message || 'Unknown error'}`;
        const mcpResponse: McpToolContent = { type: 'text', text: errorMessage };
        return { content: [mcpResponse], isError: true };
      };
    },
  );

  srv.registerTool(
    'delete_todo',
    {
      description: 'Deletes an existing Todo, using its ID',
      inputSchema: z.object({
        todoId: z.string().describe('The ID of the Todo to delete'),
      }),
    },
    async (inputs) => {
      if (!props) {
        const mcpResponse: McpToolContent = { type: 'text', text: 'Error: User session not found.' };
        return { content: [mcpResponse], isError: true };
      };
      try {
        const subjectScopes = props.subjectClaims.scope as Array<string>;
        const actorScopes = subjectScopes.filter(scope => API_ALLOWABLE_SCOPES.includes(scope));
        const actorToken = await getActorToken(env, actorScopes);
        const apiToken = await exchangeForTodoApiToken(env, props.subjectToken, actorToken, actorScopes);
        const data = await todoApiClient.deleteTodo(apiToken, inputs.todoId);
        const mcpResponse: McpToolContent = { type: 'text', text: JSON.stringify(data, null, 2)};
        return { content: [mcpResponse] };
      } catch (error: any) {
        const errorMessage = `Delete Todo failed: ${error.message || 'Unknown error'}`;
        const mcpResponse: McpToolContent = { type: 'text', text: errorMessage };
        return { content: [mcpResponse], isError: true };
      };
    },
  );

  return srv;
};
