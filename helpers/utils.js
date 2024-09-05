// export const dateToShort = (myDate) => {
//   //console.log("mydate = ", myDate);
//   var convertedStartDate = new Date(myDate.toString().substr(0, 10));
//   //console.log("mydate substr= ", convertedStartDate);
//   //mm/dd/yyyy
//   var mmddformat = convertedStartDate.toLocaleDateString();
//   //convert to dd/mm/yyyy
//   var datearray = mmddformat.split("/");
//   var newdate = datearray[1] + "/" + datearray[0] + "/" + datearray[2];
//   return newdate;
// };

const formatDate = (dateObj, format) => {
  var monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  var curr_date = dateObj.getDate();
  var curr_month = dateObj.getMonth();
  curr_month = curr_month + 1;
  var curr_year = dateObj.getFullYear();
  var curr_min = dateObj.getMinutes();
  var curr_hr = dateObj.getHours();
  var curr_sc = dateObj.getSeconds();
  if (curr_month.toString().length == 1) curr_month = "0" + curr_month;
  if (curr_date.toString().length == 1) curr_date = "0" + curr_date;
  if (curr_hr.toString().length == 1) curr_hr = "0" + curr_hr;
  if (curr_min.toString().length == 1) curr_min = "0" + curr_min;

  if (format == 1) {
    //dd-mm-yyyy
    return curr_date + "-" + curr_month + "-" + curr_year;
  } else if (format == 2) {
    //yyyy-mm-dd
    return curr_year + "-" + curr_month + "-" + curr_date;
  } else if (format == 3) {
    //dd/mm/yyyy
    return curr_date + "/" + curr_month + "/" + curr_year;
  } else if (format == 4) {
    // dd Month yyyy HH:mm:ss
    return (
      curr_date +
      " " +
      monthNames[parseInt(curr_month - 1)] +
      " " +
      curr_year +
      " " +
      curr_hr +
      ":" +
      curr_min +
      ":" +
      curr_sc
    );
  } else if (format == 5) {
    // yyyy-mm-dd HH:mm:ss
    return (
      curr_year +
      "-" +
      curr_month +
      "-" +
      curr_date +
      " " +
      curr_hr +
      ":" +
      curr_min +
      ":" +
      curr_sc
    );
  }
};
module.exports = {
  formatDate,
};
