import { McpServer } from '@modelcontextprotocol/server';
import { z } from 'zod';
import { TodoApiClient } from './todoApi.client';
import type { Env, Props } from './config';

interface McpToolContent {
  type: 'text';
  text: string;
};

/**
 * Creates a stateless MCP server instance (MCP SDK v2), one per request.
 *
 * Each instance registers controlled, authenticated access to MCP tools. The OAuth
 * provider delivers the authenticated session (`props`) into the handler execution
 * context; the PingOne token is already audienced for the downstream API via the
 * `resource` authorize param, so token exchange is not necessary.
 */
export function createTodoServer(env: Env, props: Props): McpServer {
  const todoClient = new TodoApiClient(env.API_URL);

  const srv = new McpServer({
    name: 'OIDC MCP Server secured with PingOne',
    version: '0.0.1',
  });

  srv.registerTool(
    'who_am_I',
    {
      description: 'Get the token for the current session info, helpful for debugging.',
    },
    async () => {
      if (!props) {
        const mcpResponse: McpToolContent = { type: 'text', text: 'Error: User session not found.' };
        return { content: [mcpResponse], isError: true };
      };
      const mcpResponse: McpToolContent = { type: 'text', text: JSON.stringify(props, null, 2) };
      return { content: [mcpResponse] };
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
        const data = await todoClient.getTodos(props.subjectToken);
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
        const data = await todoClient.addTodo(props.subjectToken, inputs.text);
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
      title: 'Toggle Todo Status',
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
        const data = await todoClient.toggleTodo(props.subjectToken, inputs.todoId, inputs.completed);
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
    'deleteTodo',
    {
      title: 'Delete Todo',
      description: 'Deletes an existing Todo, using its ID',
      inputSchema: z.object({
        todoId: z.string().describe('The ID of the Todo to delete')
      }),
    },
    async (inputs) => {
      if (!props) {
        const mcpResponse: McpToolContent = { type: 'text', text: 'Error: User session not found.' };
        return { content: [mcpResponse], isError: true };
      };
      try {
        const data = await todoClient.deleteTodo(props.subjectToken, inputs.todoId);
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
