const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('ai-mate-token');
}

async function request<T = any>(
  method: string,
  path: string,
  body?: any
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: '请求失败' }));
    throw new Error(errorData.message || `请求失败: ${res.status}`);
  }

  const data = await res.json();
  return data.data ?? data;
}

export interface Project {
  id: number;
  userId: number;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTask {
  id: number;
  projectId: number;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetail {
  project: Project;
  tasks: ProjectTask[];
}

/**
 * 获取项目列表
 */
export async function getProjects(): Promise<Project[]> {
  return request<Project[]>('GET', '/projects');
}

/**
 * 创建项目
 */
export async function createProject(data: {
  name: string;
  description?: string;
}): Promise<Project> {
  return request<Project>('POST', '/projects', data);
}

/**
 * 获取项目详情（含任务列表）
 */
export async function getProjectDetail(id: number): Promise<ProjectDetail> {
  return request<ProjectDetail>('GET', `/projects/${id}`);
}

/**
 * 更新项目
 */
export async function updateProject(
  id: number,
  data: { name?: string; description?: string; status?: string }
): Promise<Project> {
  return request<Project>('PUT', `/projects/${id}`, data);
}

/**
 * 删除项目
 */
export async function deleteProject(id: number): Promise<void> {
  return request<void>('DELETE', `/projects/${id}`);
}

/**
 * 创建任务
 */
export async function createTask(
  projectId: number,
  data: {
    title: string;
    description?: string;
    priority?: string;
    dueDate?: string;
  }
): Promise<ProjectTask> {
  return request<ProjectTask>('POST', `/projects/${projectId}/tasks`, data);
}

/**
 * 更新任务状态
 */
export async function updateTaskStatus(
  taskId: number,
  status: string
): Promise<ProjectTask> {
  return request<ProjectTask>('PUT', `/projects/tasks/${taskId}/status`, { status });
}

/**
 * 删除任务
 */
export async function deleteTask(taskId: number): Promise<void> {
  return request<void>('DELETE', `/projects/tasks/${taskId}`);
}
