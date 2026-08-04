import React, { useState, useEffect } from 'react';
import {
  Card,
  Avatar,
  Button,
  Badge,
  Tag,
  Progress,
  Modal,
  Tabs,
  List,
  Switch,
  Row,
  Col,
  Spin,
  App,
} from 'antd';
import {
  UserOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
  MoonOutlined,
  GiftOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  StarOutlined,
  TrophyOutlined,
  FireOutlined,
  CrownOutlined,
  MedicineBoxOutlined,
  DashboardOutlined,
  FileTextOutlined,
  DeleteOutlined,
  BookOutlined,
} from '@ant-design/icons';
import {
  fetchUserProfile,
  fetchSignInRecords,
  signIn as signInAPI,
  fetchDeskPets,
  addDeskPet,
  fetchSettings,
  updateSettings,
} from '../services/userService';
import { useTheme } from '../contexts/ThemeContext';
import { getReports, deleteReport, getReportTypeLabel, getReportTypeColor } from '../utils/reportStorage';
import type { SavedReport } from '../utils/reportStorage';

interface DeskPet {
  id: number;
  pet_id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  image: string;
  description: string;
  obtained_at: string;
}

interface SignInRecord {
  date: string;
  signed: boolean;
}

const RARITY_CONFIG = {
  common: { label: '普通', color: '#8c8c8c', bg: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)', border: '#d9d9d9', glow: '0 4px 12px rgba(140,140,140,0.15)' },
  rare: { label: '稀有', color: '#1890ff', bg: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)', border: '#69c0ff', glow: '0 4px 16px rgba(24,144,255,0.25)' },
  epic: { label: '史诗', color: '#722ed1', bg: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)', border: '#b37feb', glow: '0 4px 16px rgba(114,46,209,0.25)' },
  legendary: { label: '传说', color: '#fa8c16', bg: 'linear-gradient(135deg, #fff7e6 0%, #ffe7ba 100%)', border: '#ffc53d', glow: '0 4px 20px rgba(250,140,22,0.35)' },
};

const DESK_PETS_POOL: Omit<DeskPet, 'id' | 'obtained_at'>[] = [
  { pet_id: 'pet-1', name: '小智猫', rarity: 'common', image: '🐱', description: '聪明伶俐的小猫咪，喜欢趴在键盘上' },
  { pet_id: 'pet-2', name: '代码犬', rarity: 'common', image: '🐶', description: '忠诚的编程伙伴，会帮你找bug' },
  { pet_id: 'pet-3', name: '数据兔', rarity: 'common', image: '🐰', description: '跳来跳去的小兔子，对数据很敏感' },
  { pet_id: 'pet-4', name: '云端鸟', rarity: 'rare', image: '🐦', description: '在云端翱翔的小鸟，带来好灵感' },
  { pet_id: 'pet-5', name: '芯片鼠', rarity: 'rare', image: '🐹', description: '藏在电路板里的小家伙，跑得飞快' },
  { pet_id: 'pet-6', name: '算法狐', rarity: 'epic', image: '🦊', description: '狡猾又聪明的狐狸，精通各种算法' },
  { pet_id: 'pet-7', name: '网络龙', rarity: 'epic', image: '🐉', description: '守护网络安全的神龙，威风凛凛' },
  { pet_id: 'pet-8', name: 'AI凤凰', rarity: 'legendary', image: '🦅', description: '传说中的AI之凰，拥有无限智慧' },
];

