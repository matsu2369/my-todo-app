"use client";

import { useEffect, useState } from "react";
import { AuthScreen } from "@/components/auth-screen";
import { TodoList } from "@/components/todo-list";
import { Button } from "@/components/ui/button";
import { listUsers, type AppUser } from "@/lib/supabase/queries";

const CURRENT_USER_STORAGE_KEY = "todo-app.currentUserId";

export function TodoApp() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCurrentUserId(localStorage.getItem(CURRENT_USER_STORAGE_KEY));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (currentUserId) {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, currentUserId);
    } else {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    }
  }, [currentUserId, loaded]);

  useEffect(() => {
    let cancelled = false;
    listUsers()
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch(() => {
        if (!cancelled) setUsersError("ユーザー一覧の読み込みに失敗しました");
      })
      .finally(() => {
        if (!cancelled) setUsersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded || usersLoading || !currentUserId) return;
    const stillExists = users.some((user) => user.id === currentUserId);
    if (!stillExists) setCurrentUserId(null);
  }, [loaded, usersLoading, users, currentUserId]);

  if (!loaded) return null;

  const currentUser = users.find((user) => user.id === currentUserId) ?? null;

  if (!currentUser) {
    return (
      <div className="flex flex-col gap-4">
        {usersError && (
          <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {usersError}
          </p>
        )}
        <AuthScreen
          users={users}
          usersLoading={usersLoading}
          onLogin={setCurrentUserId}
          onSignedUp={(user) => {
            setUsers((prev) => [...prev, user]);
            setCurrentUserId(user.id);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 px-4 py-3">
        <p className="text-sm font-medium">
          ようこそ、{currentUser.name}さん
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentUserId(null)}
        >
          ログアウト
        </Button>
      </div>
      <TodoList key={currentUser.id} userId={currentUser.id} />
    </div>
  );
}
