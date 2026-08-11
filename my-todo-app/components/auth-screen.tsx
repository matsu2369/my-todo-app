"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createUser,
  isDuplicateEmailError,
  type AppUser,
} from "@/lib/supabase/queries";

type Mode = "login" | "signup";

export function AuthScreen({
  users,
  usersLoading,
  onLogin,
  onSignedUp,
}: {
  users: AppUser[];
  usersLoading: boolean;
  onLogin: (userId: string) => void;
  onSignedUp: (user: AppUser) => void;
}) {
  const [mode, setMode] = useState<Mode>("login");
  const [selectedId, setSelectedId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail) return;
    setSubmitting(true);
    setError(null);
    try {
      const user = await createUser(trimmedName, trimmedEmail);
      onSignedUp(user);
    } catch (err) {
      if (isDuplicateEmailError(err)) {
        setError("このメールアドレスは既に登録されています");
      } else {
        setError("登録に失敗しました。もう一度お試しください。");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">
          {mode === "login" ? "ログイン" : "新規登録"}
        </CardTitle>
        <CardDescription>
          {mode === "login"
            ? "ユーザーを選択してログインしてください"
            : "名前とメールアドレスを入力してください"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mode === "login" ? (
          <div className="flex flex-col gap-6">
            {!usersLoading && users.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                ユーザーが登録されていません。新規登録してください。
              </p>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="user-select">ユーザー</Label>
                <select
                  id="user-select"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  disabled={usersLoading || users.length === 0}
                  className={cn(
                    "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                  )}
                >
                  <option value="" disabled>
                    {usersLoading ? "読み込み中..." : "ユーザーを選択"}
                  </option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button
              type="button"
              className="w-full"
              disabled={!selectedId}
              onClick={() => onLogin(selectedId)}
            >
              ログイン
            </Button>
            <div className="text-center text-sm">
              アカウントをお持ちでない方は{" "}
              <button
                type="button"
                className="underline underline-offset-4"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
              >
                新規登録
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="signup-name">名前</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="山田太郎"
                  required
                  maxLength={50}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signup-email">メールアドレス</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "登録中..." : "新規登録"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              すでにアカウントをお持ちの方は{" "}
              <button
                type="button"
                className="underline underline-offset-4"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
              >
                ログイン
              </button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
