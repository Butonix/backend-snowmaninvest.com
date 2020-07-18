const express = require('express');
const router = express.Router();

//Validator
const { createTagValidator } = require('../validators/tag.js'); //Create validation variable
const { runValidation } = require('../validators');             //Run Validation


//Controllers
const { requireSignin, adminMiddleware, superAdminMiddleware } = require('../controllers/auth');
const { create, remove, list, read } = require('../controllers/tag');


//Routes
router.post('/tag', createTagValidator, runValidation, requireSignin, create);
router.delete('/tag/:slug',requireSignin, superAdminMiddleware, remove );
router.get('/tags', list);
router.get('/category/:slug', read);

module.exports = router;