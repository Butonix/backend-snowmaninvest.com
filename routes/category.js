const express = require('express');
const router = express.Router();
const { create, list, read, remove, update } = require('../controllers/category');
const { runValidation } = require('../validators');
const { categoryCreateValidator } = require('../validators/category.js');
const { requireSignin, authMiddleware , adminMiddleware, superAdminMiddleware } = require('../controllers/auth');

router.post('/category', categoryCreateValidator, runValidation, requireSignin, superAdminMiddleware, create);
router.get('/categories', list);
router.get('/category/:slug', read);
router.delete('/category/:slug', requireSignin, authMiddleware, superAdminMiddleware, remove);
router.put('/category/:slug',requireSignin, authMiddleware, superAdminMiddleware, update);

module.exports = router;