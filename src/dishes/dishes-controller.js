const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
// Middleware to check if dish exists
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({ status: 404, message: `Dish does not exist: ${dishId}.` });
}

// Validation middleware for dish fields
function validateDish(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  if (!name || name === "") return next({ status: 400, message: "Dish must include a name" });
  if (!description || description === "") return next({ status: 400, message: "Dish must include a description" });
  if (price === undefined) return next({ status: 400, message: "Dish must include a price" });
  if (!Number.isInteger(price) || price <= 0)
    return next({ status: 400, message: "Dish must have a price that is an integer greater than 0" });
  if (!image_url || image_url === "") return next({ status: 400, message: "Dish must include a image_url" });

  next();
}

// GET /dishes
function list(req, res) {
  res.json({ data: dishes });
}

// GET /dishes/:dishId
function read(req, res) {
  res.json({ data: res.locals.dish });
}

// POST /dishes
function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// PUT /dishes/:dishId
function update(req, res, next) {
  const dish = res.locals.dish;
  const { dishId } = req.params;
  const { data: { id, name, description, price, image_url } = {} } = req.body;

  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }

  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

module.exports = {
  list,
  read: [dishExists, read],
  create: [validateDish, create],
  update: [dishExists, validateDish, update],
};