const User = require('../models/user');
const shortId = require('shortid');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const errHandler = require('../helpers/dbErrorHandler');
const { OAuth2Client } = require('google-auth-library');

exports.signup = (req, res) => {

    User.findOne({ email: req.body.email }).exec((err, user) => {
        if (user) {
            return res.status(400).json({
                error: '此邮箱已被注册，请登录'
            });
        }

        const { name, email, password } = req.body;
        let username = shortId.generate();
        let profile = `${process.env.CLIENT_URL}/profile/${username}`;

        let newUser = new User({ name, email, password, profile, username });
        newUser.save((err, success) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            // res.json({
            //     user: success
            // });
            res.json({
                message: '注册完成，请登录！'
            });
        });
    });
};

exports.signin = (req, res) => {
    const { email, password } = req.body;
    // check if user exist
    User.findOne({ email }).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: '该用户不存在，请前往注册'
            });
        }
        // authenticate
        if (!user.authenticate(password)) {
            return res.status(400).json({
                error: '密码与用户邮箱错误'
            });
        }
        // generate a token and send to client
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.cookie('token', token, { expiresIn: '1d' });
        const { _id, username, name, email, role } = user;
        return res.json({
            token,
            user: { _id, username, name, email, role }
        });
    });
};

exports.signout = (req, res) => {
    res.clearCookie('token');
    res.json({
        message: '登出完成'
    });
};

exports.requireSignin = expressJwt({
    secret: process.env.JWT_SECRET
});

exports.authMiddleware = (req, res, next) => {
    const authUserId = req.user._id;
    User.findById({ _id: authUserId }).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: '该用户不存在'
            });
        }
        req.profile = user;
        next();
    });
};

exports.adminMiddleware = (req, res, next) => {
    const adminUserId = req.user._id;
    User.findById({ _id: adminUserId }).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: '用户不存在'
            });
        }

        if ( user.role !== 1 ) {
            return res.status(400).json({
                error: '网页不存在'
            });
        }

        req.profile = user;
        next();
    });
};

exports.superAdminMiddleware = (req, res, next) => {
    const superAdminUserId = req.user._id;
    User.findById({ _id: superAdminUserId }).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: '用户不存在'
            });
        }

        if ( user.role !== 2 ) {
            return res.status(400).json({
                error: 'Admin resource. Access denied'
            });
        }

        req.profile = user;
        next();
    });
};

exports.savedBlog = (req, res) => {
    User.findOne({_id: req.user._id})
    .populate('savedPost', '_id title slug excerpt' ) 
    .select('_id name savedPost')   
    .exec((err, data) => {
        if(err) {
            return res.status(400).json({
                error: errHandler(err)
            })
        }
        res.json(
            data
        )
    })
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
exports.googleLogin = ( req, res ) => {
    
    const idToken = req.body.tokenId;
    client.verifyIdToken({idToken, audience: process.env.GOOGLE_CLIENT_ID}).then(response => {
        console.log(response)
        const { email_verified, name, email, jti } = response.payload;

        if(email_verified) {
            User.findOne({email}).exec(( err, user ) => {
                if(user) {
                    const token = jwt.sign({_id: user.id}, process.env.JWT_SECRET, {expiresIn: '1d'})
                    res.cookie('token', token, {expiresIn: '1d'});
                    const { _id,  email, name, role, username } = user;
                    return res.json({token, user: { _id, email, name, role, username }})
                } else {
                    let username = shortId.generate()
                    let profile = `${process.env.CLIENT_URL}/profile/${username}`
                    let password = jti;
                    user = new User({ name, email, profile, username, password })
                    user.save((err, data) => {
                        if(err){
                            return res.status(400).json({
                                error: errHandler(err)
                            })
                        }
                        const token = jwt.sign({_id: data.id}, process.env.JWT_SECRET, {expiresIn: '1d'})
                        res.cookie('token', token, {expiresIn: '1d'});
                        const { _id,  email, name, role, username } = data;
                        return res.json({token, user: { _id, email, name, role, username }})
                    });
                }
            })
        }
        else{
            return res.status(400).json({
                error: 'Google login failed. Please try again!'
            })
        }
    })
}