// --- Domain Layer ---

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
  readonly id: string;
  taskName: string;
  priority: Priority;
  date: string;

  // Static factory method to create a new Task instance
  static createNew({ taskName, priority }: TaskInput): Task {
    return new Task({ taskName, priority });
  }

  // Private constructor to enforce using the factory method
  private constructor({ taskName, priority }: TaskInput) {
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

// --- Repository Layer ---

// Interface for the Task Repository
interface ITaskRepository {
  addTask(task: ITask): Promise<void>; // Use ITask as the repository deals with domain objects
  getTasks(): Promise<ReadonlyArray<ITask>>;
  findTaskById(id: string): Promise<ITask | undefined>;
}

// In-memory implementation of the Task Repository
class InMemoryTaskRepository implements ITaskRepository {
  private tasks: ITask[] = []; // Store ITask objects

  async addTask(task: ITask): Promise<void> {
    this.tasks.push(task);
  }

  async getTasks(): Promise<ReadonlyArray<ITask>> {
    return this.tasks;
  }

  async findTaskById(id: string): Promise<ITask | undefined> {
    return this.tasks.find(task => task.id === id);
  }
}

// --- Service Layer ---

// Interface for the Task Service
interface ITaskService {
  createTask(taskInput: TaskInput): Promise<ITask>;
  getAllTasks(): Promise<ReadonlyArray<ITask>>;
  getTaskById(id: string): Promise<ITask | undefined>;
  getHighPriorityTasks(): Promise<ITask[]>; // Example of business logic method
}

// Implementation of the Task Service
class TaskService implements ITaskService {
  private taskRepository: ITaskRepository; // Depends on the Repository Interface

  // Dependency Injection: Repository is injected through the constructor
  constructor(taskRepository: ITaskRepository) {
    this.taskRepository = taskRepository;
  }

  async createTask(taskInput: TaskInput): Promise<ITask> {
    // Business logic: Create a new Task domain object
    const newTask = Task.createNew(taskInput);

    // Delegate persistence to the Repository
    await this.taskRepository.addTask(newTask);

    return newTask;
  }

  async getAllTasks(): Promise<ReadonlyArray<ITask>> {
    // Delegate data retrieval to the Repository
    return this.taskRepository.getTasks();
  }

  async getTaskById(id: string): Promise<ITask | undefined> {
    // Delegate data retrieval to the Repository
    return this.taskRepository.findTaskById(id);
  }

  async getHighPriorityTasks(): Promise<ITask[]> {
    console.log('[Service] Getting high priority tasks');
    // Business logic: Filter tasks
    const allTasks = await this.taskRepository.getTasks();
    return allTasks.filter(task => task.priority === Priority.HIGH);
  }
}

// --- Application / Presentation Layer (User Classes) ---

// Task Filter Strategy Interface (Remains the same - good separation)
interface TaskFilterStrategy {
  filter(tasks: ReadonlyArray<ITask>): ITask[];
}

// Concrete Strategy: High Priority Filter (Remains the same)
class HighPriorityFilter implements TaskFilterStrategy {
  filter(tasks: ReadonlyArray<ITask>): ITask[] {
    return tasks.filter(task => task.priority === Priority.HIGH);
  }
}


// IUser Interface (Adjusted to use the Service Layer)
interface IUser {
  getName(): string;
  getRole(): string;
  login(): void;
  logout(): void;
  isLoggedIn(): boolean;
  // Methods now interact with the Task Service
  addTask(taskInput: TaskInput): Promise<void>;
  getAllTasks(): Promise<ReadonlyArray<ITask>>;
  filterTasks(strategy: TaskFilterStrategy): Promise<ITask[]>; // filter on data from service
}

// Abstract BaseUser Class (Template Method Pattern - Adjusted to use the Service Layer)
abstract class BaseUser implements IUser {
  protected readonly name: string;
  protected loggedIn: boolean;
  protected readonly taskService: ITaskService; // Depends on the Service Interface

  // Dependency Injection: Service is injected through the constructor
  constructor(name: string, taskService: ITaskService, loggedIn = false) {
    this.name = name;
    this.taskService = taskService;
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

  async addTask(taskInput: TaskInput): Promise<void> {
    // Application logic: Check login status before calling service
    if (!this.loggedIn) throw new NotLoggedInError();
    console.log(`[User ${this.name}] Adding task via service`);
    await this.taskService.createTask(taskInput); // Delegate to the service
  }

  async getAllTasks(): Promise<ReadonlyArray<ITask>> {
    console.log(`[User ${this.name}] Getting all tasks via service`);
    return this.taskService.getAllTasks(); // Delegate to the service
  }

  async filterTasks(strategy: TaskFilterStrategy): Promise<ITask[]> {
    console.log(`[User ${this.name}] Filtering tasks via service data`);
    const allTasks = await this.taskService.getAllTasks(); // Get all tasks from service
    return strategy.filter(allTasks); // Apply filtering strategy
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

// AdminUser Class (Adds Specific Behavior, interacting with service)
class AdminUser extends BaseUser {
  getRole(): string {
    return "Admin";
  }

  // Admin-specific method using the service
  async getTaskById(id: string): Promise<ITask | undefined> {
    console.log(`[Admin User ${this.name}] Getting task by id via service`);
    return this.taskService.getTaskById(id);
  }
}

// UserFactory Class (Factory Pattern - Adjusted for DI)
class UserFactory {
  // The factory now takes the taskService dependency
  static createUser(role: "admin" | "regular", name: string, taskService: ITaskService): IUser {
    switch (role) {
      case "admin":
        // Inject the taskService into the AdminUser constructor
        return new AdminUser(name, taskService, true);
      case "regular":
        // Inject the taskService into the RegularUser constructor
        return new RegularUser(name, taskService, true);
      default:
        throw new Error("Invalid role.");
    }
  }
}

// ---------- Composition Root / Application Entry Point ----------
// This is where we create instances and wire up dependencies

async function main() {
  // 1. Create Repository Instance
  const taskRepository: ITaskRepository = new InMemoryTaskRepository();

  // 2. Create Service Instance and Inject Repository
  const taskService: ITaskService = new TaskService(taskRepository);

  // 3. Create User Instances using the Factory and Inject Service
  const admin = UserFactory.createUser("admin", "Alice", taskService);
  const regular = UserFactory.createUser("regular", "Bob", taskService);

  // ---------- Usage Example ----------

  console.log('--- Adding Tasks ---');
  await admin.addTask({ taskName: "Deploy API", priority: Priority.HIGH });
  await admin.addTask({ taskName: "Review PRs", priority: Priority.LOW });

  await regular.addTask({ taskName: "Write docs", priority: Priority.LOW });
  await regular.addTask({ taskName: "Fix bugs", priority: Priority.HIGH });

  console.log('\n--- Getting All Tasks ---');
  const adminTasks = await admin.getAllTasks();
  console.log(`${admin.getName()} [${admin.getRole()}]:`, adminTasks);

  const regularTasks = await regular.getAllTasks();
  console.log(`${regular.getName()} [${regular.getRole()}]:`, regularTasks);


  console.log('\n--- Using Strategy Pattern for Filtering ---');
  const highPriorityOnly = new HighPriorityFilter();
  const regularHighPriorityTasks = await regular.filterTasks(highPriorityOnly);
  console.log(`${regular.getName()}'s High Priority Tasks:`, regularHighPriorityTasks);

  console.log('\n--- Admin Getting Task by ID ---');
  // Find an ID from the created tasks to test getTaskById
  const taskIdToFind = adminTasks[0]?.id;
  if (taskIdToFind) {
    const foundTask = await (admin as AdminUser).getTaskById(taskIdToFind);
    console.log(`Task with ID ${taskIdToFind} found:`, foundTask);
  } else {
    console.log('No tasks available to find by ID.');
  }

  console.log('\n--- Attempting to Add Task While Logged Out (Error Handling) ---');
  regular.logout();
  try {
    await regular.addTask({ taskName: "Should Fail", priority: Priority.LOW });
  } catch (error: any) {
    console.error(`Caught expected error: ${error.name} - ${error.message}`);
  }
  regular.login(); // Log back in for completeness

}

main();

export { }; // Makes this file a module
