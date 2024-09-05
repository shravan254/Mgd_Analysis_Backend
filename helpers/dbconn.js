var mysql = require("mysql2");

require("dotenv").config();

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPort = process.env.DB_PORT;
const dbPassword = process.env.DB_PASSWORD;
const dbDatabase1 = process.env.DB_DATABASE_1; //magodmis
const dbDatabase2 = process.env.DB_DATABASE_2; //magod_setup
const dbDatabase3 = process.env.DB_DATABASE_3; //magodqtn
const dbDatabase4 = process.env.DB_DATABASE_4; //machine_data
const dbDatabase5 = process.env.DB_DATABASE_5; //magod_sales
const dbDatabase6 = process.env.DB_DATABASE_6; //magod_mtrl

var magodmisConn = mysql.createConnection({
  host: dbHost,
  user: dbUser,
  port: dbPort,
  password: dbPassword,
  database: dbDatabase1,
});

var setupConn = mysql.createConnection({
  host: dbHost,
  user: dbUser,
  port: dbPort,
  password: dbPassword,
  database: dbDatabase2,
});


const dailyReportQuery01 = (query, values) => {
  return new Promise((resolve, reject) => {
    magodmisConn.query(query, values, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

let setupQuery = (q, callback) => {
  setupConn.connect();
  setupConn.query(q, (err, res, fields) => {
    if (err) throw err;
    callback(res);
  });
};

const misConn = mysql.createConnection({
  host: dbHost,
  user: dbUser,
  port: dbPort,
  password: dbPassword,
  database: dbDatabase1,
  dateStrings: true,
});

const setupQueryMod = async (q, values, callback) => {
  try {
    misConn.connect();

    misConn.query(q, values, (err, res, fields) => {
      if (err) {
        console.log("err", err);

        callback(err, null);
      } else {
        callback(null, res);
      }
    });
  } catch (error) {
    callback(error, null);
  }
};



const misQuery = async (q, values, callback) => {
  try {
    misConn.connect();
    misConn.query(q, values, (err, res, fields) => {
      if (err) {
        console.log("error in db", err);
        callback(err, null);
      } else {
        callback(null, res);
      }
    });
  } catch (error) {
    callback(error, null);
  }
};

module.exports = {
  setupQuery,
  setupQueryMod,
  misQuery,
  dailyReportQuery01,
};
