import mysql from 'mysql2/promise';

export const getConnection = async (config: {
    host: string;
    user: string;
    password: string;
    database: string;
}) => {
    return mysql.createConnection({
        host: config.host,
        user: config.user,
        password: config.password,
        database: config.database,
    });
};
