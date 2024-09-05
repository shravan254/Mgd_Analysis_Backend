const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(cors());

// Route Imports
const dailyReport = require("./helpers/dbconn.js");
const analysisRouter = require("./routes/PerformanceAnalysis/PerformanceAnalysis.js");
const userRouter = require("./routes/user");

// Routes
app.get("/", (req, res) => {
  res.send("hello");
});

app.use("/analysisRouterData", analysisRouter);
app.use("/user", userRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500).send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
  // logger.error(`Status Code : ${err.status} - Error : ${err.message}`);
});

// Server listening
app.listen(process.env.PORT, () => {
  console.log("Listening on port " + process.env.PORT);
  // logger.info('Listening on port ' + process.env.PORT);
});
