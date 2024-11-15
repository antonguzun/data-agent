"use client";

import React, { useState, useEffect } from 'react';
import { Button, List, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
// import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { IDataSource, DataSourceType } from '@/types/DataSource';


const DataSourceManager: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);

  const [dataSources, setDataSources] = useState<IDataSource[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingDataSource, setEditingDataSource] = useState<string | null>(null);

  useEffect(() => {
    fetchDataSources();
  }, []);

  const fetchDataSources = async () => {
    const res = await fetch('/api/datasources');
    const data = await res.json();
    console.log('Data sources fetched:', data);

    // Validate data to IDataSource
    setDataSources(data);
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

  const handleListItemClick = async (id: string) => {
    const res = await fetch(`/api/datasources/${id}`);
    const data = await res.json();
    
    form.setFieldsValue(data);
    setEditingDataSource(id);
    setIsModalVisible(true);
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const values = await form.validateFields();
      const res = await fetch(`/api/datasources/${editingDataSource}/test`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(2000), // 10 seconds timeout
      });
      console.log('test res:', res);
      const { message: responseMessage } = await res.json();
      
      if (res.ok) {
        message.success(responseMessage || 'Test successful');
      } else {
        message.error(responseMessage || 'Test failed');
      }
    } catch (error) {
      console.error('Test error:', error);
      message.error('An error occurred during the test');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Data Source Manager</h1>
        <Button 
          icon={<PlusOutlined />} 
          onClick={() => setIsModalVisible(true)} 
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mb-8"
        >
          Add Data Source
        </Button>
        <div className="bg-white shadow overflow-hidden sm:rounded-md px-4">
          <List
            dataSource={dataSources}
            renderItem={(item, index) => (
              <List.Item
                key={item._id}
                className="px-4 py-4 sm:px-6 cursor-pointer hover:bg-gray-50"
                onClick={() => handleListItemClick(item._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-indigo-600 truncate">
                    <strong>{item.name}</strong> ({item.type})
                  </div>
                  <div className="ml-2 flex-shrink-0 flex">
                    {/* <Button
                      icon={<ArrowUpOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDataSourcePosition(item._id, item.position - 1);
                      }}
                      disabled={index === 0}
                      className="mr-2"
                    />
                    <Button
                      icon={<ArrowDownOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateDataSourcePosition(item._id, item.position + 1);
                      }}
                      disabled={index === dataSources.length - 1}
                      className="mr-2"
                    /> */}
                    <Button 
                      icon={<DeleteOutlined />} 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDataSource(item._id);
                      }} 
                      danger
                    />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <a 
                    href={`/datasources/${item._id}/discover`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Discover context
                  </a>
                </div>
              </List.Item>
            )}
          />
        </div>
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
              <Select.Option value={DataSourceType.MySQL}>MySQL</Select.Option>
              <Select.Option value={DataSourceType.Postgres}>PostgreSQL</Select.Option>
              <Select.Option value={DataSourceType.MongoDB}>MongoDB</Select.Option>
              <Select.Option value={DataSourceType.SQLite}>SQLite</Select.Option>
              <Select.Option value={DataSourceType.ClickHouse}>ClickHouse</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) =>
              getFieldValue('type') === DataSourceType.SQLite ? (
                <Form.Item
                  name="path"
                  label="Database Path"
                  rules={[{ required: true, message: 'Please input the SQLite database path!' }]}
                >
                  <Input />
                </Form.Item>
              ) : (getFieldValue('type') === DataSourceType.MySQL || getFieldValue('type') === DataSourceType.ClickHouse || getFieldValue('type') === DataSourceType.Postgres) && (
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
              {editingDataSource ? 'Update' : 'Add'}
            </Button>
            {editingDataSource && (
              <Button
              onClick={handleTest}
              style={{ marginLeft: 8 }}
              loading={isTesting}
              disabled={isTesting}
              // type={testResult === 'success' ? 'primary' : testResult === 'failure' ? 'danger' : 'default'}
            >
              Test
            </Button>
          )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DataSourceManager;
