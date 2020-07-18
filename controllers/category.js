const Category = require('../models/category');
const Blog = require('../models/blog');
const slugify = require('slugify');
const { errorHandler } = require('../helpers/dbErrorHandler');
const category = require('../models/category');
const { Result } = require('express-validator');
const { response } = require('express');
const pinyin = require('js-pinyin')

exports.create = (req, res) => {

    const { name } = req.body;
    let converted = pinyin.getFullChars(name);
    let slug = slugify(converted).toLowerCase();
    let category = new Category({ 
        name: name,
        slug: slug
    });

    category.save((err, data) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.json(data);
    });
};

exports.list = (req, res) => {
    Category.find({}).exec((err, data) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.json(data);
    });
};

exports.read = (req, res) => {
    const slug = req.params.slug.toLowerCase();

    Category.findOne({ slug }).exec((err, category) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        // res.json(category);
        Blog.find({ categories: category })
            .populate('categories', '_id name slug')
            .populate('tags', '_id name slug')
            .populate('postedBy', '_id name')
            .select('_id title slug excerpt categories postedBy tags createdAt updatedAt')
            .exec((err, data) => {
                if (err) {
                    return res.status(400).json({
                        error: errorHandler(err)
                    });
                }
                res.json({ category: category, blogs: data });
            });
    });
};

exports.remove = (req, res) => {
    const slug = req.params.slug.toLowerCase();

    Category.findOneAndRemove({ slug }).exec((err, data) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.json({
            message: 'Category deleted successfully'
        });
    });
};

exports.update = ( req, res ) => {
    
    const slug = req.params.slug.toLowerCase();

    Category.findOne({slug}).exec( (err, oldCategory) => {
        if(err) {
            return res.status(400).json({
                err: errorHandler(err)
            })
        }
        oldCategory.name = req.body.name;
        oldCategory.save((err, result) => {
            if(err) {
                return res.status(400).json({
                    err: errorHandler(err)
                })
            }
            res.json(result);
        })

    })

}