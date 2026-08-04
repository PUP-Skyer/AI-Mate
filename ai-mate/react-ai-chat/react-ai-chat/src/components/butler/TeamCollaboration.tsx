/**
 * 管家AI - 团队协作面板
 */

import React from 'react';
import { Card, Avatar, List, Tag, Typography, Button, Space } from 'antd';
import { UserOutlined, MailOutlined, MessageOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const TeamCollaboration: React.FC = () => {
  const members = [
    { name: '张三', role: '产品经理', status: 'online', tasks: 5 },
    { name: '李四', role: '前端开发', status: 'busy', tasks: 3 },
    { name: '王五', role: '后端开发', status: 'online', tasks: 4 },
    { name: '赵六', role: 'UI设计师', status: 'offline', tasks: 2 },
  ];

  const meetings = [
    { title: '周会', time: '每周一 10:00', type: 'routine' },
    { title: '产品评审', time: '每周三 14:00', type: 'important' },
    { title: '技术分享', time: '每周五 16:00', type: 'routine' },
  ];

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <Card title="团队成员" style={{ flex: 1 }}>
        <List
          dataSource={members}
          renderItem={(member) => (
            <List.Item
              actions={[
                <Button size="small" icon={<MessageOutlined />}>沟通</Button>,
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={
                  <Space>
                    <Text strong>{member.name}</Text>
                    <Tag color={member.status === 'online' ? 'green' : member.status === 'busy' ? 'orange' : 'default'}>
                      {member.status === 'online' ? '在线' : member.status === 'busy' ? '忙碌' : '离线'}
                    </Tag>
                  </Space>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary">{member.role}</Text>
                    <Text type="secondary">进行中任务: {member.tasks} 项</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Card title="团队会议" style={{ flex: 1 }}>
        <List
          dataSource={meetings}
          renderItem={(meeting) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{meeting.title}</Text>
                    <Tag color={meeting.type === 'important' ? 'red' : 'blue'}>
                      {meeting.type === 'important' ? '重要' : '常规'}
                    </Tag>
                  </Space>
                }
                description={<Text type="secondary">{meeting.time}</Text>}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default TeamCollaboration;
