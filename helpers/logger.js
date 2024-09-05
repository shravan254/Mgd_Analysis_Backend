const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
// import "winston-daily-rotate-file";

const myFormat = winston.format.printf(
  ({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`;
  }
);

const logger = winston.createLogger({
  levels: winston.config.syslog.levels,
  format: winston.format.combine(
    winston.format.label({ label: "test" }),
    winston.format.timestamp(),
    myFormat
  ),
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({
      level: "info",
      filename: "logs/info/%DATE%.log",
      datePattern: "YYYY-MM-DD-HH",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
    }),
    new DailyRotateFile({
      level: "error",
      filename: "logs/error/%DATE%.log",
      datePattern: "YYYY-MM-DD-HH",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
    }),
    new DailyRotateFile({
      level: "http",
      filename: "logs/http/%DATE%.log",
      datePattern: "YYYY-MM-DD-HH",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
    }),
    new DailyRotateFile({
      level: "warn",
      filename: "logs/warn/%DATE%.log",
      datePattern: "YYYY-MM-DD-HH",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
    }),
    new DailyRotateFile({
      level: "debug",
      filename: "logs/debug/%DATE%.log",
      datePattern: "YYYY-MM-DD-HH",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
    }),
  ],
});

module.exports = { logger }