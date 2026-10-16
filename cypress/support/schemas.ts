// API contracts as zod schemas. strictObject fails on any extra field, so a new or renamed field
// in an API answer (for example a leaked password or ownerId) breaks the contract test at once.
import { z } from 'zod';

export const UserSchema = z.strictObject({
  id: z.string().min(1),
  username: z.string().min(1),
  name: z.string().min(1),
});

export const LoginResponseSchema = z.strictObject({
  token: z.uuid(),
  user: UserSchema,
});

export const TaskSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(3).max(80),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.iso.date().nullable(),
  done: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const TaskListSchema = z.strictObject({
  tasks: z.array(TaskSchema),
});

export const ErrorSchema = z.strictObject({
  error: z.string().min(1),
  field: z.string().optional(),
});

export type Task = z.infer<typeof TaskSchema>;
export type User = z.infer<typeof UserSchema>;

/** Asserts that `body` matches `schema`; on failure the message lists every broken field. */
export function expectSchema(schema: z.ZodType, body: unknown): void {
  const result = schema.safeParse(body);
  expect(result.success, result.success ? 'matches the schema' : z.prettifyError(result.error)).to.equal(
    true,
  );
}
