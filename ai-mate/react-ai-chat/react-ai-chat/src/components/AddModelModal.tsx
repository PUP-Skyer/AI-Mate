/**
 * 添加/编辑模型配置弹窗
 */

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Input,
  Radio,
  Collapse,
  Button,
  Space,
  Typography,
} from 'antd';
import { useAIStore } from '../store/aiStore';
import { useI18n } from '../i18n';
import type { ModelConfig } from '../types';
import { PRESET_MODELS } from '../types';

const { Text } = Typography;
const { TextArea } = Input;

interface AddModelModalProps {
  open: boolean;
  editConfig?: ModelConfig | null;
  onClose: () => void;
}

const AddModelModal: React.FC<AddModelModalProps> = ({ open, editConfig, onClose }) => {
  const [form] = Form.useForm();
  const { t } = useI18n();
  const { addModelConfig, updateModelConfig } = useAIStore();
  const [isCustom, setIsCustom] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<typeof PRESET_MODELS[0] | null>(null);

  useEffect(() => {
    if (editConfig) {
      form.setFieldsValue({
        name: editConfig.name,
        provider: editConfig.provider,
        apiKey: editConfig.apiKey,
        modelId: editConfig.modelId,
        baseUrl: editConfig.baseUrl,
        contextWindowInput: editConfig.contextWindowInput,
        contextWindowOutput: editConfig.contextWindowOutput,
        toolCallRounds: editConfig.toolCallRounds,
        multimodal: editConfig.multimodal ? 'yes' : 'no',
      });
      setIsCustom(editConfig.isCustom);
      setSelectedPreset(null);
    } else {
      form.resetFields();
      setIsCustom(false);
      setSelectedPreset(null);
    }
  }, [editConfig, form]);

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const configData = {
        name: values.name,
        provider: values.provider,
        apiKey: values.apiKey,
        modelId: values.modelId || values.customModelId || values.name,
        baseUrl: values.baseUrl || selectedPreset?.baseUrl || 'https://ark.cn-beijing.volces.com/api/plan/v3',
        contextWindowInput: values.contextWindowInput || undefined,
        contextWindowOutput: values.contextWindowOutput || undefined,
        toolCallRounds: values.toolCallRounds || undefined,
        multimodal: values.multimodal === 'yes' || selectedPreset?.multimodal === true,
        isCustom,
        isEnabled: true,
      };

      if (editConfig) {
        updateModelConfig(editConfig.id, configData);
      } else {
        addModelConfig(configData);
      }

      form.resetFields();
      onClose();
    });
  };

  // 获取唯一的 provider 列表
  const providers = [...new Set(PRESET_MODELS.map((m) => m.provider))];

  // 根据选择的 provider 获取模型列表
  const selectedProvider = Form.useWatch('provider', form);
  const modelOptions = selectedProvider
    ? PRESET_MODELS.filter((m) => m.provider === selectedProvider).map((m) => ({
        label: m.name,
        value: m.name,
      }))
    : [];

  const handleModelSelect = (value: string) => {
    const preset = PRESET_MODELS.find((m) => m.name === value);
    setSelectedPreset(preset || null);
    if (preset?.multimodal) {
      form.setFieldsValue({ multimodal: 'yes', modelId: preset.modelId, baseUrl: preset.baseUrl });
    } else if (preset) {
      form.setFieldsValue({ modelId: preset.modelId, baseUrl: preset.baseUrl });
    }
  };

  return (
    <Modal
      title={editConfig ? t('model.edit') : t('model.add')}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('common.cancel')}
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          {t('model.submit')}
        </Button>,
      ]}
      width={520}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 16 }}
      >
        {/* 模型选择 */}
        <Form.Item
          label={
            <Space>
              <Text type="danger">*</Text>
              <Text>{t('model.provider')}</Text>
            </Space>
          }
          name="provider"
          rules={[{ required: true, message: t('model.providerRequired') }]}
        >
          <Select
            placeholder={t('model.providerPlaceholder')}
            onChange={(value) => {
              form.setFieldsValue({ name: undefined });
            }}
            options={providers.map((p) => ({ label: p, value: p }))}
          />
        </Form.Item>

        <Form.Item
          label={
            <Space>
              <Text type="danger">*</Text>
              <Text>{t('model.name')}</Text>
            </Space>
          }
          name="name"
          rules={[{ required: true, message: t('model.nameRequired') }]}
        >
          <Select
            placeholder={t('model.namePlaceholder')}
            showSearch
            options={modelOptions}
            onChange={handleModelSelect}
            dropdownRender={(menu) => (
              <>
                {menu}
                <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      setIsCustom(true);
                      form.setFieldsValue({ name: '' });
                    }}
                  >
                    {t('model.customAdd')}
                  </Button>
                </div>
              </>
            )}
          />
        </Form.Item>

        {isCustom && (
          <Form.Item
            label={t('model.customName')}
            name="customName"
            rules={[{ required: true, message: t('model.customNameRequired') }]}
          >
            <Input placeholder={t('model.customNamePlaceholder')} />
          </Form.Item>
        )}

        {/* 模型 ID（API 调用用的实际模型标识） */}
        <Form.Item
          label={t('model.modelId')}
          name="modelId"
          extra={t('model.modelIdExtra')}
        >
          <Input placeholder={t('model.modelIdPlaceholder')} />
        </Form.Item>

        {/* API Base URL */}
        <Form.Item
          label={t('model.baseUrl')}
          name="baseUrl"
          extra={t('model.baseUrlExtra')}
        >
          <Input placeholder="https://ark.cn-beijing.volces.com/api/plan/v3" />
        </Form.Item>

        {/* API 密钥 */}
        <Form.Item
          label={
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                <Text type="danger">*</Text>
                <Text>{t('model.apiKey')}</Text>
              </Space>
              <Button type="link" size="small">
                {t('model.getApiKey')}
              </Button>
            </Space>
          }
          name="apiKey"
          rules={[{ required: true, message: t('model.apiKeyRequired') }]}
        >
          <Input.Password placeholder={t('model.apiKeyPlaceholder')} />
        </Form.Item>

        {/* 高级配置 */}
        <Collapse
          items={[
            {
              key: 'advanced',
              label: t('model.advanced'),
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  <Form.Item
                    label={t('model.contextInput')}
                    name="contextWindowInput"
                    extra={t('model.autoDefault')}
                  >
                    <Input type="number" placeholder={t('model.autoDefault')} />
                  </Form.Item>

                  <Form.Item
                    label={t('model.contextOutput')}
                    name="contextWindowOutput"
                    extra={t('model.autoDefault')}
                  >
                    <Input type="number" placeholder={t('model.autoDefault')} />
                  </Form.Item>

                  <Form.Item
                    label={t('model.toolRounds')}
                    name="toolCallRounds"
                    extra={t('model.autoDefault')}
                  >
                    <Input type="number" placeholder={t('model.autoDefault')} />
                  </Form.Item>
                </Space>
              ),
            },
          ]}
        />

        {/* 支持多模态 */}
        <Form.Item
          label={t('model.multimodalSupport')}
          name="multimodal"
          initialValue="yes"
          style={{ marginTop: 16 }}
        >
          <Radio.Group>
            <Radio value="no">{t('model.multimodalNo')}</Radio>
            <Radio value="yes">{t('model.multimodalYes')}</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddModelModal;
