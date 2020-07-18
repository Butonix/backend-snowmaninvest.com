const { check } = require('express-validator');

exports.userSignupValidator = [
    check('name')
        .not()
        .isEmpty()
        .withMessage('请输入用户名'),
    check('email')
        .isEmail()
        .withMessage('请输入正确的Email'),
    check('password')
        .isLength({ min: 6 })
        .withMessage('密码长度不可少于6')
];

exports.userSigninValidator = [
    check('email')
        .isEmail()
        .withMessage('请输入正确的Email'),
    check('password')
        .isLength({ min: 6 })
        .withMessage('密码长度不可少于6')
];

exports.forgotPasswordValidator = [
    check('email')
        .not()
        .isEmpty()
        .isEmail()
        .withMessage('请输入正确的Email')
];

exports.resetPasswordValidator = [
    check('newPassword')
        .not()
        .isEmpty()
        .isLength({ min: 6})
        .withMessage('密码长度不可少于6')
];

