const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//The /orders handlers
function list(req, res, next) {
  res.json({ data: orders });
}

function create(req, res) {
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } =
    req.body;
  const newOrder = {
    id: nextId(),
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

//The /orders/:orderId handlers
function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res) {
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } =
    req.body;

  res.locals.order = {
    id: res.locals.order.id,
    deliverTo: deliverTo,
    mobileNumber: mobileNumber,
    status: status,
    dishes: dishes,
  };

  res.json({ data: res.locals.order });
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  orders.splice(index, 1);
  res.sendStatus(204);
}

//validation middlewares
function validateOrderBody(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  let errorMessage;

  if (!deliverTo || deliverTo === "") {
    errorMessage = "Order must include a deliverTo";
  } else if (!mobileNumber || mobileNumber === "") {
    errorMessage = "Order must include a mobileNumber";
  } else if (!dishes) {
    errorMessage = "Order must include a dish";
  } else if (!Array.isArray(dishes) || dishes.length === 0) {
    errorMessage = "Order must include at least one dish";
  } else {
    for (let i = 0; i < dishes.length; i++) {
      if (
        !dishes[i].quantity ||
        dishes[i].quantity <= 0 ||
        !Number.isInteger(dishes[i].quantity)
      ) {
        errorMessage = `Dish ${i} must have a quantity that is an integer greater than 0`;
      }
    }
  }
  if (errorMessage) {
    return next({
      status: 400,
      message: errorMessage,
    });
  }
  next();
}

function validateOrderId(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  } else {
    next({
      status: 404,
      message: `Order id not found: ${orderId}`,
    });
  }
}

function validateStatus(req, res, next) {
  const { orderId } = req.params;
  const { data: { id, status } = {} } = req.body;

  let errorMessage;
  if (id && id !== orderId)
    errorMessage = `Order id does not match route id. Order: ${id}, Route: ${orderId}`;
  else if (
    !status ||
    status === "" ||
    (status !== "pending" &&
      status !== "preparing" &&
      status !== "out-for-delivery")
  )
    errorMessage =
      "Order must have a status of pending, preparing, out-for-delivery, delivered";
  else if (status === "delivered")
    errorMessage = "A delivered order cannot be changed";

  if (errorMessage) {
    return next({
      status: 400,
      message: errorMessage,
    });
  }
  next();
}

function validateDelete(req, res, next) {
  if (res.locals.order.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }
  next();
}

module.exports = {
  list,
  create: [validateOrderBody, create],
  read: [validateOrderId, read],
  update: [validateOrderId, validateOrderBody, validateStatus, update],
  delete: [validateOrderId, validateDelete, destroy],
};
