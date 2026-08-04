/**
 * 问题反馈表单 - 用于 Butler 功能模块
 */

import React, { useState } from 'react';
import { Card, Form, Select, Input, Button, App, Space, Result } from 'antd';
import { FormOutlined } from '@ant-design/icons';
import { submitFeedback } from '../../services/butlerService';

const { TextArea } = Input;

const feedbackTypeOptions = [
  { value: 'bug', label: 'Bug 报告' },
  { value: 'suggestion', label: '功能建议' },
  { value: 'complaint', label: '投诉' },
  { value: 'inquiry', label: '咨询' },
];

const FeedbackFormContent: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { message } = App.useApp();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await submitFeedback({
        type: values.type,
        description: values.description,
      });
      setSubmitted(true);
      message.success('问题反馈提交成功，我们将尽快处理您的反馈');
    } catch (error) {
      console.error('提交反馈失败:', error);
      message.error('提交失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <Card
        title={
          <Space>
            <FormOutlined />
            <span>问题反馈</span>
          </Space>
        }
        size="small"
        styles={{ body: { padding: '12px' } }}
      >
        <Result
          status="success"
          title="提交成功"
          subTitle="感谢您的反馈，我们会尽快处理您遇到的问题"
          extra={
            <Button type="primary" onClick={handleReset}>
              继续反馈
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <FormOutlined />
          <span>问题反馈</span>
        </Space>
      }
      size="small"
      styles={{ body: { padding: '12px', maxHeight: 'calc(100vh - 200px)', overflow: 'auto' } }}
    >
      <Form form={form} layout="vertical" size="small">
        <Form.Item
          name="type"
          label="反馈类型"
          rules={[{ required: true, message: '请选择反馈类型' }]}
        >
          <Select placeholder="请选择反馈类型" options={feedbackTypeOptions} />
        </Form.Item>
        <Form.Item
          name="description"
          label="详细描述"
          rules={[
            { required: true, message: '请输入详细描述' },
            { min: 10, message: '描述至少10个字符' },
          ]}
        >
          <TextArea
            placeholder="请详细描述您遇到的问题或改进建议..."
            rows={6}
            showCount
            maxLength={1000}
          />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            block
          >
            提交反馈
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

const FeedbackForm: React.FC = () => (
  <App>
    <FeedbackFormContent />
  </App>
);

export default FeedbackForm;
