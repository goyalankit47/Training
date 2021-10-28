// This file contains resusable methods

const checkIfUserAuthenticated = (callback) => {
  if (localStorage.getItem("userId")) {
    callback(true);
  } else {
    openLoginModal();
  }
};

const openLoginModal = () => {
  $("body").load("/pages/login-modal.html", () => {
    // clearing localstorage before loginset
    localStorage.clear();

    // subscribe form submission
    subscribeFormSubmission();

    $("#loginModal").modal({ backdrop: "static", keyboard: false });
  });
};

const subscribeFormSubmission = () => {
  $("form").on("submit", function (event) {
    event.preventDefault();

    const email = $("input#email").val();
    const password = $("input#password").val();

    // fetching user list
    $.getJSON("/assets/users.json", () => {})
      .done((users) => {
        const user = users.find((item) => item.email === email);
        if (user && user?.password === password) {
          $(".error-msg").addClass("d-none"); // remove error if any
          clearCart(); // clearing cart data if any
          localStorage.setItem("userId", user.id); // setting user id for checking authorization
          successToast("Successfully Logged In!");
          window.location.reload();
        } else {
          // Show error message in case of wrong email or password
          $(".error-msg").removeClass("d-none");
        }
      })
      .fail(() => {
        errorToast("Something Went Wrong!");
      });
    return false;
  });
};

const showToast = (message, type) => {
  const toastDiv = `
        <div class="toast  ${type}" 
        ${type === "error" ? 'data-autohide="false"' : null} 
        data-delay=2000 style="position: absolute; top: 0; right: 0;">
            <div class="toast-header">
                <strong class="mr-auto text-uppercase">${type}</strong>
                <button type="button" class="ml-2 close" data-dismiss="toast">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="toast-body font-weight-bold">
               ${message}
            </div>
        </div>`;

  // remove previous toast if any
  $(".toast").remove();

  // Attaching the message toasts dynamically
  $(".toast-wrapper").append(toastDiv);

  $(".toast").toast("show");

  // listening to toast hide event to remove it from DOM
  $(".toast").on("hidden.bs.toast", function () {
    // Removing the toast from DOM
    $(this).remove();
  });
};

// To show success toasts
const successToast = (message) => {
  showToast(message, "success");
};

// To show error toasts
const errorToast = (message) => {
  showToast(message, "error");
};

// add class to navbar on scroll
const navbarScroll = () => {
  $(window).scroll(function () {
    if ($(window).scrollTop() >= 30) {
      $(".navbar").addClass("shadow-sm");
    } else {
      $(".navbar").removeClass("shadow-sm");
    }
  });
};

// Adding items in cart
const addItem = (item, callback) => {
  checkIfUserAuthenticated((res) => {
    if (res) {
      const tempItems = getCartItems();
      const index = findItemIndex(item.id);
      if (index < 0) {
        tempItems.push({
          id: item.id,
          quantity: 1,
        });
      } else {
        if (
          !Number(tempItems[index]?.quantity) ||
          tempItems[index]?.quantity <= 0
        ) {
          tempItems[index].quantity = 0;
        }
        tempItems[index].quantity += 1;
      }
      setCartItems(tempItems, "Item Added!");
      callback(true);
    }
  });
};

// Delete item from cart
const deleteItem = (item, callback) => {
  checkIfUserAuthenticated((res) => {
    if (res) {
      const tempItems = getCartItems();
      const index = findItemIndex(item.id);
      if (index < 0) {
      } else {
        tempItems[index].quantity -= 1;
        if (
          !Number(tempItems[index]?.quantity) ||
          tempItems[index]?.quantity <= 0
        ) {
          tempItems.splice(index, 1);
        }
      }
      setCartItems(tempItems, "Item Removed!");
      callback(true);
    }
  });
};

// Delete whole product from cart
const deleteProduct = (item, callback, noToast = false) => {
  checkIfUserAuthenticated((res) => {
    if (res) {
      const tempItems = getCartItems();
      const index = findItemIndex(item.id);
      if (index < 0) {
      } else {
        tempItems[index].quantity = 0;
        tempItems.splice(index, 1);
      }
      setCartItems(tempItems, !noToast ? "Item Removed" : null);
      callback(true);
    }
  });
};

// find item index in cart
const findItemIndex = (itemId) => {
  return getCartItems().findIndex((item) => item.id === itemId);
};

// find item in cart
const findItem = (itemId) => {
  return getCartItems().find((item) => item.id === itemId);
};

// get items from cart
const getCartItems = () => {
  try {
    return JSON.parse(localStorage.getItem("cartItems") || "[]");
  } catch (e) {
    setCartItems([]);
    return [];
  }
};

// set cart items
const setCartItems = (items, toastMsg) => {
  checkIfUserAuthenticated((res) => {
    if (res) {
      if (toastMsg) {
        successToast(toastMsg);
      }
      localStorage.setItem("cartItems", JSON.stringify(items));
      setCartQuantity(items);
    }
  });
};

// set cart icon text
const setCartQuantity = (items) => {
  let quantity = 0;
  $.each(items, (_, item) => {
    quantity += item?.quantity;
  });
  $(".cart-quantity").text(quantity);
};

// validating cart for unintended entries
const validateCart = (products) => {
  $.each(getCartItems(), (_, item) => {
    // check if id is present in product list
    if (
      !products.find((pro) => pro.id === item.id) ||
      !Number(item.quantity) ||
      Number(item.quantity) <= 0
    ) {
      deleteProduct(item, () => {}, true);
    }
  });
  setCartQuantity(getCartItems());
};

// clear cart from ls
const clearCart = () => {
  localStorage.removeItem("cartItems");
};

// add event click listener to logout button
const addClickEventOnLogoutButton = () => {
  $("#logout").click(logout);
};

const logout = () => {
  localStorage.clear();
  window.location.href = "/";
};

const showUserName = () => {
  // fetching user list
  $.getJSON("/assets/users.json", () => {}).done((users) => {
    const user = users?.find(
      (item) => item?.id === Number(localStorage.getItem("userId") || "-1")
    );
    if (user) {
      $("#userName").text(`Welcome, ${user?.name}`);
    } else {
      logout();
    }
  });
};

const getDateTime = () => {
  setInterval(() => {
    $("#dateTime").text(new Date().toString());
  }, 1000);
};

const initializeAllTooltips = () => {
  $('[data-toggle="tooltip"]').tooltip({
    container: "body",
    trigger: "hover",
  });

  // removing tooltip in case of element click
  $('[data-toggle="tooltip"]').click(()=>{
    $('.tooltip').remove();
  });
};

// handles change in userId dynamically
const listenStorageChange = () => {
  window.onstorage = (ev) => {
    if (ev.key === "userId") {
      if (ev.oldValue !== ev.newValue) {
        openLoginModal();
      }
    }
  };
};

const setOnLogin = () => {
  addClickEventOnLogoutButton();
  showUserName();
  getDateTime();
  setCartQuantity(getCartItems());
  initializeAllTooltips();
  // listenStorageChange();
};

export {
  openLoginModal,
  checkIfUserAuthenticated,
  subscribeFormSubmission,
  successToast,
  errorToast,
  addItem,
  deleteItem,
  deleteProduct,
  findItemIndex,
  findItem,
  navbarScroll,
  addClickEventOnLogoutButton,
  logout,
  showUserName,
  getCartItems,
  getDateTime,
  setOnLogin,
  validateCart,
  initializeAllTooltips,
  clearCart,
};
