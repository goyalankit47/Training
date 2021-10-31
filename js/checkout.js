import {
  addItem,
  checkIfUserAuthenticated,
  deleteItem,
  findItem,
  findItemIndex,
  getCartItems,
  deleteProduct,
  successToast,
  setOnLogin,
  validateCart,
  initializeAllTooltips,
  clearCart,
  errorToast,
} from "./utility.js";

// variables to store payment data
let totalItems = 0,
  totalAmount = 0,
  cartHistory = [];

$(document).ready(() => {
  // check if user already logged in
  checkIfUserAuthenticated((res) => {
    if (res) {
      setOnLogin();
      processCartData();
    }
  });
});

const processCartData = () => {
  $.getJSON("/assets/available-inventory.json", (products) => {})
    .done((items) => {
      // validate cart
      validateCart(items);

      const cartItems = getCartItems();
      cartHistory = JSON.stringify(cartItems);
      if (cartItems.length) {
        // create product item divs by looping on cart items
        $.each(cartItems, (idx, prod) => {
          const item = items.find((p) => p.id === prod.id);
          const newElem = $("#cartItem").clone();
          // adding unique id to the product
          newElem.attr("id", `product-${item?.id}`);

          // setting initial quantity
          newElem.find(`.modify-quan .quant`).text(findItem(item?.id).quantity);

          // adding event listener to subtract buttons
          newElem.find(`.modify-quan .subtract`).click((event) => {
            deleteItem(item, (res) => {
              if (res) {
                if (findItemIndex(item?.id) < 0) {
                  newElem.remove();
                  checkIfCartEmpty();
                } else {
                  newElem
                    .find(`.modify-quan .quant`)
                    .text(findItem(item?.id).quantity);
                }

                // setting payment vars
                totalItems -= 1;
                totalAmount -= Number(item?.price);
                setPaymentBlockData();

                // resetting cartHistory variable
                cartHistory = JSON.stringify(getCartItems());
              }
            });
          });

          // adding event listener to add buttons
          newElem.find(`.modify-quan .add`).click((event) => {
            addItem(item, (res) => {
              if (res) {
                newElem
                  .find(`.modify-quan .quant`)
                  .text(findItem(item?.id).quantity);

                // setting payment vars
                totalItems += 1;
                totalAmount += Number(item?.price);
                setPaymentBlockData();

                // resetting cartHistory variable
                cartHistory = JSON.stringify(getCartItems());
              }
            });
          });

          // adding click event listener to delete button
          newElem.find(".delete-btn").click((event) => {
            const itemQuantity = findItem(item?.id).quantity;
            newElem.remove();
            deleteProduct(item, (res) => {
              if (res) {
                checkIfCartEmpty();

                // setting payment vars
                totalItems -= itemQuantity;
                totalAmount -= Number(item.price) * itemQuantity;
                setPaymentBlockData();
              }
            });
          });

          // Adding the attributes values
          newElem.find("img").attr("src", item?.image_src[0]);
          newElem.find(".product-heading").text(item?.vendor);
          newElem.find(".product-subhead").text(item?.name);
          newElem.find(".product-disprice").text("$" + item?.price);
          newElem.find(".product-price").text("$" + item?.compare_at_price);
          newElem
            .find(".product-off")
            .text(
              `(${Math.round(
                ((item?.compare_at_price - item?.price) /
                  item?.compare_at_price) *
                  100
              )} % off)`
            );
          totalItems += prod.quantity;
          totalAmount += prod.quantity * Number(item?.price);

          $("#orderList").append(newElem);
        });
        setPaymentBlockData();
        $("#cartItem").remove(); // removing dummy item
        $("#cart").removeClass("d-none");

        // adding click listener to csv download
        $(".csv-download").click(() => {
          checkIfUserAuthenticated((res) => {
            if (res) {
              downloadCSV(items);
            }
          });
        });

        // initializing new elements tooltips
        initializeAllTooltips();
      } else {
        // show no data in cart
        $("#noData").removeClass("d-none");
      }
    })
    .fail(() => {
      errorToast("Something went wrong!");
    });
};

const setPaymentBlockData = () => {
  // setting payment block data
  $("#totalItems").text(totalItems);
  $("#totalAmount").text("$" + totalAmount);
};

// check if cart is empty
const checkIfCartEmpty = () => {
  if (getCartItems().length === 0) {
    $("#cart").addClass("d-none");
    $("#noData").removeClass("d-none");
  }
};

// download order as CSV
const downloadCSV = (products) => {
  validateCart(products);
  const cartItems = getCartItems();

  // check in case any cart item got changed
  if (JSON.stringify(cartItems) !== cartHistory) {
    errorToast(
      "Cart Items might have changed. Please refresh the page for latest changes."
    );
    return;
  }

  const headers = [
    "Product ID",
    "Vendor",
    "Name",
    "Price",
    "Product Tag",
    "Quantity",
  ];
  const keys = ["id", "vendor", "name", "price", "tag", "quantity"];

  // creating an array of rows need to download
  const rows = cartItems.map((item) => {
    const temp = {};
    const product = products.find((product) => product.id === item.id);

    for (const index of headers.keys()) {
      temp[headers[index]] =
        keys[index] === "price"
          ? "$" + product[keys[index]]
          : product[keys[index]];
    }

    temp.Quantity = item.quantity;
    return temp;
  });

  // JSON array to csv
  const csv = Papa.unparse(rows);

  // converting to a blob file
  const csvData = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  let csvURL = null;
  if (navigator.msSaveBlob) {
    csvURL = navigator.msSaveBlob(csvData, "order.csv");
  } else {
    csvURL = window.URL.createObjectURL(csvData);
  }

  // temp element to download
  $(`<a href=${csvURL} download="order.csv"></a>`)[0].click();

  successToast("Order Place & Downloaded Successfully!");

  // empty cart and navigate to home
  clearCart();
  window.location.href = "/";
};
