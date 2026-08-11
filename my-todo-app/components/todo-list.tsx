"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { GripVertical, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  deleteTodo as deleteTodoRequest,
  insertTodo,
  listTodos,
  setTodoCompleted,
  type Todo,
} from "@/lib/supabase/queries";

type ColumnId = "todo" | "done";

const COLUMNS: {
  id: ColumnId;
  title: string;
  dotColor: string;
  headerColor: string;
}[] = [
  {
    id: "todo",
    title: "未完了",
    dotColor: "bg-blue-500",
    headerColor: "text-blue-700 dark:text-blue-400",
  },
  {
    id: "done",
    title: "完了済み",
    dotColor: "bg-emerald-500",
    headerColor: "text-emerald-700 dark:text-emerald-400",
  },
];

export function TodoList({ userId }: { userId: string }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listTodos(userId)
      .then((rows) => {
        if (!cancelled) setTodos(rows);
      })
      .catch(() => {
        if (!cancelled) setError("タスクの読み込みに失敗しました");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const addTodo = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const optimistic: Todo = {
      id: crypto.randomUUID(),
      text: trimmed,
      completed: false,
    };
    setText("");
    setError(null);
    setTodos((prev) => [...prev, optimistic]);
    try {
      await insertTodo(userId, optimistic);
    } catch {
      setTodos((prev) => prev.filter((todo) => todo.id !== optimistic.id));
      setText(trimmed);
      setError("タスクの追加に失敗しました");
    }
  };

  const toggleTodo = async (id: string) => {
    const target = todos.find((todo) => todo.id === id);
    if (!target) return;
    const next = !target.completed;
    setError(null);
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, completed: next } : todo)),
    );
    try {
      await setTodoCompleted(id, next);
    } catch {
      setTodos((prev) =>
        prev.map((todo) => (todo.id === id ? { ...todo, completed: !next } : todo)),
      );
      setError("更新に失敗しました");
    }
  };

  const deleteTodo = async (id: string) => {
    const index = todos.findIndex((todo) => todo.id === id);
    if (index === -1) return;
    const removed = todos[index];
    setError(null);
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
    try {
      await deleteTodoRequest(id);
    } catch {
      setTodos((prev) => [
        ...prev.slice(0, index),
        removed,
        ...prev.slice(index),
      ]);
      setError("削除に失敗しました");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || (over.id !== "todo" && over.id !== "done")) return;
    const completed = over.id === "done";
    const id = String(active.id);
    const target = todos.find((todo) => todo.id === id);
    if (!target || target.completed === completed) return;
    setError(null);
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, completed } : todo)),
    );
    try {
      await setTodoCompleted(id, completed);
    } catch {
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === id ? { ...todo, completed: !completed } : todo,
        ),
      );
      setError("移動に失敗しました");
    }
  };

  const activeTodo = todos.find((todo) => todo.id === activeId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          addTodo();
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="新しいタスクを入力..."
          aria-label="新しいタスク"
          maxLength={500}
          disabled={loading}
        />
        <Button type="submit" disabled={loading}>
          追加
        </Button>
      </form>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {COLUMNS.map((column) => {
            const items = todos.filter((todo) =>
              column.id === "done" ? todo.completed : !todo.completed,
            );
            return (
              <Column
                key={column.id}
                id={column.id}
                title={column.title}
                dotColor={column.dotColor}
                headerColor={column.headerColor}
                count={items.length}
              >
                {loading ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    読み込み中...
                  </p>
                ) : items.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    タスクはありません
                  </p>
                ) : (
                  items.map((todo) => (
                    <TaskCard
                      key={todo.id}
                      todo={todo}
                      onToggle={toggleTodo}
                      onDelete={deleteTodo}
                      isDragging={todo.id === activeId}
                    />
                  ))
                )}
              </Column>
            );
          })}
        </div>

        <DragOverlay>
          {activeTodo ? (
            <TaskCardVisual todo={activeTodo} overlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({
  id,
  title,
  dotColor,
  headerColor,
  count,
  children,
}: {
  id: ColumnId;
  title: string;
  dotColor: string;
  headerColor: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-muted/30 p-3 transition-colors sm:p-4",
        isOver && "border-primary/50 bg-muted/60",
      )}
    >
      <div className="flex items-center gap-2 px-1">
        <span className={cn("h-2.5 w-2.5 rounded-full", dotColor)} />
        <h2 className={cn("text-sm font-semibold", headerColor)}>{title}</h2>
        <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground shadow-sm">
          {count}
        </span>
      </div>
      <div className="flex min-h-24 flex-col gap-2">{children}</div>
    </div>
  );
}

function TaskCard({
  todo,
  onToggle,
  onDelete,
  isDragging,
}: {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  isDragging: boolean;
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: todo.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(isDragging && "opacity-40")}
    >
      <TaskCardVisual
        todo={todo}
        onToggle={onToggle}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function TaskCardVisual({
  todo,
  onToggle,
  onDelete,
  dragHandleProps,
  overlay,
}: {
  todo: Todo;
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
  dragHandleProps?: Record<string, unknown>;
  overlay?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 shadow-sm transition-shadow",
        overlay
          ? "rotate-2 shadow-lg"
          : "hover:shadow-md",
        todo.completed && "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30",
      )}
    >
      <button
        type="button"
        className="shrink-0 cursor-grab touch-none text-muted-foreground/50 active:cursor-grabbing hover:text-muted-foreground"
        style={{ touchAction: "none" }}
        aria-label="ドラッグして移動"
        {...dragHandleProps}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Checkbox
        checked={todo.completed}
        onCheckedChange={() => onToggle?.(todo.id)}
        aria-label={`${todo.text} を完了にする`}
      />
      <span
        className={cn(
          "flex-1 text-sm",
          todo.completed && "text-muted-foreground line-through",
        )}
      >
        {todo.text}
      </span>
      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(todo.id)}
          aria-label={`${todo.text} を削除`}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
