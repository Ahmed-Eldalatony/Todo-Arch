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

// Custom Error
class NotLoggedInError extends Error {
  constructor() {
    super("User must be logged in to perform this action.");
    this.name = "NotLoggedInError";
  }
}

// Task Class (Encapsulation + Factory Method)
class Task implements ITask {
  // More clear and Scalable
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

// ITaskManager Interface (Abstraction)
interface ITaskManager {
  addTask(task: TaskInput): void;
  getTasks(): ReadonlyArray<ITask>;
  findTaskById(id: string): ITask | undefined;
}

// TaskManager Class (Encapsulation + SRP)
class TaskManager implements ITaskManager {
  private tasks: Task[] = [];

  addTask(task: TaskInput): void {
    this.tasks.push(new Task(task));
  }

  getTasks(): ReadonlyArray<ITask> {
    return this.tasks;
  }

  findTaskById(id: string): ITask | undefined {
    return this.tasks.find(task => task.id === id);
  }
}

// Task Filter Strategy Interface
interface TaskFilterStrategy {
  filter(tasks: ReadonlyArray<ITask>): ITask[];
}

// Concrete Strategy: High Priority Filter
class HighPriorityFilter implements TaskFilterStrategy {
  filter(tasks: ReadonlyArray<ITask>): ITask[] {
    return tasks.filter(task => task.priority === Priority.HIGH);
  }
}

// IUser Interface (Interface Segregation)
interface IUser {
  getName(): string;
  getRole(): string;
  login(): void;
  logout(): void;
  isLoggedIn(): boolean;
  addTask(task: TaskInput): void;
  getTasks(): ReadonlyArray<ITask>;
  filterTasks(strategy: TaskFilterStrategy): ITask[];
}

// Abstract BaseUser Class (Template Method Pattern)
abstract class BaseUser implements IUser {
  protected readonly name: string;
  protected loggedIn: boolean;
  protected readonly taskManager: ITaskManager;

  constructor(name: string, taskManager: ITaskManager, loggedIn = false) {
    this.name = name;
    this.taskManager = taskManager;
    this.loggedIn = loggedIn;
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
    if (!this.loggedIn) throw new NotLoggedInError();
    this.taskManager.addTask(task);
  }

  getTasks(): ReadonlyArray<ITask> {
    return this.taskManager.getTasks();
  }

  filterTasks(strategy: TaskFilterStrategy): ITask[] {
    return strategy.filter(this.taskManager.getTasks());
  }

  getName(): string {
    return this.name;
  }
}

// RegularUser Class (Concrete Subclass)
class RegularUser extends BaseUser {
  getRole(): string {
    return "Regular";
  }
}

// AdminUser Class (Adds Specific Behavior)
class AdminUser extends BaseUser {
  getRole(): string {
    return "Admin";
  }

  getTaskById(id: string): ITask | undefined {
    return this.taskManager.findTaskById(id);
  }
}

// UserFactory Class (Factory Pattern)
class UserFactory {
  static createUser(role: "admin" | "regular", name: string): IUser {
    const taskManager = new TaskManager();

    switch (role) {
      case "admin":
        return new AdminUser(name, taskManager, true);
      case "regular":
        return new RegularUser(name, taskManager, true);
      default:
        throw new Error("Invalid role.");
    }
  }
}

// ---------- Usage Example ----------

const admin = UserFactory.createUser("admin", "Alice");
const regular = UserFactory.createUser("regular", "Bob");

admin.addTask({ taskName: "Deploy API", priority: Priority.HIGH });
admin.addTask({ taskName: "Review PRs", priority: Priority.LOW });

regular.addTask({ taskName: "Write docs", priority: Priority.LOW });
regular.addTask({ taskName: "Fix bugs", priority: Priority.HIGH });

console.log(`${admin.getName()} [${admin.getRole()}]:`, admin.getTasks());
console.log(`${regular.getName()} [${regular.getRole()}]:`, regular.getTasks());

// Using Strategy Pattern
const highPriorityOnly = new HighPriorityFilter();
console.log(`${regular.getName()}'s High Priority Tasks:`, regular.filterTasks(highPriorityOnly));

export { }; // Makes this file a module
