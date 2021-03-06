import {
  checkIfUserAuthenticated,
  errorToast,
  setOnLogin,
  successToast,
} from "./utility.js";

const tableHeader = ["Product ID", "Quantity"];
// let rowsData = [];

$(document).ready(() => {
  // check if user already logged in
  checkIfUserAuthenticated((res) => {
    if (res) {
      setOnLogin();
      handleFileInput();
      handleTemplateDownload();
    }
  });
});

const handleFileInput = () => {
  // resetting value attribute of file input
  $("#myfile").click(function () {
    this.value = null;
  });

  $.getJSON("/assets/available-inventory.json", (products) => {})
    .done((items) => {
      $("#myfile").change(function () {
        checkIfUserAuthenticated((res) => {
          if (res) {
            $(this).parse({
              config: {
                // header: true,
                // worker: true,
                skipEmptyLines: true,
                dynamicTyping: true, // to preserve data type of columns

                // Keeping below code for reference incase we need step method in future

                // step: (row, action) => {
                //   // if there is some error in row, abort and show message
                //   if (row.errors.length) {
                //     action.abort();
                //     errorToast(row.errors[0].message);
                //     return;
                //   }

                //   // validating rows values
                //   const tempRow = [];
                //   $.each(tableHeader, (i, head) => {
                //     // check if any field is empty
                //     if (!row.data[head]) {
                //       action.abort();
                //       errorToast("All the required fields must have value!");
                //       return;
                //     } else if (head === "id" || head === "quantity") {
                //       // in case of id and quantity, value type should be number
                //       if (typeof row.data[head] !== "number") {
                //         action.abort();
                //         errorToast(`${head} should be of type number`);
                //         return;
                //       }
                //     }
                //     tempRow.push(row.data[head]);
                //   });

                //   rowsData.push(tempRow);
                // },
                complete: processCSVParse.bind(this, items),
                error: function (_, __, ___, reason) {
                  errorToast(reason);
                },
              },
              before: function (file, inputElement) {
                // empty table in case file changed
                // rowsData = [];
                $("thead").empty();
                $("tbody").empty();
                $("#actualTable").addClass("d-none");
                $(".error-div > p").remove();
                $(".error-div").addClass("d-none");
                $(".toast").remove();

                // table headers to show
                const headers = [
                  "Product ID",
                  "Vendor",
                  "Name",
                  "Price",
                  "Product Tag",
                  "Quantity",
                ];

                // create table header
                const tableHead = $("<tr></tr>");
                $.each(headers, (i, head) => {
                  tableHead.append(`<th>` + head + `</th>`);
                });

                $("thead").append(tableHead);

                // validating for file type (must be csv only)
                const ext = inputElement.value.match(/\.([^\.]+)$/);
                if (!ext || ext[1] !== "csv") {
                  return {
                    action: "abort",
                    reason: "File type must be CSV only!",
                  };
                }
              },
              error: function (_, __, ___, reason) {
                errorToast(reason);
              },
            });
          }
        });
      });
    })
    .fail(() => {
      errorToast("Something went wrong!");
    });
};

const handleTemplateDownload = () => {
  $("#downloadTemplate").click(() => {
    const rows = [tableHeader];
    // JSON array to csv
    const csv = Papa.unparse(rows);

    // converting to a blob file
    const csvData = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    let csvURL = null;
    if (navigator.msSaveBlob) {
      csvURL = navigator.msSaveBlob(csvData, "template.csv");
    } else {
      csvURL = window.URL.createObjectURL(csvData);
    }

    // temp element to download
    $(`<a href=${csvURL} download="template.csv"></a>`)[0].click();

    successToast("Template Downloaded Successfully!");
  });
};

