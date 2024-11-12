import { IDataSource } from '../types/DataSource';
import { dbConnect } from './mongodb';
import { ObjectId } from 'mongodb';


export async function getDataSourceCredentials(dataSourceId: string): Promise<IDataSource> {
  try {
    const db = await dbConnect();
    console.log('try to find datasource:', dataSourceId);

    const dataSource = await db
      .collection('datasources')
      .findOne({ _id: new ObjectId(dataSourceId) });
    console.log('dataSource by id:', dataSource);

    if (!dataSource) {
      throw new Error('Data source not found');
    }

    // Ensure the document has all required IDataSource properties
    const typedDataSource: IDataSource = {
      _id: dataSource._id.toString(),
      name: dataSource.name,
      type: dataSource.type,
      position: dataSource.position,
      host: dataSource.host,
      username: dataSource.username,
      password: dataSource.password,
      database: dataSource.database,
      port: dataSource.port,
      path: dataSource.path
    };

    return typedDataSource;
  } catch (error) {
    console.error('Error fetching data source credentials:', error);
    throw error;
  }
}
