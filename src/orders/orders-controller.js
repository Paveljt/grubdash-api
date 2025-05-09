const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
// Middleware: Check if order exists
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({ status: 404, message: `Order not found: ${orderId}` });
}

// Middleware: Validate order fields
function validateOrder(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  if (!deliverTo || deliverTo === "") {
    return next({ status: 400, message: "Order must include a deliverTo" });
  }
  if (!mobileNumber || mobileNumber === "") {
    return next({ status: 400, message: "Order must include a mobileNumber" });
  }
  if (!Array.isArray(dishes)) {
    return next({ status: 400, message: "Order must include a dish" });
  }
  if (dishes.length === 0) {
    return next({ status: 400, message: "Order must include at least one dish" });
  }

  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i];
    if (
      !dish.quantity ||
      typeof dish.quantity !== "number" ||
      dish.quantity <= 0 ||
      !Number.isInteger(dish.quantity)
    ) {
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0`,
      });
    }
  }

  next();
}

// GET /orders
function list(req, res) {
  res.json({ data: orders });
}

// GET /orders/:orderId
function read(req, res) {
  res.json({ data: res.locals.order });
}

// POST /orders
function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status: status || "pending", // default to pending if not provided
    dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

// PUT /orders/:orderId
function update(req, res, next) {
  const { orderId } = req.params;
  const existingOrder = res.locals.order;
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
    });
  }

  if (!status || status === "") {
    return next({
      status: 400,
      message: "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }

  if (!["pending", "preparing", "out-for-delivery", "delivered"].includes(status)) {
    return next({
      status: 400,
      message: "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }

  if (existingOrder.status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }

  existingOrder.deliverTo = deliverTo;
  existingOrder.mobileNumber = mobileNumber;
  existingOrder.status = status;
  existingOrder.dishes = dishes;

  res.json({ data: existingOrder });
}

// DELETE /orders/:orderId
function destroy(req, res, next) {
  const order = res.locals.order;
  if (order.status !== "pending") {
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    });
  }

  const index = orders.findIndex((o) => o.id === order.id);
  if (index > -1) {
    orders.splice(index, 1);
  }

  res.sendStatus(204);
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [validateOrder, create],
  update: [orderExists, validateOrder, update],
  delete: [orderExists, destroy],
};