const processCSVParse = (products, res) => {
  console.log(res, products);

  // check if file is empty
  if (res.data.length < 2) {
    errorToast("Uploaded File has no data!");
    return;
  }

  // parse complete data and show all the possible errors
  const errorDiv = $(".error-div");
  const orderItems = [];

  // Match header array to required one
  const dataHeader = res?.data[0];
  if (dataHeader.length !== tableHeader.length) {
    errorDiv.append(
      `<p> Header Error : Number of columns in CSV header doesn't match with the required one. </p>`
    );
  } else {
    $.each(tableHeader, (index, item) => {
      if (
        !dataHeader[index] ||
        dataHeader[index].toLowerCase() !== item.toLowerCase()
      ) {
        errorDiv.append(
          `<p> Header : Column ${
            index + 1
          } of CSV Header must be '${item}'. </p>`
        );
      }
    });
  }

  // Traverse every row and validate
  $.each(res?.data.slice(1), (i, row) => {
    if (row.length > tableHeader.length) {
      //   errorDiv.append(
      //     `<p> Row_${
      //       i + 1
      //     } : Number of columns are not same as required  . </p>`
      //   );
    } else {
      let rowHasError = true;
      $.each(row, (idx, data) => {
        // check if any data is empty
        if (!data && typeof data !== "number") {
          errorDiv.append(
            `<p> Row_${i + 2} : Column ${
              tableHeader[idx]
            } of row cannot be empty. </p>`
          );
        } else if (!Number.isInteger(data)) {
          errorDiv.append(
            `<p> Row_${i + 2} : Column ${
              tableHeader[idx]
            } of row contains value '${data}'. It must contain some numeric value. </p>`
          );
        } else if (Number(data) <= 0) {
          errorDiv.append(
            `<p> Row_${i + 2} : Column ${
              tableHeader[idx]
            } of row must contain value greater than zero. </p>`
          );
        } else if (
          idx == 0 &&
          !products.find((pro) => pro.id === Number(data))
        ) {
          errorDiv.append(
            `<p> Row_${
              i + 2
            } : Product with Product ID '${data}' doesn't exists. </p>`
          );
        } else {
          rowHasError = false;
        }
      });

      if (!rowHasError) {
        const index = orderItems.findIndex(
          (item) => item.id === Number(row[0])
        );
        if (index < 0) {
          orderItems.push({
            id: Number(row[0]),
            quantity: Number(row[1]),
          });
        } else {
          orderItems[index].quantity += Number(row[1]);
        }
      }
    }
  });

  // if error div is empty, show success toast and table else show error toast
  if ($(".error-div > p").length) {
    errorDiv.removeClass("d-none");
    errorToast("There are errors with the provided CSV!");
  } else {
    // create table body
    $.each(orderItems, (i, row) => {
      const productItem = products.find((item) => item.id === Number(row.id));
      const tableBody = $(`<tr>
        <td>${row.id}</td>
        <td>${productItem.vendor}</td>
        <td>${productItem.name}</td>
        <td>${productItem.price}</td>
        <td>${productItem.tag}</td>
        <td>${row.quantity}</td>
      </tr>`);
      $("tbody").append(tableBody);
    });

    successToast("CSV Uploaded Successfully!");
    // remove d-none from table
    $("#actualTable").removeClass("d-none");
  }

  // Keeping script for scroll listeners

  // // check if data is not empty
  // if (!rowsData.length) {
  //   errorToast("File is Empty!");
  //   return;
  // }

  // // create table body
  // $.each(rowsData, (i, row) => {
  //   const tableBody = $("<tr></tr>");
  //   $.each(row, (i, data) => {
  //     tableBody.append(`<td>` + data + `</td>`);
  //   });
  //   $("tbody").append(tableBody);
  // });

  // // remove d-none from table
  // $("#actualTable").removeClass("d-none");

  // add window scroll header mock functionality
  // const tableOffset = $("#actualTable").offset().top;
  // const $header = $("#actualTable > thead").clone();
  // const $fixedHeader = $("#header-fixed");
  // $fixedHeader.find("table").append($header);

  // $(window).bind("scroll", function () {
  //   const offset = $(this).scrollTop();

  //   if (offset >= tableOffset && $fixedHeader.is(":hidden")) {
  //     $fixedHeader.show();
  //     $("#header-fixed > div").scrollLeft($("#tableContainer").scrollLeft());
  //   } else if (offset < tableOffset) {
  //     $fixedHeader.hide();
  //   }
  // });

  // // horizontal sync
  // $("#tableContainer").bind("scroll", function () {
  //   $("#header-fixed > div").scrollLeft($(this).scrollLeft());
  // });
};
