import { create } from 'zustand';
import {
  getProjects,
  createProject as apiCreateProject,
  getProjectDetail,
  createTask as apiCreateTask,
  updateTaskStatus as apiUpdateTaskStatus,
  deleteTask as apiDeleteTask,
  deleteProject as apiDeleteProject,
  Project,
  ProjectTask,
} from '../services/api';

interface CollabUser {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isOnline: boolean;
}

interface CollabStore {
  // 项目列表
  projects: Project[];
  loading: boolean;
  fetchProjects: () => Promise<void>;
  addProject: (name: string, description?: string) => Promise<Project>;
  removeProject: (id: number) => Promise<void>;

  // 当前项目详情
  currentProject: Project | null;
  currentTasks: ProjectTask[];
  fetchProjectDetail: (id: number) => Promise<void>;

  // 任务操作
  addTask: (projectId: number, data: { title: string; description?: string; priority?: string; dueDate?: string }) => Promise<ProjectTask>;
  changeTaskStatus: (taskId: number, status: string) => Promise<void>;
  removeTask: (taskId: number) => Promise<void>;

  // 在线用户（保留用于 UI 展示）
  onlineUsers: CollabUser[];
  setOnlineUsers: (users: CollabUser[]) => void;
}

export const useCollabStore = create<CollabStore>((set, get) => ({
  projects: [],
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const projects = await getProjects();
      set({ projects });
    } catch (err) {
      console.error('获取项目列表失败:', err);
    } finally {
      set({ loading: false });
    }
  },

  addProject: async (name, description) => {
    const project = await apiCreateProject({ name, description });
    set((state) => ({ projects: [project, ...state.projects] }));
    return project;
  },

  removeProject: async (id) => {
    await apiDeleteProject(id);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    }));
  },

  currentProject: null,
  currentTasks: [],

  fetchProjectDetail: async (id) => {
    try {
      const detail = await getProjectDetail(id);
      set({
        currentProject: detail.project,
        currentTasks: detail.tasks,
      });
    } catch (err) {
      console.error('获取项目详情失败:', err);
    }
  },

  addTask: async (projectId, data) => {
    const task = await apiCreateTask(projectId, data);
    set((state) => ({
      currentTasks: [task, ...state.currentTasks],
    }));
    return task;
  },

  changeTaskStatus: async (taskId, status) => {
    await apiUpdateTaskStatus(taskId, status);
    set((state) => ({
      currentTasks: state.currentTasks.map((t) =>
        t.id === taskId ? { ...t, status: status as ProjectTask['status'] } : t
      ),
    }));
  },

  removeTask: async (taskId) => {
    await apiDeleteTask(taskId);
    set((state) => ({
      currentTasks: state.currentTasks.filter((t) => t.id !== taskId),
    }));
  },

  onlineUsers: [
    { id: 'u1', name: '张三', avatar: '', color: '#1890ff', isOnline: true },
    { id: 'u2', name: '李四', avatar: '', color: '#52c41a', isOnline: true },
  ],
  setOnlineUsers: (users) => set({ onlineUsers: users }),
}));
