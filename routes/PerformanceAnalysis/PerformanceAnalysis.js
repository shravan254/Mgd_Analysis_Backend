const analysisRouter = require("express").Router();
const { misQuery } = require("../../helpers/dbconn");
var bodyParser = require("body-parser");

analysisRouter.post("/monthlyTaxSummary", async (req, res, next) => {
  const month = req.body.month;
  const year = req.body.year;
  try {
    misQuery(
      `SELECT
        d.DC_InvType AS InvoiceType,
        u.Tax_Name AS TaxName,
        SUM(u.TaxableAmount) AS TaxableAmount,
        u.TaxPercent,
        SUM(u.TaxAmt) AS TaxAmount
    FROM
        magodmis.dc_inv_taxtable u,
        magodmis.draft_dc_inv_register d
    WHERE
        d.DC_Inv_No = u.Dc_inv_No
        AND d.DCStatus NOT LIKE 'Cancelled'
        AND d.Inv_No IS NOT NULL
        AND YEAR(d.Inv_Date) = '${year}'
        AND MONTH(d.Inv_Date) = '${month}'
    GROUP BY
        u.Tax_Name,
        u.TaxPercent,
        InvoiceType
    ORDER BY
        InvoiceType,
        u.Tax_Name,
        u.TaxPercent;`,
      (err, data) => {
        res.send(data);
      }
    );
  } catch (error) {
    next(error);
  }
});

module.exports = analysisRouter;
