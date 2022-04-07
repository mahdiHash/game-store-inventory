const express = require('express');
const router = express.Router();
let gameController = require('../controllers/game');

// router for: localhost/game/

// handle GET request for games list page
router.get('/', gameController.gameListGET);

// // handle GET/POST request for game creation
router.get('/create', gameController.gameCreateGET);
router.post('/create', gameController.gameCreatePOST);

// handle GET request for a game
router.get('/:id', gameController.gameDetailGET);

// handle GET/POST request for game deletion
router.get('/:id/delete', gameController.gameDeleteGET);
router.post('/:id/delete', gameController.gameDeletePOST);

// // handle GET/POST request for game update
router.get('/:id/update', gameController.gameUpdateGET);
router.post('/:id/update', gameController.gameUpdatePOST);

module.exports = router;
