const analysisRouter = require("express").Router();
const { misQuery } = require("../../helpers/dbconn");
var bodyParser = require("body-parser");
const jsonParser = bodyParser.json(); // Define jsonParser middleware

//Machine Performance
analysisRouter.post("/loadMachinePerfomanceData", async (req, res, next) => {
  const fromDate = req.body.fromDate;
  const toDate = req.body.toDate;

  try {
    // Load Customer Machine Usage Details
    const sql = `
      SELECT s1.ShiftLogId, d.ShiftDate, d.Shift, d.Shift_Ic, s.Machine, s.Operator AS ShiftOperator, s1.Operator AS MachineOperator,
s1.FromTime, s1.ToTime, s1.Program, n.Operation, n.Cust_Code, n.Mtrl_Code, n.CustMtrl,s1.TaskNo,m.Material
FROM magodmis.day_shiftregister d, magodmis.shiftregister s, magodmis.shiftlogbook s1,magodmis.ncprograms n,magodmis.mtrlgrades m, magodmis.mtrl_data m1
WHERE d.ShiftDate>= '${fromDate}' AND d.ShiftDate<= '${toDate}' AND s.DayShiftID=d.DayShiftId
AND s.ShiftID=s1.ShiftID AND s1.TaskNo NOT LIKE '100'   AND s1.StoppageID=n.NcId AND NOT (s1.ToTime IS NULL OR  s1.FromTime IS NULL)
AND m.MtrlGradeID =m1.MtrlGradeID AND m1.Mtrl_Code=n.Mtrl_Code
UNION
SELECT  s1.ShiftLogId, d.ShiftDate,d.Shift, d.Shift_Ic, s.Machine, s.Operator AS ShiftOperator, s1.Operator AS MachineOperator,
s1.FromTime, s1.ToTime, s1.Program, s3.GroupName AS Operation, '0000' AS cust_code,'NA' AS Mtrl_Code, 'Magod' AS CustMtrl,s1.TaskNo,'NA' AS Material
FROM magodmis.day_shiftregister d, magodmis.shiftregister s, magodmis.shiftlogbook s1,
magod_production.stoppagereasonlist s2,magod_production.stoppage_category s3
WHERE d.ShiftDate>= '${fromDate}' AND d.ShiftDate<= '${toDate}' AND s.DayShiftID=d.DayShiftId AND s.ShiftID=s1.ShiftID AND s1.TaskNo  LIKE '100'
AND s1.StoppageID=s2.StoppageID AND s3.StoppageGpId=s2.StoppageGpId AND NOT (s1.ToTime IS NULL OR  s1.FromTime IS NULL)`;

    const rows = await new Promise((resolve, reject) => {
      misQuery(sql, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    // Load Customer Billing Details
    const draftInvRegisterQuery = `
      SELECT d.* 
      FROM magodmis.draft_dc_inv_register d 
      WHERE d.Inv_Date >= '${fromDate}' AND d.Inv_Date <= '${toDate}';`;

    const draftInvRegisterRows = await new Promise((resolve, reject) => {
      misQuery(draftInvRegisterQuery, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    const draftInvDetailsQuery = `
      SELECT d1.* 
      FROM magodmis.draft_dc_inv_register d
      JOIN magodmis.draft_dc_inv_details d1 ON d.DC_Inv_No = d1.DC_Inv_No
      WHERE d.Inv_Date >= '${fromDate}' AND d.Inv_Date <= '${toDate}';`;

    const draftInvDetailsRows = await new Promise((resolve, reject) => {
      misQuery(draftInvDetailsQuery, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    // Load summarized billing data
    const billingQuery = `
      SELECT d.Cust_Code, d.Cust_Name, SUM(d1.Qty * d1.Mtrl_rate) AS MaterialValue,
             SUM(d1.Qty * d1.JW_Rate) AS JWValue 
      FROM magodmis.draft_dc_inv_register d
      JOIN magodmis.draft_dc_inv_details d1 ON d.DC_Inv_No = d1.DC_Inv_No
      WHERE d.Inv_Date >= '${fromDate}' AND d.Inv_Date <= '${toDate}' 
      AND NOT d.DCStatus LIKE 'Cancelled' 
      GROUP BY d.Cust_Name, d.Cust_Code 
      ORDER BY JWValue DESC;`;

    const billingRows = await new Promise((resolve, reject) => {
      misQuery(billingQuery, (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    // Combine results into one response
    const combinedData = {
      machineLogBook: rows,
      draftInvRegister: draftInvRegisterRows,
      draftInvDetails: draftInvDetailsRows,
      custBilling: billingRows,
    };

    // Send the combined result back to the client
    res.send(combinedData);
  } catch (error) {
    next(error);
  }
});

analysisRouter.get("/customerNames", async (req, res, next) => {
  try {
    misQuery(
      `SELECT DISTINCT cust_code, Cust_Name FROM magodmis.draft_dc_inv_register;`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//Customer Performance Tab
analysisRouter.post("/loadCustomerDetailsByName", async (req, res, next) => {
  const fromDate = req.body.fromDate;
  const toDate = req.body.toDate;
  const custCode = req.body.getCustCode;

  try {
    // Load Customer Machine Usage Details
    const machineUsageQuery = `
      SELECT   s1.ShiftLogId,d.ShiftDate, d.Shift, d.Shift_Ic, s.Machine, s.Operator
AS ShiftOperator, s1.Operator AS MachineOperator,
s1.FromTime, s1.ToTime, s1.Program, n.Operation, n.Cust_Code, n.Mtrl_Code, n.NcTaskId, 
n.CustMtrl,s1.TaskNo,m.Material 
FROM magodmis.day_shiftregister d, magodmis.shiftregister s, magodmis.shiftlogbook s1,magodmis.ncprograms n,
magodmis.mtrlgrades m, magodmis.mtrl_data m1 
WHERE d.ShiftDate>='${fromDate}' AND d.ShiftDate<='${toDate}' AND s.DayShiftID=d.DayShiftId
AND s.ShiftID=s1.ShiftID AND s1.TaskNo NOT LIKE '100'   AND s1.StoppageID=n.NcId AND NOT 
(s1.ToTime IS NULL OR  s1.FromTime IS NULL)
AND m.MtrlGradeID =m1.MtrlGradeID AND m1.Mtrl_Code=n.Mtrl_Code AND  n.Cust_Code='${custCode}'
`;

    const machineUsageData = await new Promise((resolve, reject) => {
      misQuery(machineUsageQuery, [fromDate, toDate, custCode], (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    // Load Customer Billing Details
    const billingQuery = `
      SELECT n.NcTaskId, n.TaskNo, 
             SUM(d1.Qty * d1.JW_Rate) AS JWValue, 
             SUM(d1.Qty * d1.Mtrl_rate) AS MaterialValue, 
             n.Mtrl_Code, n.MTRL, n.Thickness, 
             n.Operation, SUM(d1.Qty * o.LOC) AS TotalLOC, 
             SUM(d1.Qty * o.Holes) AS TotalHoles 
      FROM magodmis.draft_dc_inv_register d
      JOIN magodmis.draft_dc_inv_details d1 ON d1.DC_Inv_No = d.DC_Inv_No
      JOIN magodmis.orderscheduledetails o ON o.SchDetailsID = d1.OrderSchDetailsID
      JOIN magodmis.nc_task_list n ON n.NcTaskId = o.NcTaskId
      WHERE d.Cust_Code = ? AND d.Inv_Date >= ? AND d.Inv_Date <= ? 
      GROUP BY n.NcTaskId;`;

    const billingData = await new Promise((resolve, reject) => {
      misQuery(billingQuery, [custCode, fromDate, toDate], (err, data) => {
        if (err) return reject(err);
        resolve(data);
      });
    });

    // Combine results into one variable
    const combinedData = {
      custLog: machineUsageData,
      custBilling: billingData,
    };

    // Send the combined result back to the client
    res.send(combinedData);
  } catch (error) {
    next(error);
  }
});

//Load Schedule Performance First Table
analysisRouter.post("/loadCustomers", async (req, res, next) => {
  const fromDate = req.body.fromDate;
  const toDate = req.body.toDate;

  console.log("Hello", fromDate, "and", toDate);

  try {
    misQuery(
      `SELECT DISTINCT o.*, c.Cust_Name
FROM magodmis.draft_dc_inv_register d
JOIN magodmis.orderschedule o ON o.ScheduleId = d.ScheduleId
JOIN magodmis.cust_data c ON c.cust_code = o.Cust_code
WHERE d.Inv_Date >= '${fromDate}'
AND d.Inv_Date <= '${toDate}'
AND d.DCStatus NOT LIKE 'Cancelled';`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

//Load Schedule Performance Second Table
analysisRouter.post("/loadCustomerDetails", async (req, res, next) => {
  const fromDate = req.body.fromDate;
  const toDate = req.body.toDate;
  const selectedScheduleId = req.body.selectedScheduleId;

  try {
    // First query: Customer Billing Details
    misQuery(
      `SELECT 
        n.NcTaskId, 
        n.TaskNo, 
        SUM(d1.Qty * d1.JW_Rate) AS JWValue, 
        SUM(d1.Qty * d1.Mtrl_rate) AS MaterialValue, 
        n.TaskNo, 
        n.Mtrl_Code, 
        n.MTRL, 
        n.Thickness, 
        n.Operation, 
        SUM(d1.Qty * o.LOC) AS TotalLOC, 
        SUM(d1.Qty * o.Holes) AS TotalHoles
      FROM 
        magodmis.draft_dc_inv_register d
      JOIN 
        magodmis.draft_dc_inv_details d1 ON d1.DC_Inv_No = d.DC_Inv_No
      JOIN 
        magodmis.orderscheduledetails o ON o.SchDetailsID = d1.OrderSchDetailsID
      JOIN 
        magodmis.nc_task_list n ON n.NcTaskId = o.NcTaskId
      WHERE 
        d.ScheduleId = '${selectedScheduleId}'
      GROUP BY 
        n.NcTaskId;`,
      (err, customerBillingData) => {
        if (err) {
          return next(err);
        }

        // Second query: Schedule Log Details
        misQuery(
          `SELECT 
            s.*, 
            n.NcTaskId 
          FROM 
            magodmis.nc_task_list n
          JOIN 
            magodmis.ncprograms n1 ON n.NcTaskId = n1.NcTaskId
          JOIN 
            magodmis.shiftlogbook s ON s.StoppageID = n1.Ncid
          WHERE 
            n.ScheduleID = '${selectedScheduleId}';`,
          (err, scheduleLogData) => {
            if (err) {
              return next(err);
            }

            // Combine both results into one variable
            const combinedData = {
              customerBilling: customerBillingData,
              scheduleLog: scheduleLogData,
            };

            // Send the combined result back to the client
            res.send(combinedData);
          }
        );
      }
    );
  } catch (error) {
    next(error);
  }
});

module.exports = analysisRouter;
