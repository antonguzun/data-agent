"use client";

import React, { useState, useEffect } from 'react';
import { Button, List, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { IDataSource, DataSourceType } from '@/types/DataSource';


const DataSourceManager: React.FC = () => {
  const [dataSources, setDataSources] = useState<IDataSource[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDataSources();
  }, []);

  const fetchDataSources = async () => {
    const res = await fetch('/api/datasource/{}/description');
    const data = await res.json();
    console.log('Data sources fetched:', data);

    // Validate data to IDataSource
    const validatedDataSources = data.filter((source: any): source is IDataSource => {
      return (
        typeof source._id === 'string' &&
        typeof source.name === 'string' &&
        Object.values(DataSourceType).includes(source.type as DataSourceType) &&
        typeof source.position === 'number'
      );
    });

    setDataSources(validatedDataSources);
  };

  // Add DataSource
  const addDataSource = async (dataSource: IDataSource) => {
    const res = await fetch('/api/datasources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataSource),
    });
    const { data } = await res.json();
    // Handle data
    fetchDataSources();
  };

  // Remove DataSource
  const removeDataSource = async (id: string) => {
    const res = await fetch(`/api/datasources/${id}`, {
      method: 'DELETE',
    });
    const { data } = await res.json();
    // Handle data
    fetchDataSources();
  };

  // Update DataSource Position
  const updateDataSourcePosition = async (id: string, position: number) => {
    const res = await fetch(`/api/datasources/${id}/position`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position }),
    });
    const { data } = await res.json();
    // Handle data
    fetchDataSources();
  };

  return (
    <div>
      <div className="flex flex-col items-start">
        <Button icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)} className="mb-4">
          Add Data Source
        </Button>
        <List
          dataSource={dataSources}
          renderItem={(item, index) => (
            <div className="bg-white shadow-md rounded-lg p-4 mb-4 w-full">
              <List.Item
                key={item._id}
                actions={[
                  <Button
                    icon={<ArrowUpOutlined />}
                    onClick={() => updateDataSourcePosition(item._id, item.position - 1)}
                    disabled={index === 0}
                  />,
                  <Button
                    icon={<ArrowDownOutlined />}
                    onClick={() => updateDataSourcePosition(item._id, item.position + 1)}
                    disabled={index === dataSources.length - 1}
                  />,
                  <Button icon={<DeleteOutlined />} onClick={() => removeDataSource(item._id)} danger />,
                ]}
              >
                <div className="text-black">
                  <div><strong>{item.name}</strong> ({item.type})</div>
                </div>
              </List.Item>
            </div>
          )}
        />
      </div>

      <Modal
        title="Add Data Source"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={addDataSource} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="mysql">MySQL</Select.Option>
              <Select.Option value="postgres">PostgreSQL</Select.Option>
              <Select.Option value="mongodb">MongoDB</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) =>
              getFieldValue('type') === DataSourceType.MySQL && (
                <>
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
                </>
              )
            }
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DataSourceManager;