const WEEK_DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const ProfilePageContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({ username: 'AI 创业者', level: 1, exp: 0 });
  const [signInDays, setSignInDays] = useState(0);
  const [signInRecords, setSignInRecords] = useState<SignInRecord[]>([]);
  const [deskPets, setDeskPets] = useState<DeskPet[]>([]);
  const [blindBoxOpen, setBlindBoxOpen] = useState(false);
  const [blindBoxResult, setBlindBoxResult] = useState<DeskPet | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const { isDarkMode, setIsDarkMode } = useTheme();
  const { message } = App.useApp();
  type SettingKey = 'dark_mode' | 'notifications' | 'auto_save' | 'sound_effects';

  const [settings, setSettings] = useState<Record<SettingKey, boolean>>({
    dark_mode: isDarkMode,
    notifications: true,
    auto_save: true,
    sound_effects: true,
  });
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);

  // 加载所有数据
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [profile, signInData, petsData, settingsData] = await Promise.all([
        fetchUserProfile().catch(() => ({ username: 'AI 创业者', level: 1, exp: 0 })),
        fetchSignInRecords().catch(() => ({ records: [], consecutiveDays: 0 })),
        fetchDeskPets().catch(() => [] as DeskPet[]),
        fetchSettings().catch(() => ({
          dark_mode: false,
          notifications: true,
          auto_save: true,
          sound_effects: true,
        })),
      ]);

      setUserProfile(profile as { username: string; level: number; exp: number });
      setSignInRecords(signInData.records);
      setSignInDays(signInData.consecutiveDays);
      setDeskPets(petsData as DeskPet[]);
      setSettings(settingsData as Record<SettingKey, boolean>);

      // 加载本地保存的报告
      setSavedReports(getReports());
    } catch (err) {
      console.error('加载数据失败:', err);
      message.error('加载数据失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySigned = signInRecords.find(r => r.date === todayStr)?.signed || false;

  const handleSignIn = async () => {
    if (todaySigned) {
      message.warning('今天已经签到过了哦！');
      return;
    }

    try {
      await signInAPI();
      message.success('签到成功！');

      // 重新加载签到数据
      const signInData = await fetchSignInRecords();
      setSignInRecords(signInData.records);
      setSignInDays(signInData.consecutiveDays);

      // 重新加载用户资料（更新经验值）
      const profile = await fetchUserProfile();
      setUserProfile(profile as { username: string; level: number; exp: number });

      // 检查是否满7天
      const newConsecutiveDays = signInData.consecutiveDays;
      if (newConsecutiveDays >= 7 && newConsecutiveDays % 7 === 0) {
        setTimeout(() => {
          setBlindBoxOpen(true);
        }, 800);
      }
    } catch (err: any) {
      message.error(err.message || '签到失败');
    }
  };

  const openBlindBox = async () => {
    setIsShaking(true);
    setTimeout(async () => {
      setIsShaking(false);
      const weights = DESK_PETS_POOL.map(p => {
        switch (p.rarity) {
          case 'legendary': return 5;
          case 'epic': return 15;
          case 'rare': return 30;
          default: return 50;
        }
      });
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let random = Math.random() * totalWeight;
      let selectedIndex = 0;
      for (let i = 0; i < weights.length; i++) {
        random -= weights[i];
        if (random <= 0) {
          selectedIndex = i;
          break;
        }
      }

      const selectedPet = DESK_PETS_POOL[selectedIndex];

      try {
        await addDeskPet(selectedPet);
        message.success(`获得新桌宠：${selectedPet.name}！`);

        // 重新加载桌宠列表
        const petsData = await fetchDeskPets();
        setDeskPets(petsData as DeskPet[]);

        // 重新加载用户资料
        const profile = await fetchUserProfile();
        setUserProfile(profile as { username: string; level: number; exp: number });

        setBlindBoxResult({ ...selectedPet, id: Date.now(), obtained_at: new Date().toISOString() });
      } catch (err: any) {
        message.error(err.message || '保存桌宠失败');
      }
    }, 1500);
  };

  const closeBlindBox = () => {
    setBlindBoxOpen(false);
    setTimeout(() => setBlindBoxResult(null), 300);
  };

  const handleSettingChange = async (key: SettingKey, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // 如果是深色模式设置，同步更新全局主题
    if (key === 'dark_mode') {
      setIsDarkMode(value);
    }

    try {
      await updateSettings(newSettings);
      message.success('设置已保存');
    } catch (err: any) {
      message.error(err.message || '保存设置失败');
      // 回滚到之前的状态
      setSettings(prev => ({ ...prev, [key]: !value }));
      if (key === 'dark_mode') {
        setIsDarkMode(!value);
      }
    }
  };

  const level = userProfile.level || Math.floor(signInDays / 7) + 1;
  const exp = userProfile.exp || 0;
  const levelProgress = ((signInDays % 7) / 7) * 100;
  const nextLevelDays = 7 - (signInDays % 7);

  // 个人资料头部卡片
  const ProfileHeader = () => (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: 16,
      padding: '32px',
      color: '#fff',
      marginBottom: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: -50,
        right: -50,
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 150,
        height: 150,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative', zIndex: 1 }}>
        <Badge
          count={<CrownOutlined style={{ color: '#faad14', fontSize: 16 }} />}
          offset={[-5, 5]}
          style={{ background: 'transparent' }}
        >
          <Avatar
            size={90}
            icon={<UserOutlined />}
            style={{
              background: 'rgba(255,255,255,0.25)',
              border: '3px solid rgba(255,255,255,0.4)',
              fontSize: 40,
            }}
          />
        </Badge>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 8px', color: '#fff', fontSize: 24, fontWeight: 600 }}>
            {userProfile.username}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Tag style={{
              background: 'rgba(255,255,255,0.2)',
              borderColor: 'rgba(255,255,255,0.3)',
              color: '#fff',
              fontSize: 13,
            }}>
              <TrophyOutlined style={{ marginRight: 4 }} />
              Lv.{level}
            </Tag>
            <span style={{ fontSize: 13, opacity: 0.85 }}>
              {nextLevelDays === 7 ? '已满级' : `再签到 ${nextLevelDays} 天升级`}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Progress
              percent={levelProgress}
              showInfo={false}
              strokeColor="#ffd666"
              railColor="rgba(255,255,255,0.2)"
              style={{ flex: 1, maxWidth: 200 }}
              size="small"
            />
            <span style={{ fontSize: 12, opacity: 0.8 }}>{Math.round(levelProgress)}%</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
            经验值: {exp}
          </div>
        </div>
      </div>
    </div>
  );

  // 统计卡片
  const StatCards = () => (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col span={8}>
        <Card
          style={{
            borderRadius: 12,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #fff7e6 0%, #fff1b8 100%)',
            border: '1px solid #ffd591',
          }}
          styles={{ body: { padding: '20px 12px' } }}
        >
          <FireOutlined style={{ fontSize: 28, color: '#fa8c16', marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#d46b08', lineHeight: 1.2 }}>{signInDays}</div>
          <div style={{ fontSize: 13, color: '#ad6800', marginTop: 4 }}>连续签到(天)</div>
        </Card>
      </Col>
      <Col span={8}>
        <Card
          style={{
            borderRadius: 12,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
            border: '1px solid #91d5ff',
          }}
          styles={{ body: { padding: '20px 12px' } }}
        >
          <StarOutlined style={{ fontSize: 28, color: '#1890ff', marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#096dd9', lineHeight: 1.2 }}>{deskPets.length}</div>
          <div style={{ fontSize: 13, color: '#0050b3', marginTop: 4 }}>桌宠收集(只)</div>
        </Card>
      </Col>
      <Col span={8}>
        <Card
          style={{
            borderRadius: 12,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
            border: '1px solid #b7eb8f',
          }}
          styles={{ body: { padding: '20px 12px' } }}
        >
          <TrophyOutlined style={{ fontSize: 28, color: '#52c41a', marginBottom: 8 }} />
          <div style={{ fontSize: 28, fontWeight: 'bold', color: '#389e0d', lineHeight: 1.2 }}>
            {exp}
          </div>
          <div style={{ fontSize: 13, color: '#237804', marginTop: 4 }}>经验值</div>
        </Card>
      </Col>
    </Row>
  );

  // 签到日历
  const SignInCalendar = () => (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        {WEEK_DAYS.map((day, index) => {
          const record = signInRecords[index];
          const isToday = record?.date === todayStr;
          return (
            <div
              key={day}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 14,
                background: record?.signed
                  ? 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)'
                  : isToday
                    ? 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)'
                    : '#f5f5f5',
                color: record?.signed || isToday ? '#fff' : '#bfbfbf',
                fontSize: 18,
                fontWeight: 'bold',
                boxShadow: record?.signed
                  ? '0 4px 12px rgba(82,196,26,0.3)'
                  : isToday
                    ? '0 4px 12px rgba(250,140,22,0.3)'
                    : 'none',
                transition: 'all 0.3s ease',
                border: isToday && !record?.signed ? '2px dashed #fa8c16' : '2px solid transparent',
              }}>
                {record?.signed ? <CheckCircleOutlined /> : day.slice(1)}
              </div>
              <span style={{
                fontSize: 11,
                color: isToday ? '#fa8c16' : '#999',
                fontWeight: isToday ? 600 : 400,
              }}>
                {day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  // 个人资料内容（学生端）
  const profileContent = (
    <div>
      <ProfileHeader />
      <StatCards />
    </div>
  );

  // 签到内容
  const signInContent = (
    <div>
      <Card
        style={{
          borderRadius: 16,
          marginBottom: 20,
          background: 'linear-gradient(135deg, #fff 0%, #f6ffed 100%)',
          border: '1px solid #d9f7be',
          overflow: 'hidden',
          position: 'relative',
        }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{
          background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
          padding: '24px 24px 40px',
          color: '#fff',
          textAlign: 'center',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            bottom: -1,
            left: 0,
            right: 0,
            height: 30,
            background: '#fff',
            borderRadius: '30px 30px 0 0',
          }} />
          <div style={{ fontSize: 56, marginBottom: 12, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}>
            {todaySigned ? '🎉' : '🌅'}
          </div>
          <h3 style={{ margin: '0 0 8px', color: '#fff', fontSize: 22 }}>
            {todaySigned ? '今日已签到' : '今日未签到'}
          </h3>
          <p style={{ margin: 0, opacity: 0.9, fontSize: 14 }}>
            {todaySigned
              ? '明天记得再来哦，连续7天有盲盒奖励！'
              : '点击签到，积累连续天数解锁盲盒！'}
          </p>
        </div>
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Button
            type="primary"
            size="large"
            icon={todaySigned ? <CheckCircleOutlined /> : <CalendarOutlined />}
            onClick={handleSignIn}
            disabled={todaySigned}
            style={{
              borderRadius: 28,
              padding: '0 48px',
              height: 52,
              fontSize: 17,
              fontWeight: 600,
              background: todaySigned ? '#52c41a' : 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
              border: 'none',
              boxShadow: todaySigned ? '0 4px 12px rgba(82,196,26,0.3)' : '0 4px 16px rgba(250,140,22,0.35)',
            }}
          >
            {todaySigned ? '已签到' : '立即签到'}
          </Button>
          <div style={{ marginTop: 16 }}>
            <Tag color="orange" icon={<FireOutlined />} style={{ fontSize: 13, padding: '4px 12px' }}>
              连续签到 {signInDays} 天
            </Tag>
          </div>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          <SignInCalendar />
        </div>
      </Card>

      <Card
        style={{
          borderRadius: 16,
          background: 'linear-gradient(135deg, #fff 0%, #fff7e6 100%)',
          border: '1px solid #ffe7ba',
          overflow: 'hidden',
        }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ffd666 0%, #fa8c16 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 52,
            boxShadow: '0 8px 24px rgba(250,140,22,0.3)',
          }}>
            🎁
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 20, color: '#d46b08' }}>连续签到7天解锁盲盒</h3>
          <p style={{ color: 'var(--text-muted)', margin: '0 0 20px', fontSize: 14 }}>
            盲盒中包含稀有桌宠卡片，收集它们来装饰你的桌面吧！
          </p>
          <div style={{
            background: '#fff7e6',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <GiftOutlined style={{ color: '#fa8c16', fontSize: 18 }} />
              <span style={{ fontSize: 14, color: '#ad6800', fontWeight: 500 }}>盲盒进度</span>
              <span style={{ marginLeft: 'auto', fontSize: 14, color: '#d46b08', fontWeight: 600 }}>
                {signInDays % 7}/7 天
              </span>
            </div>
            <Progress
              percent={Math.min((signInDays % 7) / 7 * 100, 100)}
              showInfo={false}
              strokeColor={{ from: '#fa8c16', to: '#ffd666' }}
              railColor="#fff1b8"
              size={10}
              style={{ margin: 0 }}
            />
          </div>
          <Button
            type="primary"
            size="large"
            icon={<GiftOutlined />}
            disabled={signInDays % 7 !== 0 || signInDays === 0}
            onClick={() => setBlindBoxOpen(true)}
            style={{
              borderRadius: 28,
              padding: '0 48px',
              height: 48,
              fontSize: 16,
              fontWeight: 600,
              background: signInDays % 7 === 0 && signInDays > 0
                ? 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)'
                : undefined,
              border: 'none',
              boxShadow: signInDays % 7 === 0 && signInDays > 0
                ? '0 4px 16px rgba(250,140,22,0.35)'
                : 'none',
            }}
          >
            {signInDays % 7 === 0 && signInDays > 0 ? '开启盲盒' : `还差 ${7 - (signInDays % 7)} 天`}
          </Button>
        </div>
      </Card>
    </div>
  );

  // 桌宠收藏内容
  const petsContent = (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
        borderRadius: 16,
        padding: '24px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h3 style={{ margin: '0 0 4px', color: '#096dd9', fontSize: 20 }}>桌宠收藏</h3>
          <p style={{ margin: 0, color: '#1890ff', fontSize: 14 }}>
            已收集 {deskPets.length}/8 只桌宠
          </p>
        </div>
        <div style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
        }}>
          🐾
        </div>
      </div>

      {deskPets.length === 0 ? (
        <Card style={{ borderRadius: 16, textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🐾</div>
          <h3 style={{ margin: '0 0 8px', color: 'var(--text-muted)' }}>还没有桌宠哦</h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>快去签到解锁盲盒吧！</p>
        </Card>
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
          dataSource={deskPets}
          renderItem={(pet) => (
            <List.Item>
              <Card
                hoverable
                style={{
                  borderRadius: 16,
                  textAlign: 'center',
                  background: RARITY_CONFIG[pet.rarity].bg,
                  border: `2px solid ${RARITY_CONFIG[pet.rarity].border}`,
                  boxShadow: RARITY_CONFIG[pet.rarity].glow,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                }}
                styles={{ body: { padding: '20px 16px' } }}
              >
                <div style={{
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  fontSize: 36,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}>
                  {pet.image}
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600 }}>{pet.name}</h4>
                <Tag
                  color={RARITY_CONFIG[pet.rarity].color}
                  style={{
                    borderRadius: 10,
                    fontSize: 12,
                    padding: '2px 10px',
                    marginBottom: 8,
                  }}
                >
                  {RARITY_CONFIG[pet.rarity].label}
                </Tag>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{pet.description}</p>
                <div style={{
                  marginTop: 10,
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                }}>
                  获得于 {new Date(pet.obtained_at).toLocaleDateString()}
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );

  // 报告收藏内容
  const reportsContent = (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
        borderRadius: 16,
        padding: '24px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h3 style={{ margin: '0 0 4px', color: '#7c3aed', fontSize: 20 }}>报告收藏</h3>
          <p style={{ margin: 0, color: '#8b5cf6', fontSize: 14 }}>
            已保存 {savedReports.length} 份军师AI报告
          </p>
        </div>
        <div style={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #a855f7 0%, #d946ef 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          color: '#fff',
          boxShadow: '0 4px 16px rgba(168, 85, 247, 0.3)',
        }}>
          <BookOutlined />
        </div>
      </div>

      {savedReports.length === 0 ? (
        <Card style={{ borderRadius: 16, textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
          <h3 style={{ margin: '0 0 8px', color: 'var(--text-muted)' }}>还没有保存的报告</h3>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>去军师AI生成报告并保存，这里会显示你的收藏</p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {savedReports.map((report) => (
            <Card
              key={report.id}
              hoverable
              style={{
                borderRadius: 16,
                border: '1px solid #f0f0f0',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
              }}
              styles={{ body: { padding: 0 } }}
            >
              <div style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: getReportTypeColor(report.type) + '15',
                      border: `1px solid ${getReportTypeColor(report.type)}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: getReportTypeColor(report.type),
                      fontSize: 18,
                    }}>
                      <FileTextOutlined />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>{report.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {getReportTypeLabel(report.type)} · {report.createdAt}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      deleteReport(report.id);
                      setSavedReports(getReports());
                      message.success('报告已删除');
                    }}
                  >
                    删除
                  </Button>
                </div>
                <div style={{
                  background: '#fafafa',
                  borderRadius: 12,
                  padding: '16px 20px',
                  maxHeight: 200,
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <pre style={{
                    margin: 0,
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'inherit',
                  }}>
                    {report.content.slice(0, 300)}{report.content.length > 300 ? '...' : ''}
                  </pre>
                  {report.content.length > 300 && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 60,
                      background: 'linear-gradient(transparent, #fafafa)',
                    }} />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // 设置内容
  const settingsContent = (
    <div>
      <Card
        style={{
          borderRadius: 16,
          marginBottom: 20,
          background: isDarkMode ? '#161b22' : 'linear-gradient(135deg, #fff 0%, #f0f5ff 100%)',
          border: isDarkMode ? '1px solid #30363d' : '1px solid #d6e4ff',
        }}
        title={
          <span style={{ fontSize: 16, fontWeight: 600, color: isDarkMode ? '#c9d1d9' : '#1d39c4' }}>
            <DashboardOutlined style={{ marginRight: 8 }} />
            通用设置
          </span>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {(
            [
              {
                icon: <MoonOutlined />,
                bg: '#722ed1',
                title: '深色模式',
                desc: '切换应用的深色主题',
                key: 'dark_mode' as SettingKey,
              },
              {
                icon: <BellOutlined />,
                bg: '#fa8c16',
                title: '消息通知',
                desc: '接收系统消息和提醒',
                key: 'notifications' as SettingKey,
              },
              {
                icon: <SafetyCertificateOutlined />,
                bg: '#52c41a',
                title: '自动保存',
                desc: '自动保存对话记录',
                key: 'auto_save' as SettingKey,
              },
              {
                icon: <StarOutlined />,
                bg: '#1890ff',
                title: '音效',
                desc: '开启操作音效反馈',
                key: 'sound_effects' as SettingKey,
              },
            ] as { icon: React.ReactNode; bg: string; title: string; desc: string; key: SettingKey }[]
          ).map((item) => (
            <div
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                borderRadius: 12,
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDarkMode ? '#21262d' : '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: item.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 18,
                marginRight: 16,
              }}>
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: isDarkMode ? '#c9d1d9' : '#333' }}>{item.title}</div>
                <div style={{ fontSize: 13, color: isDarkMode ? '#8b949e' : '#999', marginTop: 2 }}>{item.desc}</div>
              </div>
              <Switch
                checked={settings[item.key]}
                onChange={(checked) => handleSettingChange(item.key, checked)}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card
        style={{
          borderRadius: 16,
          background: isDarkMode ? '#161b22' : 'linear-gradient(135deg, #fff 0%, #fff2f0 100%)',
          border: isDarkMode ? '1px solid #30363d' : '1px solid #ffccc7',
        }}
        title={
          <span style={{ fontSize: 16, fontWeight: 600, color: isDarkMode ? '#c9d1d9' : '#cf1322' }}>
            <MedicineBoxOutlined style={{ marginRight: 8 }} />
            账号安全
          </span>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { title: '登录密码', desc: '建议定期更换密码以保护账号安全', action: '修改', danger: false },
            { title: '手机绑定', desc: '绑定手机以提升账号安全性', action: '绑定', danger: false },
            { title: '注销账号', desc: '注销后数据将无法恢复，请谨慎操作', action: '注销', danger: true },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                borderRadius: 12,
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDarkMode ? '#21262d' : '#f5f5f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: item.danger ? '#cf1322' : (isDarkMode ? '#c9d1d9' : '#333') }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 13, color: isDarkMode ? '#8b949e' : '#999', marginTop: 2 }}>{item.desc}</div>
              </div>
              <Button
                type="link"
                danger={item.danger}
                style={{ fontWeight: 500 }}
              >
                {item.action}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  // 获取当前用户角色
  const getUserRole = (): string => {
    const params = new URLSearchParams(window.location.search);
    return params.get('role') || 'student';
  };

  const userRole = getUserRole();
  // 学生端显示签到和桌宠，其他端不显示
  const showSignInAndPets = userRole === 'student';

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined style={{ marginRight: 6 }} />
          个人资料
        </span>
      ),
      children: profileContent,
    },
    ...(showSignInAndPets ? [
      {
        key: 'signin',
        label: (
          <span>
            <CalendarOutlined style={{ marginRight: 6 }} />
            签到中心
          </span>
        ),
        children: signInContent,
      },
      {
        key: 'pets',
        label: (
          <span>
            <StarOutlined style={{ marginRight: 6 }} />
            桌宠收藏
            {deskPets.length > 0 && (
              <Badge
                count={deskPets.length}
                style={{ marginLeft: 6, background: '#1890ff', fontSize: 10 }}
                size="small"
              />
            )}
          </span>
        ),
        children: petsContent,
      },
    ] : []),
    {
      key: 'reports',
      label: (
        <span>
          <FileTextOutlined style={{ marginRight: 6 }} />
          报告收藏
          {savedReports.length > 0 && (
            <Badge
              count={savedReports.length}
              style={{ marginLeft: 6, background: '#a855f7', fontSize: 10 }}
              size="small"
            />
          )}
        </span>
      ),
      children: reportsContent,
    },
    {
      key: 'settings',
      label: (
        <span>
          <SettingOutlined style={{ marginRight: 6 }} />
          设置
        </span>
      ),
      children: settingsContent,
    },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 0 40px' }}>
      <Spin spinning={loading} description="加载中...">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
          style={{ marginBottom: 20 }}
          tabBarStyle={{
            background: '#f5f5f5',
            padding: '8px 8px 0',
            borderRadius: '12px 12px 0 0',
            margin: 0,
          }}
        />
      </Spin>

      {/* 盲盒弹窗 */}
      <Modal
        open={blindBoxOpen}
        onCancel={closeBlindBox}
        footer={null}
        centered
        width={420}
        closable={false}
        mask={{ closable: false }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{
          textAlign: 'center',
          padding: '32px 24px',
          background: !blindBoxResult
            ? 'linear-gradient(135deg, #fff7e6 0%, #fff1b8 100%)'
            : 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
          borderRadius: 8,
        }}>
          {!blindBoxResult ? (
            <>
              <div style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ffd666 0%, #fa8c16 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                fontSize: 64,
                boxShadow: '0 8px 32px rgba(250,140,22,0.4)',
                animation: isShaking ? 'shake 0.5s ease-in-out infinite' : 'float 3s ease-in-out infinite',
              }}>
                🎁
              </div>
              <h3 style={{ margin: '0 0 12px', fontSize: 22, color: '#d46b08' }}>神秘盲盒</h3>
              <p style={{ color: '#ad6800', margin: '0 0 28px', fontSize: 14 }}>
                连续签到7天奖励！点击开启，看看你能获得什么桌宠！
              </p>
              <Button
                type="primary"
                size="large"
                icon={<GiftOutlined />}
                onClick={openBlindBox}
                loading={isShaking}
                style={{
                  borderRadius: 28,
                  padding: '0 48px',
                  height: 52,
                  fontSize: 17,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(250,140,22,0.35)',
                }}
              >
                {isShaking ? '开启中...' : '开启盲盒'}
              </Button>
            </>
          ) : (
            <>
              <div style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: 64,
                boxShadow: RARITY_CONFIG[blindBoxResult.rarity].glow,
                animation: 'popIn 0.5s ease-out',
              }}>
                {blindBoxResult.image}
              </div>
              <h3 style={{
                margin: '0 0 8px',
                fontSize: 24,
                color: RARITY_CONFIG[blindBoxResult.rarity].color,
                fontWeight: 700,
              }}>
                🎉 获得 {blindBoxResult.name}！
              </h3>
              <Tag
                color={RARITY_CONFIG[blindBoxResult.rarity].color}
                style={{
                  borderRadius: 10,
                  fontSize: 13,
                  padding: '4px 16px',
                  marginBottom: 12,
                }}
              >
                {RARITY_CONFIG[blindBoxResult.rarity].label}
              </Tag>
              <p style={{ color: 'var(--text-secondary)', margin: '0 0 28px', fontSize: 14 }}>
                {blindBoxResult.description}
              </p>
              <Button
                type="primary"
                size="large"
                onClick={closeBlindBox}
                style={{
                  borderRadius: 28,
                  padding: '0 48px',
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                  border: 'none',
                  boxShadow: '0 4px 16px rgba(82,196,26,0.35)',
                }}
              >
                太棒了！
              </Button>
            </>
          )}
        </div>
      </Modal>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const ProfilePage: React.FC = () => (
  <App>
    <ProfilePageContent />
  </App>
);

export default ProfilePage;
