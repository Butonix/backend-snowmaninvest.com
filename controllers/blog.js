const Blog = require('../models/blog');
const Category = require('../models/category')
const User = require('../models/user');
const {errorHandler} = require('../helpers/dbErrorHandler');
const stripHtml = require('string-strip-html');
const fs = require('fs')
const formidable = require('formidable');
const { smartTrim, username } = require('../helpers/blog');
const slugify = require('slugify');
const pinyin = require('js-pinyin') ;
const array = require('lodash/array');
const striptags = require('striptags');


exports.create = ( req, res ) => {
    let slug, userName;
    let excerpt = '雪人投资';
    let form = new formidable.IncomingForm();
    let photoData = '';
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: 'Photo could not be uploaded'
            });
        }

        const { title, content, categories, username } = fields;
        
        let contentObj = JSON.parse(content);

        if (!title ) {
            return res.status(400).json({
                error: '请输入标题'
            });
        }else{
            let random = Math.floor(Math.random() * 10);
            slug = `${username}`+`${random}-` + pinyin.getFullChars(title).toLowerCase();            
        }

        if (contentObj.blocks.length === 0 ) {
            return res.status(400).json({
                error: '请输入文章内容'
            });
        }

        if( !files.photo ){
            return res.status(400).json({
                error: "请上传封面图片"
            })
        }

        if ( !categories ) {
            return res.status(400).json({
                error: '请选择文章分类'
            });
        }

        let paragraphArray = contentObj.blocks.filter( (block) => {
            return block.type === 'paragraph'
        })
        
        if( paragraphArray[0] == undefined  ) {
            excerpt = '雪人投资';
            
        }else{
            excerpt = smartTrim(paragraphArray[0].data.text, 30, ' ', '...');
        }
        
        let blog = new Blog();
        blog.title = title;
        blog.slug = slugify(slug).toLowerCase();
        blog.body = contentObj;
        blog.postedBy = req.user._id;
        blog.excerpt = striptags(excerpt);
        blog.mtitle = title;
        blog.mdesc = striptags(excerpt);
        let arrayOfCategories = categories && categories.split(',');

        // Create an Object stores Image Property Data
        let image = contentObj.blocks.filter( (block) => {
            return block.type == 'image'
        })

        if(!image.length == 0) {
            let finalImageUrl = [];
            let finalFileName = [];

            for(let i = 0; i < image.length ; i++) {
                finalImageUrl[i] = image[i].data.file.url;
                finalFileName[i] = image[i].data.file.url.slice(image[i].data.file.url.indexOf("image"))
            }
            // Create Permanent Folder
            fs.mkdir(`./public/img/perma-${blog.postedBy}`,{ recursive: true }, (err) => {
                if(err) {
                    throw err;
                }
            })

            for(let i = 0; i < image.length ; i++) {
                fs.copyFileSync(`./public/img/temp-${blog.postedBy}/${finalFileName[i]}`,
                `./public/img/perma-${blog.postedBy}/${finalFileName[i]}`);
            }
            fs.rmdir(`./public/img/temp-${blog.postedBy}`, { recursive: true }, (err) => {
                if (err) {
                    throw err;
                }
            });

            let i = 0;
            console.log(blog.body.blocks);
            for ( let h = 0 ; h < blog.body.blocks.length; h++ ) {
                if(blog.body.blocks[h].type == "image"){
                    blog.body.blocks[h].data.file.url =  `${process.env.EDITOR_URL}/static/img/perma-${blog.postedBy}/${finalFileName[i]}`;
                    console.log("after: " , blog.body.blocks[h].data.file.url)
                }   
            }   


        }

        
        if( files.photo ) {
            if(files.photo.size > 2000000) {
                return res.status(400).json({
                    error: '封面图像不可大于2MB'
                });
            }
            let string = files.photo.type.toString()
            if(!string.startsWith("image")){
                return res.status(400).json({
                    error: '只允许上传图片文档'
                });
            }
            blog.photo.data = fs.readFileSync(files.photo.path);
            blog.photo.contentType = files.photo.type;
        }        
        
        return res.status(200).json({
            blog: blog
        })


        blog.save((err, result) => {
            if(err) {
                return res.status(400).json({
                    error: errorHandler(err)
                })
            }

            Blog.findByIdAndUpdate( result._id , { $push: {categories: arrayOfCategories}} , { new :true }).exec(
                (err, result) => {
                    if(err) {
                        return res.status(400).json({
                            error: errorHandler(err)
                        })
                    }
                    res.json({
                        message: "文章已发布",
                        result: result
                    })
                }
            )
        })
    })
}

