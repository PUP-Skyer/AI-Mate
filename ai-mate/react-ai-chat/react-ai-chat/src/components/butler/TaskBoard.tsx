/**
 * 管家AI - 任务看板面板
 */

import React, { useState } from 'react';
import { Card, Button, Input, Form, List, Tag, Space, Typography } from 'antd';
import { PlusOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  priority: 'high' | 'medium' | 'low';
}

const TaskBoard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: '完成产品原型设计', status: 'doing', priority: 'high' },
    { id: '2', title: '撰写商业计划书', status: 'todo', priority: 'high' },
    { id: '3', title: '搭建落地页', status: 'done', priority: 'medium' },
  ]);
  const [newTask, setNewTask] = useState('');

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), title: newTask, status: 'todo', priority: 'medium' }]);
    setNewTask('');
  };

  const moveTask = (id: string, status: Task['status']) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const columns: { status: Task['status']; title: string; color: string }[] = [
    { status: 'todo', title: '待办', color: '#ff4d4f' },
    { status: 'doing', title: '进行中', color: '#faad14' },
    { status: 'done', title: '已完成', color: '#52c41a' },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="输入新任务..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onPressEnter={addTask}
          style={{ width: 300 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={addTask}>
          添加任务
        </Button>
      </Space>

      <div style={{ display: 'flex', gap: 16 }}>
        {columns.map((col) => (
          <Card
            key={col.status}
            title={<Text strong style={{ color: col.color }}>{col.title}</Text>}
            style={{ flex: 1, minWidth: 200 }}
            bodyStyle={{ padding: 12 }}
          >
            <List
              dataSource={tasks.filter((t) => t.status === col.status)}
              renderItem={(task) => (
                <List.Item
                  style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}
                  actions={[
                    col.status !== 'done' && (
                      <Button
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={() => moveTask(task.id, col.status === 'todo' ? 'doing' : 'done')}
                      >
                        {col.status === 'todo' ? '开始' : '完成'}
                      </Button>
                    ),
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={() => deleteTask(task.id)} />,
                  ].filter(Boolean)}
                >
                  <div>
                    <Text>{task.title}</Text>
                    <br />
                    <Tag color={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'orange' : 'green'}>
                      {task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低'}优先级
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TaskBoard;
