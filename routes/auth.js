const express = require('express');
const router = express.Router();
const { signup, signin, signout, requireSignin, savedBlog, googleLogin } = require('../controllers/auth');

// validators
const { runValidation } = require('../validators');
const { authMiddleware } = require('../controllers/auth');
const { 
    userSignupValidator, 
    userSigninValidator, 

} = require('../validators/auth');

router.post('/signup', userSignupValidator, runValidation, signup);
router.post('/signin', userSigninValidator, runValidation, signin);
router.get('/signout', signout);
router.post('/profile/bookmarks', requireSignin, authMiddleware, savedBlog);
// router.put('/forgot-password', forgotPasswordValidator, runValidation, forgotPassword );
// router.put('/reset-password', resetPasswordValidator, runValidation, resetPassword );

//Google Login
router.post('/google-login', googleLogin)


module.exports = router;
