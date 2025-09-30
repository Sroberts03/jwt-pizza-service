const mysql = require('mysql2/promise');
const config = require('./src/config.js');

module.exports = async () => {
  const connection = await mysql.createConnection({
    host: config.db.connection.host,
    user: config.db.connection.user,
    password: config.db.connection.password,
    multipleStatements: true,
  });
  await connection.query('CREATE DATABASE IF NOT EXISTS pizza_test');
  await connection.query('USE pizza_test');
  // You may want to run your schema setup here, e.g.:
  // await connection.query('CREATE TABLE ...');
  // Or import your schema from a file
  connection.end();
}