/**
 * 在线用户指示器组件
 */

import React from 'react';
import { Avatar, Tooltip, Badge } from 'antd';

interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isOnline: boolean;
}

interface UserPresenceProps {
  users: User[];
}

const UserPresence: React.FC<UserPresenceProps> = ({ users }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span style={{ marginRight: 8, fontSize: 13, color: '#666' }}>在线：</span>
      <Avatar.Group maxCount={5} size="small">
        {users
          .filter((u) => u.isOnline)
          .map((user) => (
            <Tooltip key={user.id} title={user.name}>
              <Badge status="success" offset={[-4, 20]}>
                <Avatar
                  size="small"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name[0]}
                </Avatar>
              </Badge>
            </Tooltip>
          ))}
      </Avatar.Group>
    </div>
  );
};

export default UserPresence;
