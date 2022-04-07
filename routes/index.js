var express = require('express');
var router = express.Router();
let gameRouter = require('./game');
let categoryRouter = require('./category');
let imageRouter = require('./image');

// GET home page
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Draco Game Store' });
});

// GET about page
router.get('/about', (req, res, next) => {
  res.render('about', { title: 'About Us' });
})

// handle image requests
router.use('/img', imageRouter);

router.use('/game', gameRouter);
router.use('/category', categoryRouter);

module.exports = router;
