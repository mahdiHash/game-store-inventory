const Game = require('../models/game');
const Category = require('../models/category');
const { body, validationResult } = require('express-validator');
const { decode } = require('../unescape');
require('dotenv').config();

// GET categories list
exports.catListGET = (req, res, next) => {
  new Promise((resolve, reject) => {
    Category.find()
      .sort('name')
      .exec((err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
  })
    .then((categories) => {
      // unescape encoded HTML entities so the user see them normally
      categories.forEach((category) => {
        category.name = decode(category.name);
        category.description = decode(category.description);
      });

      res.render('category-list', {
        title: 'Categories',
        categories: categories,
      });
    })
    .catch(next);
}

// GET category detail page
exports.catDetailGET = (req, res, next) => {
  let category = new Promise((resolve, reject) => {
    Category.findById(req.params.id, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  let games = new Promise((resolve, reject) => {
    Game.find({ category: req.params.id }, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  Promise.all([ category, games ])
    .then((arr) => {
      let [ category, games ] = arr;

      if (category === null) {
        let err = new Error('Category Not Found');
        err.status = 404;
        throw err;
      }

      // unescape encoded HTML entities so the user see them normally
      category.name = decode(category.name);
      category.description = decode(category.description);
      games.forEach((game) => {
        game.title = decode(game.title);
        game.summary = decode(game.summary);
      });

      res.render('category-detail', {
        title: 'Category: ' + category.name,
        category: category,
        games: games,
      });
    })
    .catch(next);
}

// GET create category
exports.catCreateGET = (req, res, next) => {
  res.render('category-form', { title: 'Create a Category' });
}

// POST create category
exports.catCreatePOST = [
  // validation and sanitization
  body('pass', 'Admin Pass is wrong').trim().equals(process.env.ADMIN_PASS),
  body('name', 'Category name should not be empty')
    .trim().isLength({ min: 1 }).escape(),
  body('description', 'Category description should not be empty')
    .trim().isLength({ min: 1 }).escape(),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // unescape encoded HTML entities so the user see them normally
      req.body.name = decode(req.body.name);
      req.body.description = decode(req.body.description);

      res.render('category-form', {
        title: 'Create a Category',
        category: req.body,
        errors: errors.array(),
      });
    }
    else {
      let category = new Category({
        name: req.body.name,
        description: req.body.description,
      });

      category.save((err) => {
        if (err) return next(err);

        res.redirect(category.url);
      })
    }
  }
]

// GET delete category
exports.catDeleteGET = (req, res, next) => {
  let category = new Promise((resolve, reject) => {
    Category.findById(req.params.id, 'name', (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

  let games = new Promise((resolve, reject) => {
    Game.find({ category: req.params.id }, 'title', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  Promise.all([ category, games ])
    .then((arr) => {
      let [ category, games ] = arr;

      if (category === null) {
        let err = new Error('Category Not Found');
        err.status = 404;
        throw err;
      }

      // unescape encoded HTML entities so the user see them normally
      category.name = decode(category.name);
      games.forEach((game) => {
        game.title = decode(game.title);
      })

      res.render('category-delete', {
        title: `Delete ${category.name} Category`,
        category: category,
        games: games,
      });
    })
    .catch(next);
}

// POST  category delete
exports.catDeletePOST = [
  // validation
  body('pass', 'Admin Pass is wrong').trim().equals(process.env.ADMIN_PASS),

  (req, res, next) => {
    let category = new Promise((resolve, reject) => {
      Category.findById(req.params.id, 'name', (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  
    let games = new Promise((resolve, reject) => {
      Game.find({ category: req.params.id }, 'title', (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    Promise.all([ category, games ])
      .then((arr) => {
        let errors = validationResult(req);
        let [ category, games ] = arr;

        if (category === null) {
          let err = new Error('Category Not Found');
          err.status = 404;
          throw err;
        }

        if (!errors.isEmpty()) {
          res.render('category-delete', {
            title: `Delete ${category.name} Category`,
            category: category,
            games: games,
            errors: errors.array(),
          });
          return;
        }

        if (games.length > 0) {
          // unescape encoded HTML entities so the user see them normally
          category.name = decode(category.name);
          games.forEach((game) => {
            game.title = decode(game.title);
          });
  
          res.render('category-delete', {
            title: `Delete ${category.name} Category`,
            category: category,
            games: games,
          });
        }
        else {
          Category.findByIdAndDelete(req.params.id, {}, (err) => {
            if (err) return next(err);
  
            res.redirect('/category');
          })
        }
      })
      .catch(next);
  }
];

// GET update category
exports.catUpdateGET = (req, res, next) => {
  new Promise((resolve, reject) => {
    Category.findById(req.params.id, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  })
    .then((category) => {
      if (category === null) {
        res.render('category-list', { title: 'Categories' });
      }

      // unescape encoded HTML entities so the user see them normally
      category.name = decode(category.name);
      category.description = decode(category.description);

      res.render('category-form', {
        title: 'Update Category',
        category: category,
      });
    })
    .catch(next);
}

// POST update category
exports.catUpdatePOST = [
  // validation and sanitization
  body('pass', 'Admin Pass is wrong.').trim().equals(process.env.ADMIN_PASS),
  body('name', 'Category name should not be empty.').trim()
    .isLength({ min: 1 }).escape(),
  body('description', 'Category description should not be empty')
    .trim().isLength({ min: 1 }).escape(),
  
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      // unescape encoded HTML entities so the user see them normally
      req.body.name = decode(req.body.name);
      req.body.description = decode(req.body.description);

      res.render('category-form', {
        title: 'Update Category',
        category: req.body,
        errors: errors.array(),
      });
    }
    else {
      let category = new Category({
        name: req.body.name,
        description: req.body.description,
        _id: req.params.id,
      });

      Category.findByIdAndUpdate(category._id, category, (err, cat) => {
        if (err) return next(err);
        else res.redirect(cat.url);
      });
    }
  },
];
