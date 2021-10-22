const { notStrictEqual } = require("assert");
const { SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS } = require("constants");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
//The /dishes handlers
function list(req, res, next) {
  res.json({ data: dishes });
}

function create(req, res, next) {
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

//The /dishes/:dishId handlers
function read(req, res, next) {
  const foundDish = res.locals.dish;
  res.json({ data: foundDish });
}

function update(req, res, next) {
  const { data: { id, name, description, price, image_url } = {} } = req.body;

  res.locals.dish = {
    id: res.locals.dishId,
    name: name,
    description: description,
    price: price,
    image_url: image_url,
  };

  res.json({ data: res.locals.dish });
}

function destroy(req, res, next) {
  const { dishId } = req.params;
  const index = dishes.findIndex((dish) => dish.id === dishId);
  dishes.splice(index, 1);
  res.sendStatus(405);
}

//validation middleware
function validateDishBody(req, res, next) {
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  let errorMessage;

  if (!name || name == "") {
    errorMessage = "Dish must include a name";
  } else if (!description || description == "") {
    errorMessage = "Dish must include a description";
  } else if (!price) {
    errorMessage = "Dish must include a price";
  } else if (price <= 0 || !Number.isInteger(price)) {
    errorMessage = "Dish must have a price that is an integer greater than 0";
  } else if (!image_url || image_url == "") {
    errorMessage = "Dish must include a image_url";
  }

  if (errorMessage) {
    next({
      status: 400,
      message: errorMessage,
    });
  }
  next();
}

function validateDishId(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  } else {
    next({
      status: 404,
      message: `Dish id not found: ${dishId}.`,
    });
  }
}

function validateDishBodyId(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;

  if (!id || id === dishId) {
    res.locals.dishId = dishId;
    return next();
  } else {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
}

module.exports = {
  list,
  create: [validateDishBody, create],
  read: [validateDishId, read],
  update: [validateDishId, validateDishBody, validateDishBodyId, update],
  delete: [validateDishId, destroy],
};
