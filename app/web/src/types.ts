// Shapes of the API's JSON, as the web app uses them.
export type Priority = 'low' | 'medium' | 'high';
export type StatusFilter = 'all' | 'active' | 'done';

export interface User {
  id: string;
  username: string;
  name: string;
}

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  dueDate: string | null;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewTask {
  title: string;
  priority: Priority;
  dueDate: string | null;
}