exports.list = ( req, res ) => {

    //Check Unusual Behaviour
    if(req.body.query == undefined) {
        res.json({
            message: "Unusual Request Detected"
        })
    }

    if(req.body.query.slug){
        Category.findOne( req.body.query ).exec((err, category) => {
            if(err){
                return res.json({
                    error: errorHandle(err)
                })
            }
            Blog.find({categories : category})
            .populate('categories', '_id name slug')
            .populate('postedBy', '_id name username role')
            .select('_id title slug excerpt categories tags postedBy createdAt updatedAt')
            .sort({ createdAt: -1 })
            // .limit(req.body.limit)
            // .skip(req.body.skip)
            .exec((err, data) => {
                if (err) {
                    return res.json({
                        error: errorHandler(err)
                    });
                }

                res.json({
                    data:data,
                    listSize: data.length,
                    skip: req.body.skip,
                    limit: req.body.limit
                });
            });
        })
        }else if(req.body.query.role) {
            Blog.find({})
                .populate('categories', '_id name slug')
                .populate('postedBy', '_id name username role')
                .sort({ createdAt: -1 })
                .select('_id title slug excerpt categories tags postedBy createdAt updatedAt')
                .exec((err, data) => {
                    if (err) {
                        return res.json({
                            error: errorHandler(err)
                        });
                    }

                    // Need to Optimized Here on next Release
                    let finalData = data.filter((fil) => {
                        return fil.postedBy.role == req.body.query.role
                    })

                    let sliceEnd = parseInt(req.body.skip) + parseInt(req.body.limit);
                    let slicedArray = finalData.slice(req.body.skip, sliceEnd);
                    res.json({
                        data:slicedArray,
                        listSize: slicedArray.length,
                        skip: req.body.skip,
                        limit: req.body.limit
                    });
                });
                }else{
                Blog.find(req.body.query)
                    .populate('categories', '_id name slug')
                    .populate('postedBy', '_id name username role')
                    .select('_id title slug excerpt categories tags postedBy createdAt updatedAt')
                    .sort({ createdAt: -1 })
                    .limit(req.body.limit)
                    .skip(req.body.skip)
                    .exec((err, data) => {
                        if (err) {
                            return res.json({
                                error: errorHandler(err)
                            });
                        }
                        res.json({
                            data:data,
                            listSize: data.length,
                            skip: req.body.skip,
                            limit: req.body.limit
                        });
                    });
    }

}

exports.read = ( req, res ) => {
    const slug = req.params.slug.toLowerCase();
    Blog.findOne({ slug })
        // .select("-photo")
        .populate('categories', '_id name slug')
        .populate('tags', '_id name slug')
        .populate('postedBy', '_id name username')
        .select('_id title body slug mtitle mdesc categories tags postedBy createdAt updatedAt')
        .exec((err, data) => {
            if (err) {
                return res.json({
                    error: errorHandler(err)
                });
            }
            res.json(data);
        });
}

exports.remove = (req, res) => {
    const slug = req.params.slug.toLowerCase();

    Blog.findOne({ slug }).exec((err, data) => {
        if (err) {
            return res.json({
                error: errorHandler(err)
            });
        }
        if(data.postedBy == req.user._id) {
            Blog.findOneAndRemove({ slug }).exec((err,result) => {
                if(err){
                    return res.json({
                        error: errorHandler(err)
                    });
                }
                res.json({
                    message: "Article Deleted Successfully"
                })
            })
        }else{
            res.json({
                error: "删除失败"
            })
        }
        
    });
};

exports.update = (req, res) => {
    const slug = req.params.slug.toLowerCase();
    let excerpt = "";

    Blog.findOne({ slug }).exec((err, oldBlog) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        let form = new formidable.IncomingForm();
        form.keepExtensions = true;

        form.parse(req, (err, fields, files) => {
            if (err) {
                return res.status(400).json({
                    error: 'Image could not upload'
                });
            }
            
            const { title, content, categories, username } = fields;
            let contentObj = JSON.parse(content);
            if (!title ) {
                return res.status(400).json({
                    error: '请输入标题'
                });
            }

            if (contentObj.blocks.length === 0 ) {
                return res.status(400).json({
                    error: '请输入文章内容'
                });
            }

            if ( !categories ) {
                return res.status(400).json({
                    error: '请选择文章分类'
                });
            }
            
           
            if(title) {
                oldBlog.title = title;
            }

            if(contentObj.blocks.length == 0) {
                return res.json({
                    error:"请输入文章"
                })
            }

            if (content) {
                let paragraphArray = contentObj.blocks.filter( (block) => {
                    return block.type === 'paragraph'
                })
                if( paragraphArray[0] == undefined  ) {
                    excerpt = '雪人投资';
                    
                }else{
                    oldBlog.excerpt = striptags(smartTrim(paragraphArray[0].data.text, 15, ' ', '...'));
                }
                oldBlog.body = contentObj;
            }

            if (categories) {
                oldBlog.categories = categories.split(',');
            }


            if (files.photo) {
                if (files.photo.size > 10000000) {
                    return res.status(400).json({
                        error: 'Image should be less then 1mb in size'
                    });
                }
                oldBlog.photo.data = fs.readFileSync(files.photo.path);
                oldBlog.photo.contentType = files.photo.type;
            }
            oldBlog.save((err, result) => {
                if (err) {
                    return res.status(400).json({
                        error: errorHandler(err)
                    });
                }
                res.json({
                    message:"编辑成功"
                });
            });
        });
    });
};

