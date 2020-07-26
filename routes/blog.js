const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { create, list, read, photo, bookmark, remove, update, listSearch } = require('../controllers/blog');
const { requireSignin, authMiddleware } = require('../controllers/auth');
const { imgSlugger , imgResponse, imgUrl, compressImg, meta, resetImage } = require('../controllers/textEditor');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `./public/rawImg/${req.params.slug}`)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    fileName = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname) ;
    cb( null, fileName);
  }
})

const upload = multer({ storage: storage });
router.post('/resetImage', requireSignin, resetImage);
router.post('/uploadFile/:slug', imgSlugger, upload.single('image'), compressImg, imgResponse )
router.get('/linkUrl', meta)
router.post('/uploadUrl', imgUrl);
router.post('/blog', requireSignin, authMiddleware, create);
router.post('/blogs', list);
router.post('/blog/bookmark', requireSignin, authMiddleware, bookmark);
router.get('/articles/:slug', read);
router.get('/blog/photo/:slug', photo);
router.post('/blog/remove/:slug', requireSignin, authMiddleware, remove);
router.post('/blog/update/:slug', requireSignin, authMiddleware,  update);
router.get('/blogs/search', listSearch);

module.exports = router;