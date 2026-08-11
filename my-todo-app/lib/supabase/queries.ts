import { createClient } from "@/lib/supabase/client";

export type AppUser = { id: string; name: string; email: string };
export type Todo = { id: string; text: string; completed: boolean };

export async function listUsers(): Promise<AppUser[]> {
  const { data, error } = await createClient()
    .from("users")
    .select("id, name, email")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createUser(name: string, email: string): Promise<AppUser> {
  const { data, error } = await createClient()
    .from("users")
    .insert({ name: name.trim(), email: email.trim().toLowerCase() })
    .select("id, name, email")
    .single();
  if (error) throw error;
  return data;
}

export async function listTodos(userId: string): Promise<Todo[]> {
  const { data, error } = await createClient()
    .from("todos")
    .select("id, text, completed")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertTodo(userId: string, todo: Todo): Promise<void> {
  const { error } = await createClient()
    .from("todos")
    .insert({ id: todo.id, user_id: userId, text: todo.text, completed: todo.completed });
  if (error) throw error;
}

export async function setTodoCompleted(id: string, completed: boolean): Promise<void> {
  const { error } = await createClient().from("todos").update({ completed }).eq("id", id);
  if (error) throw error;
}

export async function deleteTodo(id: string): Promise<void> {
  const { error } = await createClient().from("todos").delete().eq("id", id);
  if (error) throw error;
}

export function isDuplicateEmailError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "23505"
  );
}
