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

// Utility type to create task inputs, helps with abstraction and encapsulation
type TaskInput = Pick<ITask, "taskName" | "priority">;

// Encapsulation + Factory Method (for ID and date): Task is responsible for its own data
class Task implements ITask {
  readonly id: string = Task.generateId(); // Factory method to generate ID
  date: string = Task.formatDate();        // Factory method to format date

  constructor(
    public taskName: string,
    public priority: Priority
  ) { }

  // Static factory method pattern: hides ID generation logic
  private static generateId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  // Static utility method: not strictly a pattern but supports `SRP` (Single Responsibility Pattern)
  private static formatDate(): string {
    return new Date().toISOString();
  }
}

// Composition: TaskManager is composed inside user classes to manage tasks
class TaskManager {
  private tasks: Task[] = [];

  // SRP: Only manages adding and retrieving tasks
  addTask(input: TaskInput): void {
    this.tasks.push(new Task(input.taskName, input.priority));
  }

  getTasks(): ReadonlyArray<ITask> {
    return this.tasks;
  }

  findTaskById(id: string): Task | undefined {
    return this.tasks.find(task => task.id === id);
  }
}

// Abstraction + Template Method Pattern: BaseUser defines a template for user types
abstract class BaseUser {
  protected readonly name: string;
  protected loggedIn: boolean;
  protected readonly taskManager: TaskManager;

  constructor(name: string, loggedIn: boolean = false) {
    this.name = name;
    this.loggedIn = loggedIn;
    this.taskManager = new TaskManager(); // Composition over inheritance
  }

  // Template method: requires concrete class to implement getRole
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

  // Encapsulation + Guard clause: Prevents unauthorized actions
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

// Inheritance + Polymorphism: Subclasses define their roles
class RegularUser extends BaseUser {
  getRole(): string {
    return "Regular";
  }
}

class AdminUser extends BaseUser {
  getRole(): string {
    return "Admin";
  }

  // Admin-specific behavior: method not present in base class
  getTaskById(id: string): Task | undefined {
    return this.taskManager.findTaskById(id);
  }
}

// Factory Pattern: Decides which type of user to instantiate
class UserFactory {
  static createUser(role: "admin" | "regular", name: string): BaseUser {
    switch (role) {
      case "admin":
        return new AdminUser(name, true); // Polymorphic return
      case "regular":
        return new RegularUser(name, true);
    }
  }
}

// Usage example: Demonstrates Polymorphism in action
const admin = UserFactory.createUser("admin", "Alice");
admin.addTask({ taskName: "Deploy API", priority: Priority.HIGH });

const regular = UserFactory.createUser("regular", "Bob");
regular.addTask({ taskName: "Write docs", priority: Priority.LOW });

console.log(`${admin.getName()} [${admin.getRole()}]:`, admin.getTasks());
console.log(`${regular.getName()} [${regular.getRole()}]:`, regular.getTasks());

export { }; // Makes this file a module
