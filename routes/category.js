const express = require('express');
const router = express.Router();
let categoryController = require('../controllers/category');

// router for: localhost/category/PATH

// // GET request for category list page
router.get('/', categoryController.catListGET);

// // GET/POST request for category creation
router.get('/create', categoryController.catCreateGET);
router.post('/create', categoryController.catCreatePOST);

// GET request for a category
router.get('/:id', categoryController.catDetailGET);

// GET/POST request for category deletion
router.get('/:id/delete', categoryController.catDeleteGET);
router.post('/:id/delete', categoryController.catDeletePOST);

// GET/POST request for category update
router.get('/:id/update', categoryController.catUpdateGET);
router.post('/:id/update', categoryController.catUpdatePOST);

module.exports = router;
