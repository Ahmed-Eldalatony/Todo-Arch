enum Priority {
  HIGH = "HIGH",
  LOW = "LOW",
}

interface ITask {
  taskName: string;
  priority: Priority;
  date: string;
}

type TaskInput = Pick<ITask, "taskName" | "priority">;

class Task implements ITask {
  taskName: string;
  priority: Priority;
  date: string;

  constructor({ taskName, priority }: TaskInput) {
    this.taskName = taskName;
    this.priority = priority;
    this.date = new Date().toISOString(); // ISO standard timestamp
  }
}

class User {
  private name: string;
  private tasks: Task[];
  private loggedIn: boolean;

  constructor(name: string, loggedIn = false) {
    this.name = name;
    this.tasks = [];
    this.loggedIn = loggedIn;
  }

  login() {
    this.loggedIn = true;
  }

  logout() {
    this.loggedIn = false;
  }

  getTasks(): ITask[] {
    return [...this.tasks]; // return a copy to preserve encapsulation
  }

  addTask(taskInput: TaskInput): void {
    if (!this.loggedIn) return;
    const task = new Task(taskInput);
    this.tasks.push(task);
  }

  getName(): string {
    return this.name;
  }

  isLoggedIn(): boolean {
    return this.loggedIn;
  }
}

// ✅ Usage
const user1 = new User("hamada", true);
user1.addTask({ taskName: "Task1", priority: Priority.HIGH });

console.log(user1.getTasks());
