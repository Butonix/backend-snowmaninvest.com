const Tag = require('../models/tag');
const slugify = require('slugify');
const { errorHandler } = require('../helpers/dbErrorHandler');

exports.create = ( req, res) => {
    
    //Get Tag Name from req.body
    const { name } = req.body;

    //Slugify Name and create new instance, tag
    let slug = slugify(name).toLowerCase();
    let tag = new Tag({
        name, slug
    })

    //Save the new instance into database
    tag.save((err, data) => {
        if(err) {
            return res.status(400).json({
                err: errorHandler(err)
            })
            
        }
        res.json(data);
    });
};

exports.remove = ( req, res ) => {

    //get the params
    let slug = req.params.slug.toLowerCase();

    Tag.findOneAndRemove({slug}).exec((err, data) => {
        if(err) {
            return res.status(400).json({
                err: errorHandler(err)
            })
        }
        res.json({
            message: `The tag ${data.slug} has been removed`
        })
    })
}

exports.list = ( req, res ) => {
    Tag.find({}).exec((err, data) => {
        if(err) {
            return res.status(400).json({
                err: errorHandler(err)
            })
        }

        res.json(data);
    })
}

exports.read = ( req, res ) => {
    res.json({
        message: "Development work in progress"
    })
}


