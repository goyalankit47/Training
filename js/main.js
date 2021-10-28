// This is the bootstrap file need to be loaded in the application for product listing
import {
  checkIfUserAuthenticated,
  addItem,
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
      productListShow();
      addListenerOnFilters();
    }
  });
});

const productListShow = () => {
  $.getJSON("/assets/available-inventory.json", (products) => {})
    .done((items) => {
      // validating cart
      validateCart(items);

      // setting list heading
      $(".list-heading").text(`Products (${items.length})`);

      $.each(items, (_, item) => {
        const newElem = $("#product").clone();
        // adding unique id to the product
        newElem.attr("id", `product-${item?.id}`);
        newElem.attr("tag", item?.tag);

        // adding event listener for add-to-cart button
        newElem.find(`.cart-sec .add-to-cart`).click((event) => {
          event.stopImmediatePropagation();
          addItem(item, (res) => {
            if (res) {
              newElem.find(`.cart-sec .add-to-cart`).addClass("d-none");
              newElem
                .find(`.cart-sec .modify-quan .quant`)
                .text(findItem(item?.id).quantity);
              newElem
                .find(`.cart-sec .modify-quan`)
                .removeClass("d-none")
                .addClass("d-flex");
            }
          });
        });

        // adding event listener to subtract buttons
        newElem.find(`.cart-sec .modify-quan .subtract`).click((event) => {
          event.stopImmediatePropagation();
          deleteItem(item, (res) => {
            if (res) {
              if (findItemIndex(item?.id) < 0) {
                newElem
                  .find(`.cart-sec .modify-quan`)
                  .removeClass("d-flex")
                  .addClass("d-none");
                newElem.find(`.cart-sec .add-to-cart`).removeClass("d-none");
              } else {
                newElem
                  .find(`.cart-sec .modify-quan .quant`)
                  .text(findItem(item?.id).quantity);
              }
            }
          });
        });

        // adding event listener to add buttons
        newElem.find(`.cart-sec .modify-quan .add`).click((event) => {
          event.stopImmediatePropagation();
          addItem(item, (res) => {
            if (res) {
              newElem
                .find(`.cart-sec .modify-quan .quant`)
                .text(findItem(item?.id).quantity);
            }
          });
        });

        // check for add to cart button
        if (findItemIndex(item?.id) >= 0) {
          newElem
            .find(`.cart-sec .modify-quan`)
            .removeClass("d-none")
            .addClass("d-flex");
          newElem
            .find(`.cart-sec .modify-quan .quant`)
            .text(findItem(item?.id).quantity);
        } else {
          newElem.find(`.cart-sec .add-to-cart`).removeClass("d-none");
        }

        // Attach event handlers to mouse hover and mouse click on product
        newElem.on({
          click: () =>
            (window.location.href = "/pages/detail?product_id=" + item?.id),
          // mouseenter: () => {
          //   newElem.find(`.cart-sec`).removeClass("d-none");
          //   if (findItemIndex(item.id) >= 0) {
          //     newElem
          //       .find(`.cart-sec .modify-quan`)
          //       .removeClass("d-none")
          //       .addClass("d-flex");
          //     newElem
          //       .find(`.cart-sec .modify-quan .quant`)
          //       .text(findItem(item.id).quantity);
          //   } else {
          //     newElem.find(`.cart-sec .add-to-cart`).removeClass("d-none");
          //   }
          // },
          // mouseleave: () => {
          //   newElem.find(`.cart-sec`).addClass("d-none");
          //   newElem.find(`.cart-sec .add-to-cart`).addClass("d-none");
          //   newElem.find(`.cart-sec .modify-quan`).addClass("d-none");
          // },
        });

        // Adding the attributes values
        newElem.find("img").attr("src", item?.image_src[0]);
        newElem.find(".product-heading").text(item?.vendor);
        newElem.find(".product-subhead").text(item?.name);
        newElem.find(".product-price").text("$" + item?.price);
        newElem.find(".product-disprice").text("$" + item?.compare_at_price);
        newElem
          .find(".product-off")
          .text(
            `(${Math.round(
              ((item?.compare_at_price - item?.price) / item?.compare_at_price) *
                100
            )} % off)`
          );

        // appending each product card to container
        $(".products-container").append(newElem);
      });
      $("#product").remove(); // remove dummy element
      $("#productList").removeClass("d-none");
    })
    .fail(() => {
      errorToast("Something went wrong!");
    });
};

// adding click event on filters
const addListenerOnFilters = () => {
  $(".filter-item").click((event) => {
    $(".filter-item").removeClass("active");

    // > => direct child selector
    $(".products-container > div").each(function (index) {
      if (
        event.target.id === "allProducts" ||
        $(this).attr("tag") === event.target.id
      ) {
        $(this).removeClass("d-none");
      } else {
        $(this).addClass("d-none");
      }
    });
    $(`#${event.target.id}`).addClass("active");
  });
};