exports.photo = (req, res) => {
    const slug = req.params.slug.toLowerCase();
    Blog.findOne({ slug })
        .select('photo')
        .exec((err, blog) => {
            if (err || !blog) {
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            res.set('Content-Type', blog.photo.contentType);
            return res.send(blog.photo.data);
        });
};

exports.listRelated = (req, res) => {

    let limit = req.body.limit ? parseInt(req.body.limit) : 3;
    const { _id, categories } = req.body.blog;

    Blog.find({ _id: { $ne: _id }, categories: { $in: categories } })
        .limit(limit)
        .populate('postedBy', '_id name username profile')
        .select('title slug excerpt postedBy createdAt updatedAt')
        .exec((err, blogs) => {
            if (err) {
                return res.status(400).json({
                    error: 'Blogs not found'
                });
            }
            res.json(blogs);
        });
};

exports.listSearch = (req, res) => {
    const { search } = req.query;
    if (search) {
        Blog.find(
            {
                $or: [{ title: { $regex: search, $options: 'i' } }, { body: { $regex: search, $options: 'i' } }]
            },
            (err, blogs) => {
                if (err) {
                    return res.status(400).json({
                        error: errorHandler(err)
                    });
                }
                res.json(blogs);
            }
        ).select('-photo -body');
    }
};

exports.bookmark = ( req, res ) => {
    
    if(req.body.checkState){
        User.findOne({ _id: req.user._id}).exec((err, data) => {
            if(err){
                return res.status(400).json({
                    error: errorHandler(err)
                })
            }
            let state = data.savedPost.indexOf(req.body.blogId)
            if(state == -1) {
                res.json({
                    save: false
                })
            }else{
                res.json({
                    save: true
                })
            }
        })
    }else if(req.body.savePost && req.body.unsavePost){
        return res.status(400).json({
            error: "Unusual Request Detected"
        })
    }else if( req.body.savePost ){
        User.findOne({ _id: req.user._id}).exec((err, data) => {
            if(err){
                return res.status(400).json({
                    error: errorHandler(err)
                })
            }
            let state = data.savedPost.indexOf(req.body.blogId)
            if(state >= 0) {
                return res.status(400).json({
                    error: "收藏失败"
                })
            }else{
                data.savedPost.push(req.body.blogId)
                User.findOneAndUpdate({ _id: req.user._id}, { savedPost: data.savedPost}).exec((err, data) => {
                    if(err){
                        return res.status(400).json({
                            error: errorHandler(err)
                        })
                    }
                    res.json(data)
                })
            }
        })
    }else if( req.body.unsavePost){
        User.findOne({ _id: req.user._id}).exec((err, data) => {
            if(err){
                return res.status(400).json({
                    error: errorHandler(err)
                })
            }
            let oldArray = data.savedPost;
            let newArray = oldArray.filter((post) => {
                return post.toString() !== `${req.body.blogId}`
            })
            User.findOneAndUpdate({ _id: req.user._id}, { savedPost: newArray}).exec((err, data) => {
                if(err){
                    return res.status(400).json({
                        error: errorHandler(err)
                    })
                }
                res.json(data)
            })
        })
    }else{
        res.status(400).json({
            error: "Request Not Found"
        })
    }
}

// Unreleased API
exports.listByUser = (req, res) => {
    User.findOne({ username: req.params.username }).exec((err, user) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        let userId = user._id;
        Blog.find({ postedBy: userId })
            .populate('categories', '_id name slug')
            .populate('tags', '_id name slug')
            .populate('postedBy', '_id name username')
            .select('_id title slug postedBy createdAt updatedAt')
            .exec((err, data) => {
                if (err) {
                    return res.status(400).json({
                        error: errorHandler(err)
                    });
                }
                res.json(data);
            });
    });
};