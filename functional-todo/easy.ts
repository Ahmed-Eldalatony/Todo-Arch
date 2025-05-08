enum Priority {
  HIGH = "HIGH",
  LOW = "LOW",
}

interface ITask {
  taskName: string;
  priority: Priority;
  date: string;
}

interface IUser {
  name: string;
  tasks: ITask[];
  loggedIn: boolean;
}

type TaskInput = Pick<ITask, "taskName" | "priority">;

const createTask = ({ taskName, priority }: TaskInput): ITask => ({
  taskName,
  priority,
  date: new Date().toISOString(),
});

const addTask = (taskInput: TaskInput, user: IUser): IUser => {
  if (!user.loggedIn) return user;

  const newTask = createTask(taskInput);
  return {
    ...user,
    tasks: [...user.tasks, newTask],
  };
};

// Example usage
const user1: IUser = {
  name: "hamada",
  loggedIn: true,
  tasks: [],
};

const updatedUser1 = addTask({ taskName: "Task1", priority: Priority.HIGH }, user1);

console.log(updatedUser1);

export { }; // Makes this file a module
