/**
 * Generate Marks Modal
 * Modal for generating new marks
 */

import { Modal, Form, Input, InputNumber, DatePicker, Space } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface GenerateMarksModalProps {
  visible: boolean;
  onConfirm: (values: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const GenerateMarksModal = ({
  visible,
  onConfirm,
  onCancel,
  loading,
}: GenerateMarksModalProps) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const [productionDate, expiryDate] = values.dates;
      
      await onConfirm({
        gtin: values.gtin,
        quantity: values.quantity,
        productionDate: productionDate.toISOString(),
        expiryDate: expiryDate.toISOString(),
        supplierId: values.supplierId,
        manufacturerId: values.manufacturerId,
        orderId: values.orderId,
        generateQrCodes: true,
      });
      
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
      title="Создать качественные метки"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="Создать"
      cancelText="Отмена"
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          quantity: 100,
        }}
      >
        <Form.Item
          name="gtin"
          label="GTIN (штрихкод)"
          rules={[
            { required: true, message: 'Укажите GTIN' },
            { pattern: /^\d{8}$|^\d{12,14}$/, message: 'GTIN должен быть 8, 12, 13 или 14 цифр' },
          ]}
        >
          <Input placeholder="04607177964089" maxLength={14} />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="Количество меток"
          rules={[
            { required: true, message: 'Укажите количество' },
            { type: 'number', min: 1, max: 10000, message: 'От 1 до 10,000' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            max={10000}
            placeholder="100"
          />
        </Form.Item>

        <Form.Item
          name="dates"
          label="Даты производства и истечения"
          rules={[{ required: true, message: 'Выберите даты' }]}
        >
          <RangePicker
            style={{ width: '100%' }}
            placeholder={['Дата производства', 'Срок годности']}
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        <Space style={{ width: '100%' }} size="large">
          <Form.Item name="supplierId" label="ID поставщика" style={{ flex: 1 }}>
            <InputNumber style={{ width: '100%' }} placeholder="12345" />
          </Form.Item>

          <Form.Item name="manufacturerId" label="ID производителя" style={{ flex: 1 }}>
            <InputNumber style={{ width: '100%' }} placeholder="67890" />
          </Form.Item>
        </Space>

        <Form.Item name="orderId" label="ID заказа">
          <Input placeholder="ORD-2025-001234" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

