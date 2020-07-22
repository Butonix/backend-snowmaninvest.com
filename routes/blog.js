const express = require('express');
const router = express.Router();
const { create, list, read, photo, bookmark, remove, update, listSearch } = require('../controllers/blog');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Meta = require('html-metadata-parser');
const { requireSignin, authMiddleware } = require('../controllers/auth')

let slug = "";

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, `./public/img/${slug}`)
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
  })

var upload = multer({ storage: storage })

const slugger = ( req, res, next) => {
  slug = req.params.slug;
  fs.mkdir(`./public/img/${slug}`, {recursive: true}, (err) => {
    if(err){
      console.log(err)
    }
  })
  next();
}

router.get('/linkUrl', ( req, res) => {
  Meta.parser(req.query.url, function (err, result) {

    if(err) {
      console.log(err)
    }

    let data = {
      title: result.meta.title,
      description: result.meta.description,
      image: {
        url: result.og.image
      }
    }
    return res.json({
      "success" : 1,
      "meta": data
    })
  })
  
  
})

router.post('/uploadFile/:slug',slugger, upload.single('image'), (req, res) => {
  return res.json({
    success: 1,
    file: {
      url: `${process.env.EDITOR_URL + `/static/img/${slug}/` + req.file.filename}`,
      }
    })
} )

router.post('/uploadUrl', (req, res) => {

  return res.json({
    success: 1,
    file: {
      url: `${req.body.url}`,
      }
    })
} )


router.post('/blog', requireSignin, authMiddleware, create);
router.post('/blogs', list);
router.post('/blog/bookmark', requireSignin, authMiddleware, bookmark);
router.get('/articles/:slug', read);
router.get('/blog/photo/:slug', photo);
router.post('/blog/remove/:slug', requireSignin, authMiddleware, remove);
router.post('/blog/update/:slug', requireSignin, authMiddleware,  update);
router.get('/blogs/search', listSearch);

module.exports = router;