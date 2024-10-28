export interface ITable {
  tableName: string;
  tableDescription: string;
  tableOutput: string;
  tableOutputUserDescription: string;
}

export interface IDataSourceContext {
  _id: string;
  tables: ITable[];
}