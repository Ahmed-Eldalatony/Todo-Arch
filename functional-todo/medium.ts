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

const generateId = (): string => Math.random().toString(36).substring(2, 10);
const formatDate = (): string => new Date().toISOString();

const createTask = ({ taskName, priority }: TaskInput): ITask => ({
  id: generateId(),
  taskName,
  priority,
  date: formatDate(),
});

// TaskManager as a pure function module
type TaskManager = ReadonlyArray<ITask>;

const addTask = (tasks: TaskManager, input: TaskInput): TaskManager => [
  ...tasks,
  createTask(input),
];

const findTaskById = (tasks: TaskManager, id: string): ITask | undefined =>
  tasks.find((task) => task.id === id);

// User management
type UserRole = "Admin" | "Regular";

interface User {
  readonly name: string;
  readonly role: UserRole;
  readonly loggedIn: boolean;
  readonly tasks: TaskManager;
}

const createUser = (name: string, role: UserRole): User => ({
  name,
  role,
  loggedIn: true,
  tasks: [],
});

const login = (user: User): User => ({ ...user, loggedIn: true });
const logout = (user: User): User => ({ ...user, loggedIn: false });

const addTaskToUser = (user: User, input: TaskInput): User => {
  if (!user.loggedIn) {
    throw new Error("User must be logged in to add tasks.");
  }
  return { ...user, tasks: addTask(user.tasks, input) };
};

const getUserTasks = (user: User): TaskManager => user.tasks;

const getTaskFromUserById = (user: User, id: string): ITask | undefined => {
  if (user.role !== "Admin") return undefined;
  return findTaskById(user.tasks, id);
};

let admin = createUser("Alice", "Admin");
admin = addTaskToUser(admin, { taskName: "Deploy API", priority: Priority.HIGH });

let regular = createUser("Bob", "Regular");
regular = addTaskToUser(regular, { taskName: "Write docs", priority: Priority.LOW });

console.log(`${admin.name} [${admin.role}]:`, getUserTasks(admin));
console.log(`${regular.name} [${regular.role}]:`, getUserTasks(regular));
