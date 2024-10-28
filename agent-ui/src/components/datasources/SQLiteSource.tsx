"use client";

import React, { useState } from 'react';
import { Button, Form, Input } from 'antd';

const SQLiteSource: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    console.log('Saving SQLite path:', values);
    setLoading(false);
  };

  const testConnection = async () => {
    setLoading(true);
    console.log('Testing SQLite connection');
    setLoading(false);
  };

  return (
    <Form form={form} onFinish={onFinish} layout="vertical">
      <Form.Item
        name="path"
        label="Database Path"
        rules={[{ required: true, message: 'Please input the SQLite database path!' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} style={{ marginRight: 8 }}>
          Save
        </Button>
        <Button onClick={testConnection} loading={loading}>
          Test Connection
        </Button>
      </Form.Item>
    </Form>
  );
};

export default SQLiteSource;
