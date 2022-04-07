const Game = require('../models/game');
const Category = require('../models/category');
const { body, validationResult } = require('express-validator');
const { decode } = require('../unescape');
const fs = require('fs');
const os = require('os');
const path = require('path');
const multer = require('multer');
const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, os.tmpdir());
    },
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    },
  }),
});
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand
} = require('@aws-sdk/client-s3');

require('dotenv').config();

const s3 = new S3Client({
  region: 'default',
  endpoint: process.env.ENDPOINT,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
  },
});

// GET game list page
exports.gameListGET = function (req, res, next) {
  new Promise((resolve, reject) => {
    Game.find({})
      .sort('title')
      .exec((err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
  })
    .then((games) => {
      // unescape encoded HTML entities so the user see them normally
      games.forEach((game) => {
        game.title = decode(game.title);
      });

      res.render('game-list', {
        title: 'Games List',
        games: games,
      });
    })
    .catch(next);
};

// GET game detail page
exports.gameDetailGET = function (req, res, next) {
  new Promise((resolve, reject) => {
    Game.findById(req.params.id)
      .populate('category')
      .exec((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
  })
    .then((game) => {
      if (game === null) {
        let err = new Error('Game Not Found');
        err.status = 404;
        throw err;
      }

      // unescape encoded HTML entities so the user see them normally
      game.title = decode(game.title);
      game.summary = decode(game.summary);
      game.company = decode(game.company);
      game.category.forEach((category) => {
        category.name = decode(category.name);
      });

      res.render('game-detail', {
        title: 'Game: ' + game.title,
        game: game,
      });
    })
    .catch(next);
}

// GET create game
exports.gameCreateGET = function (req, res, next) {
  new Promise((resolve, reject) => {
    Category.find({}, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  })
    .then((categories) => {
      // unescape encoded HTML entities so the user see them normally
      categories.forEach((category) => {
        category.name = decode(category.name);
      });

      res.render('game-form', {
        title: 'Create a Game Page',
        categories: categories,
      });
    })
    .catch(next);
};

// POST create game
exports.gameCreatePOST = [
  // temporarily store image
  upload.single('coverImage'),

  (req, res, next) => {
    // make an array of category field
    let categories = req.body.category;
    if (!(categories instanceof Array)) {
      if (typeof categories === undefined) categories = [];
      else categories = new Array(categories);
    }
    next();
  },

  // validation and sanitization
  body('pass', 'Admin pass is wrong').trim().equals(process.env.ADMIN_PASS),
  body('title', 'Title should not be empty').trim()
    .isLength({ min: 1 }).escape(),
  body('company', 'Company name should not be empty').trim()
    .isLength({ min: 1 }).escape(),
  body('price', 'Price value is not valid').isNumeric()
    .isInt({ min: 0 }),
  body('stock', 'Stock value is not valid').isNumeric()
    .isInt({ min: 0 }),
  body('release', 'Release date is not valid')
    .optional({ checkFalsy: true }).isISO8601().toDate(),
  body('summary', 'Summary should not be empty').trim()
    .isLength({ min: 0 }).escape(),
  body('category.*').escape(),
  body('coverImage', `Uploaded file\'s extension is not valid. 
  Only .jpg, .png, .jpeg, and .gif extensions are accepted`)
    .custom((value, { req }) => {
      // if there is no uploaded file, skip this validation step
      if (!req.file) return true;

      let mimeType = req.file.mimetype.split('/')[1];
      let validTypes = ['jpg', 'png', 'jpeg', 'gif'];
      if (validTypes.includes(mimeType.toLowerCase()))
        return true;
      else
        return false;
    }),
  body('coverImage', 'File is too large. Max Size: 500KB')
    .custom((value, { req }) => {
      if (!req.file) return true;

      if (req.file.size > 500000) return false;

      return true;
    }),

  (req, res, next) => {
    let errors = validationResult(req);
    let game = new Game({
      title: req.body.title,
      company: req.body.company,
      summary: req.body.summary,
      category: req.body.category,
      price: req.body.price,
      stock: req.body.stock,
      release_date: req.body.release,
      cover_img: null,
    });

    if (!errors.isEmpty()) {
      // delete the file from temporary directory
      fs.rm(req.file.path, (err) => {
        if (err) next(err);
      });

      new Promise((resolve, reject) => {
        Category.find({}, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      })
        .then((categories) => {
          // mark selected categories as checked
          for (cat of categories) {
            if (game.category.includes(cat._id.toString()))
              cat.checked = true;
          }

          // unescape encoded HTML entities so the user see them normally
          game.title = decode(game.title);
          game.company = decode(game.company);
          game.summary = decode(game.summary);
          categories.forEach((category) => {
            category.name = decode(category.name);
          });

          res.render('game-form', {
            title: 'Create a Game',
            game: game,
            categories: categories,
            errors: errors.array(),
          });
        })
        .catch(next);
    }
    else {
      if (req.file) {
        let uploadParams = {
          Bucket: process.env.BUCKET,
          Key: game._id + path.extname(req.file.originalname),
          ACL: 'public-read',
          Body: fs.createReadStream(req.file.path),
        }

        s3.send(new PutObjectCommand(uploadParams))
          .then(() => {
            game.cover_img = uploadParams.Key;
            // delete the file from temporary directory
            fs.rm(req.file.path, (err) => {
              if (err) next(err);
            });
            game.save((err) => {
              if (err) throw err;

              res.redirect(game.url);
            });
          })
          .catch(next);
      }
      else {
        game.cover_img = 'no-image.jpg';
        delete req.file;
        game.save((err) => {
          if (err) throw err;

          res.redirect(game.url);
        });
      }
    }
  }
];

// GET delete game
exports.gameDeleteGET = (req, res, next) => {
  new Promise((resolve, reject) => {
    Game.findById(req.params.id, 'title', (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  })
    .then((game) => {
      if (game === null) {
        res.render('game-list', { title: 'Games' });
        return;
      }

      // unescape encoded HTML entities so the user see them normally
      game.title = decode(game.title);

      res.render('game-delete', {
        title: 'Delete ' + game.title,
        game: game,
      });
    })
    .catch(next);
}

// POST delete game
exports.gameDeletePOST = [
  // validation
  body('pass', 'Admin Pass is wrong').trim().equals(process.env.ADMIN_PASS),

  (req, res, next) => {
    new Promise((resolve, reject) => {
      Game.findById(req.params.id, 'title cover_img', (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    })
      .then((game) => {
        if (game === null) {
          let err = new Error('Game Not Found');
          err.status = 404;
          throw err;
        }

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
          // unescape encoded HTML entities so the user see them normally
          game.title = decode(game.title);

          res.render('game-delete', {
            title: 'Delete' + game.title,
            game: game,
            errors: errors.array(),
          });
          return;
        }

        s3.send(new DeleteObjectCommand({
          Bucket: process.env.BUCKET,
          Key: game.cover_img,
        }))
          .then(() => {
            Game.findByIdAndDelete(game._id, {}, (err) => {
              if (err) return next(err);

              res.redirect('/game');
            });
          });
      })
      .catch(next);
  }
];

exports.gameUpdateGET = (req, res, next) => {
  Promise.all([
    new Promise((resolve, reject) => {
      Game.findById(req.params.id, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    }),
    new Promise((resolve, reject) => {
      Category.find({}, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    })
  ])
    .then((arr) => {
      let [game, categories] = arr;

      if (game === null) {
        let err = new Error('Game Not Found');
        err.status = 404;
        throw err;
      }

      // mark selected categories as checked
      for (cat of categories) {
        if (game.category.includes(cat._id.toString()))
          cat.checked = true;
      }

      // unescape encoded HTML entities so the user see them normally
      game.title = decode(game.title);
      game.company = decode(game.company);
      game.summary = decode(game.summary);
      categories.forEach((category) => {
        category.name = decode(category.name);
      });

      res.render('game-form', {
        title: 'Update ' + game.title,
        game: game,
        categories: categories,
      });

    })
    .catch(next);
}

exports.gameUpdatePOST = [
  // check if the game exists
  (req, res, next) => {
    Game.findById(req.params.id, (err, result) => {
      if (err) next(err);
      else {
        if (result === null) {
          let err = new Error('Game Not Found');
          err.status = 404;
          next(err);
        }
        // store the found game info for further use cases
        req.preUpdateInfo = result;
        next();
      }
    });
  },

  // temporarily store image 
  upload.single('coverImage'),

  // make an array of category field
  (req, res, next) => {
    let categories = req.body.category;
    if (!(categories instanceof Array)) {
      if (typeof categories === undefined) categories = [];
      else categories = new Array(categories);
    }
    next();
  },

  // validation and sanitization
  body('pass', 'Admin pass is wrong').trim().equals(process.env.ADMIN_PASS),
  body('title', 'Title should not be empty').trim()
    .isLength({ min: 1 }).escape(),
  body('company', 'Company name should not be empty').trim()
    .isLength({ min: 1 }).escape(),
  body('price', 'Price value is not valid').isNumeric()
    .isInt({ min: 0 }),
  body('stock', 'Stock value is not valid').isNumeric()
    .isInt({ min: 0 }),
  body('release', 'Release date is not valid')
    .optional({ checkFalsy: true }).isISO8601().toDate(),
  body('summary', 'Summary should not be empty').trim()
    .isLength({ min: 0 }).escape(),
  body('category.*').escape(),
  body('coverImage', `Uploaded file\'s extension is not valid. 
  Only .jpg, .png, .jpeg, and .gif extensions are accepted`)
    .custom((value, { req }) => {
      // if there is no uploaded file, skip this validation step
      if (!req.file) return true;

      let mimeType = req.file.mimetype.split('/')[1];
      let validTypes = ['jpg', 'png', 'jpeg', 'gif'];
      if (validTypes.includes(mimeType.toLowerCase()))
        return true;
      else
        return false;
    }),

  (req, res, next) => {
    let errors = validationResult(req);
    let game = new Game({
      title: req.body.title,
      company: req.body.company,
      summary: req.body.summary,
      release_date: req.body.release,
      category: req.body.category,
      price: req.body.price,
      stock: req.body.stock,
      cover_img: req.file ? req.params.id + path.extname(req.file.originalname)
        : req.preUpdateInfo.cover_img,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // delete the file from temporary directory
      fs.rm(req.file.path, (err) => {
        if (err) next(err);
      });

      new Promise((resolve, reject) => {
        Category.find({}, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      })
        .then((categories) => {
          // mark selected categories as checked
          for (cat of categories) {
            if (game.category.includes(cat._id.toString()))
              cat.checked = true;
          }

          // unescape encoded HTML entities so the user see them normally
          game.title = decode(game.title);
          game.company = decode(game.company);
          game.summary = decode(game.summary);
          categories.forEach((category) => {
            category.name = decode(category.name);
          });

          res.render('game-form', {
            title: 'Update ' + game.title,
            game: game,
            categories: categories,
            errors: errors.array(),
          });
        })
        .catch(next);
    }
    else {
      // if there's a file uploaded, delete the latest one in cloud storage
      // and then add the new file
      if (req.file) {
        s3.send(new DeleteObjectCommand({
          Bucket: process.env.BUCKET,
          Key: game.cover_img,
        }))
          .then(() => {
            s3.send(new PutObjectCommand({
              Bucket: process.env.BUCKET,
              Key: game._id + path.extname(req.file.originalname),
              ACL: 'public-read',
              Body: fs.createReadStream(req.file.path),
            }))
              .then(() => {
                // delete the file from temporary directory
                fs.rm(req.file.path, (err) => {
                  if (err) next(err);
                });

                Game.findByIdAndUpdate(req.params.id, game, (err) => {
                  if (err) return next(err);

                  res.redirect(game.url);
                });
              })
          })
          .catch(next);
        return;
      }

      Game.findByIdAndUpdate(req.params.id, game, (err) => {
        if (err) return next(err);

        res.redirect(game.url);
      });
    }
  }
];
