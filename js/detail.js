import {
  addItem,
  checkIfUserAuthenticated,
  deleteItem,
  errorToast,
  findItem,
  findItemIndex,
  setOnLogin,
  validateCart,
} from "./utility.js";

$(document).ready(() => {
  // check if user already logged in
  checkIfUserAuthenticated((res) => {
    if (res) {
      setOnLogin();
      productDataShow();
    }
  });
});

const productDataShow = () => {
  $.getJSON("/assets/available-inventory.json", (products) => {})
    .done((items) => {
      // validate cart
      validateCart(items);

      // filter out product according to its id
      const productId = new URL(location.href).searchParams.get("product_id");
      const product = $.grep(items, function (e) {
        return e.id == productId;
      })[0];

      if (!product) {
        // show product not found
        $(".auth-error").removeClass("d-none");
        return;
      }

      $("#productImg").attr("src", product?.image_src[0]);
      $("#productImg").mouseenter(function () {
        $(this).css("transform", "scale(1.3)");
      });
      $("#productImg").mouseleave(function () {
        $(this).css("transform", "scale(1)");
      });

      $("#productHeading").text(product?.vendor);
      $("#productSubhead").text(product?.name);
      $("#productDisprice").text("$" + product?.price);
      $("#productPrice").text("$" + product?.compare_at_price);
      $("#productOff").text(
        `(${Math.round(
          ((product?.compare_at_price - product?.price) /
            product?.compare_at_price) *
            100
        )} % off)`
      );
      $("#prodDesc").text(product?.description);

      // check if item already added or not
      if (findItemIndex(product?.id) >= 0) {
        $(`.cart-sec .modify-quan`).removeClass("d-none").addClass("d-flex");
        $(`.cart-sec .modify-quan .quant`).text(findItem(product?.id).quantity);
      } else {
        $(`.cart-sec .add-to-cart`).removeClass("d-none");
      }

      // adding event listener for add-to-cart button
      $(`.cart-sec .add-to-cart`).click((event) => {
        addItem(product, (res) => {
          $(`.cart-sec .add-to-cart`).addClass("d-none");
          $(`.cart-sec .modify-quan .quant`).text(
            findItem(product?.id).quantity
          );
          $(`.cart-sec .modify-quan`).removeClass("d-none").addClass("d-flex");
        });
      });

      // adding event listener to subtract buttons
      $(`.cart-sec .modify-quan .subtract`).click((event) => {
        deleteItem(product, (res) => {
          if (findItemIndex(product?.id) < 0) {
            $(`.cart-sec .modify-quan`)
              .removeClass("d-flex")
              .addClass("d-none");
            $(`.cart-sec .add-to-cart`).removeClass("d-none");
          } else {
            $(`.cart-sec .modify-quan .quant`).text(
              findItem(product?.id).quantity
            );
          }
        });
      });

      // adding event listener to add buttons
      $(`.cart-sec .modify-quan .add`).click((event) => {
        addItem(product, (res) => {
          $(`.cart-sec .modify-quan .quant`).text(
            findItem(product?.id).quantity
          );
        });
      });

      $("#productDetails").removeClass("d-none");
    })
    .fail(() => {
      errorToast("Something went wrong!");
    });
};
