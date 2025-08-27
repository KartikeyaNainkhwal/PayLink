// backend/user/index.js
const express = require("express");

const userRouter = require("./user");
const accountRouter = require("./account");
const profileRouter = require("./profile");
const transactionRouter = require("./transcation");
const bankRouter = require("./bank");
const chatRouter = require("./chat");

const router = express.Router();

/**
 * @route /api/v1/user
 */
router.use("/user", userRouter);

/**
 * @route /api/v1/account
 */
router.use("/account", accountRouter);

/**
 * @route /api/v1/profile
 */
router.use("/profile", profileRouter);

/**
 * @route /api/v1/transactions
 */
router.use("/transactions", transactionRouter);

/**
 * @route /api/v1/bank
 */
router.use("/bank", bankRouter);

/**
 * @route /api/v1/chat
 */
router.use("/chat", chatRouter);

module.exports = router;
