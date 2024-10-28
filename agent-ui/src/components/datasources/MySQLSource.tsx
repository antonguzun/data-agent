"use client";

import React, { useState } from 'react';
import { Button, Form, Input } from 'antd';

const MySQLSource: React.FC = () => {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    // TODO: Implement save functionality
    console.log('Saving MySQL credentials:', values);
    setLoading(false);
  };

  const testConnection = async () => {
    setLoading(true);
    // TODO: Implement test connection functionality
    console.log('Testing MySQL connection');
    setLoading(false);
  };

  return (
    <Form form={form} onFinish={onFinish} layout="vertical">
      <Form.Item
        name="host"
        label="Host"
        rules={[{ required: true, message: 'Please input the MySQL host!' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="port"
        label="Port"
        rules={[{ required: true, message: 'Please input the MySQL port!' }]}
      >
        <Input type="number" />
      </Form.Item>
      <Form.Item
        name="database"
        label="Database"
        rules={[{ required: true, message: 'Please input the database name!' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="username"
        label="Username"
        rules={[{ required: true, message: 'Please input the username!' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="password"
        label="Password"
        rules={[{ required: true, message: 'Please input the password!' }]}
      >
        <Input.Password />
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

export default MySQLSource;