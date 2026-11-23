// Centralised, idempotent cleanup registry.
// Engines register teardown functions; runCleanup() executes them once and clears the list.
type CleanupTask = () => void;

const tasks = new Set<CleanupTask>();

export function registerCleanup(task: CleanupTask): () => void {
  tasks.add(task);
  return () => tasks.delete(task);
}

export function runCleanup(): void {
  const list = Array.from(tasks);
  tasks.clear();
  for (const task of list) {
    try {
      task();
    } catch {
      // Cleanup must never throw into the UI; failures are swallowed on purpose.
    }
  }
}
