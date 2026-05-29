import Database from "@tauri-apps/plugin-sql";
import type { List, Task, Tag, Priority } from "@/types";

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:flowlist.db");
  }
  return db;
}

function genId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

export async function getLists(): Promise<List[]> {
  const db = await getDb();
  return db.select<List[]>("SELECT * FROM lists ORDER BY sort_order ASC");
}

export async function createList(name: string, color: string): Promise<List> {
  const db = await getDb();
  const id = genId();
  await db.execute(
    "INSERT INTO lists (id, name, color) VALUES ($1, $2, $3)",
    [id, name, color]
  );
  return (await db.select<List[]>("SELECT * FROM lists WHERE id = $1", [id]))[0];
}

export async function updateList(id: string, data: Partial<Pick<List, "name" | "color" | "sort_order">>): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }
  if (fields.length === 0) return;
  values.push(id);
  await db.execute(`UPDATE lists SET ${fields.join(", ")} WHERE id = $${idx}`, values);
}

export async function deleteList(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM tasks WHERE list_id = $1", [id]);
  await db.execute("DELETE FROM lists WHERE id = $1", [id]);
}

export async function getTasks(listId: string): Promise<Task[]> {
  const db = await getDb();
  return db.select<Task[]>(
    "SELECT * FROM tasks WHERE list_id = $1 AND parent_id IS NULL ORDER BY sort_order ASC",
    [listId]
  );
}

export async function getAllTasks(): Promise<Task[]> {
  const db = await getDb();
  return db.select<Task[]>(
    "SELECT * FROM tasks WHERE parent_id IS NULL ORDER BY sort_order ASC"
  );
}

export async function createTask(
  listId: string,
  title: string,
  priority: Priority = 4,
  parentId?: string | null
): Promise<Task> {
  const db = await getDb();
  const id = genId();
  const maxSort = await db.select<[{ max_order: number }]>(
    "SELECT COALESCE(MAX(sort_order), -1) as max_order FROM tasks WHERE list_id = $1 AND parent_id IS NULL",
    [listId]
  );
  const sortOrder = (maxSort[0]?.max_order ?? -1) + 1;
  await db.execute(
    `INSERT INTO tasks (id, list_id, parent_id, title, priority, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, listId, parentId ?? null, title, priority, sortOrder]
  );
  return (await db.select<Task[]>("SELECT * FROM tasks WHERE id = $1", [id]))[0];
}

export async function updateTask(
  id: string,
  data: Partial<Pick<Task, "title" | "note" | "priority" | "due_date" | "is_completed" | "completed_at" | "sort_order" | "list_id" | "repeat_rule">>
): Promise<void> {
  const db = await getDb();
  const fields: string[] = ["updated_at = datetime('now')"];
  const values: unknown[] = [];
  let idx = 1;
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(value);
    }
  }
  values.push(id);
  await db.execute(`UPDATE tasks SET ${fields.join(", ")} WHERE id = $${idx}`, values);
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM task_tags WHERE task_id = $1", [id]);
  await db.execute("DELETE FROM reminders WHERE task_id = $1", [id]);
  await db.execute("DELETE FROM tasks WHERE id = $1 OR parent_id = $1", [id]);
}

export async function toggleTaskComplete(id: string, completed: boolean): Promise<void> {
  await updateTask(id, {
    is_completed: completed ? 1 : 0,
    completed_at: completed ? new Date().toISOString() : null,
  });
}

export async function getSubtasks(parentId: string): Promise<Task[]> {
  const db = await getDb();
  return db.select<Task[]>(
    "SELECT * FROM tasks WHERE parent_id = $1 ORDER BY sort_order ASC",
    [parentId]
  );
}

export async function searchTasks(query: string): Promise<Task[]> {
  const db = await getDb();
  return db.select<Task[]>(
    "SELECT * FROM tasks WHERE (title LIKE $1 OR note LIKE $1) AND parent_id IS NULL ORDER BY updated_at DESC",
    [`%${query}%`]
  );
}

export async function getTodayTasks(): Promise<Task[]> {
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);
  return db.select<Task[]>(
    "SELECT * FROM tasks WHERE date(due_date) = $1 AND parent_id IS NULL ORDER BY priority ASC",
    [today]
  );
}

export async function getTags(): Promise<Tag[]> {
  const db = await getDb();
  return db.select<Tag[]>("SELECT * FROM tags");
}

export async function createTag(name: string, color: string): Promise<Tag> {
  const db = await getDb();
  const id = genId();
  await db.execute("INSERT INTO tags (id, name, color) VALUES ($1, $2, $3)", [id, name, color]);
  return (await db.select<Tag[]>("SELECT * FROM tags WHERE id = $1", [id]))[0];
}

export async function deleteTag(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM task_tags WHERE tag_id = $1", [id]);
  await db.execute("DELETE FROM tags WHERE id = $1", [id]);
}

export async function addTaskTag(taskId: string, tagId: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES ($1, $2)",
    [taskId, tagId]
  );
}

export async function removeTaskTag(taskId: string, tagId: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM task_tags WHERE task_id = $1 AND tag_id = $2", [taskId, tagId]);
}

export async function getTaskTags(taskId: string): Promise<Tag[]> {
  const db = await getDb();
  return db.select<Tag[]>(
    "SELECT t.* FROM tags t INNER JOIN task_tags tt ON t.id = tt.tag_id WHERE tt.task_id = $1",
    [taskId]
  );
}
