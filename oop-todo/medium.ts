enum Priority {
  HIGH = "HIGH",
  LOW = "LOW",
}

interface ITask {
  readonly id: string;
  taskName: string;
  priority: Priority;
  date: string;
}

type TaskInput = Pick<ITask, "taskName" | "priority">;

class Task implements ITask {
  readonly id: string;
  taskName: string;
  priority: Priority;
  date: string;

  constructor({ taskName, priority }: TaskInput) {
    this.id = Task.generateId();
    this.taskName = taskName;
    this.priority = priority;
    this.date = Task.formatDate();
  }

  private static generateId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  private static formatDate(): string {
    return new Date().toISOString();
  }
}

// Composition: Manages task-related operations
class TaskManager {
  private tasks: Task[] = [];

  addTask(input: TaskInput): void {
    this.tasks.push(new Task(input));
  }

  getTasks(): ReadonlyArray<ITask> {
    return this.tasks;
  }

  findTaskById(id: string): Task | undefined {
    return this.tasks.find(task => task.id === id);
  }
}

abstract class BaseUser {
  protected readonly name: string;
  protected loggedIn: boolean;
  protected readonly taskManager: TaskManager;

  constructor(name: string, loggedIn: boolean = false) {
    this.name = name;
    this.loggedIn = loggedIn;
    this.taskManager = new TaskManager();
  }

  abstract getRole(): string;

  login(): void {
    this.loggedIn = true;
  }

  logout(): void {
    this.loggedIn = false;
  }

  isLoggedIn(): boolean {
    return this.loggedIn;
  }

  addTask(task: TaskInput): void {
    if (!this.loggedIn) {
      throw new Error("User must be logged in to add tasks.");
    }
    this.taskManager.addTask(task);
  }

  getTasks(): ReadonlyArray<ITask> {
    return this.taskManager.getTasks();
  }

  getName(): string {
    return this.name;
  }
}

class RegularUser extends BaseUser {
  getRole(): string {
    return "Regular";
  }
}

class AdminUser extends BaseUser {
  getRole(): string {
    return "Admin";
  }

  // Admin-specific action
  getTaskById(id: string): Task | undefined {
    return this.taskManager.findTaskById(id);
  }
}

// Factory pattern: Creates user based on role
class UserFactory {
  static createUser(role: "admin" | "regular", name: string): BaseUser {
    switch (role) {
      case "admin":
        return new AdminUser(name, true);
      case "regular":
        return new RegularUser(name, true);
    }
  }
}

// Usage
const admin = UserFactory.createUser("admin", "Alice");
admin.addTask({ taskName: "Deploy API", priority: Priority.HIGH });

const regular = UserFactory.createUser("regular", "Bob");
regular.addTask({ taskName: "Write docs", priority: Priority.LOW });

console.log(`${admin.getName()} [${admin.getRole()}]:`, admin.getTasks());
console.log(`${regular.getName()} [${regular.getRole()}]:`, regular.getTasks());
