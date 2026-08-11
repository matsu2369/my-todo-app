import { TodoApp } from "@/components/todo-app";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-background">
      <div className="w-full max-w-3xl flex flex-col gap-8 px-5 py-16">
        <h1 className="text-2xl font-semibold text-center">Todo</h1>
        <TodoApp />
      </div>
    </main>
  );
}
