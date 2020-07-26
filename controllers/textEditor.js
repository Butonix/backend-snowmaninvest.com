const Meta = require('html-metadata-parser');
const fs = require('fs');
const compress_images = require("compress-images");

exports.meta = (req, res) => {
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
}

exports.imgUrl = (req, res) => {
    return res.json({
        success: 1,
        file: {
          url: `${req.body.url}`,
          }
    })
}

exports.compressImg = ( req, res, next ) => {
  compress_images(
    `public/rawImg/${req.params.slug}/*.{jpg,JPG,jpeg,JPEG,png,svg,gif}`,
    `public/img/${req.params.slug}/`,
    { compress_force: false, statistic: true, autoupdate: true },
    false,
    { jpg: { engine: "mozjpeg", command: ["-quality", "60"] } },
    { png: { engine: "pngquant", command: ["--quality=20-50"] } },
    { svg: { engine: "svgo", command: "--multipass" } },
    {
      gif: { engine: "gif2webp", command: ["--colors", "64", "--use-col=web"] },
    },
    function (err, completed) {
      if (completed === true) {
        //Delete the raw one
        next();
        let dir = `public/rawImg/${req.params.slug}`;
        fs.rmdir(dir, { recursive: true }, (err) => {
          if (err) {
              throw err;
          }
        });
      }
    }
  );
  
}

exports.imgSlugger = ( req, res, next) => {
    let slug = req.params.slug;
    fs.mkdir(`./public/rawImg/${slug}`, {recursive: true}, (err) => {
      if(err){
        console.log(err)
      }
      next();
    })
    
}

exports.imgResponse = (req, res) => {

    let slug = req.params.slug;

    return res.json({
        success: 1,
        file: {
          url: `${process.env.EDITOR_URL + `/static/img/${slug}/` + req.file.filename}`,
        }
    })
}

exports.resetImage = ( req, res ) => {

  // Remove Temp folder
  fs.rmdir(`./public/img/temp-${req.user._id}`, { recursive: true }, (err) => {
    if (err) {
        throw err;
    }
  });

}