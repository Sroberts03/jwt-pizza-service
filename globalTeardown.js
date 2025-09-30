const mysql = require('mysql2/promise');
const config = require('./src/config.js');

module.exports = async () => {
  const connection = await mysql.createConnection({
    host: config.db.connection.host,
    user: config.db.connection.user,
    password: config.db.connection.password,
    multipleStatements: true,
  });
  await connection.query('DROP DATABASE IF EXISTS pizza_test');
  connection.end();
};