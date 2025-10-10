/**
 * Bulk Block Modal
 * Modal for bulk blocking marks
 */

import { Modal, Form, Input, Alert, Space, Typography } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

interface BulkBlockModalProps {
  visible: boolean;
  markCodes: string[];
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const BulkBlockModal = ({
  visible,
  markCodes,
  onConfirm,
  onCancel,
  loading,
}: BulkBlockModalProps) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onConfirm(values.reason);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#faad14' }} />
          <span>Массовая блокировка меток</span>
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Заблокировать"
      cancelText="Отмена"
      okButtonProps={{ danger: true }}
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Alert
          message={`Вы собираетесь заблокировать ${markCodes.length} меток`}
          description="Это действие можно будет отменить позже"
          type="warning"
          showIcon
        />

        <div>
          <Text strong>Выбрано меток: {markCodes.length}</Text>
          {markCodes.length <= 5 && (
            <ul style={{ marginTop: 8 }}>
              {markCodes.map((code) => (
                <li key={code}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {code}
                  </Text>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Form form={form} layout="vertical">
          <Form.Item
            name="reason"
            label="Причина блокировки"
            rules={[
              { required: true, message: 'Укажите причину блокировки' },
              { min: 10, message: 'Минимум 10 символов' },
              { max: 500, message: 'Максимум 500 символов' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Укажите причину блокировки (минимум 10 символов)"
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
};

