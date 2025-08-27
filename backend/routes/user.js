const express = require('express');
const router = express.Router();
const zod = require("zod");
const { User, OTP, Account } = require("../db");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const { JWT_SECRET } = require("../config");
const { authMiddleware } = require("../middleware");
const { generateOTP, sendOTPEmail } = require("./emailservice");
const { verifyGoogleToken } = require("../google");


const signupBody = zod.object({
  username: zod.string().email(),
  firstName: zod.string(),
  lastName: zod.string(),
  password: zod.string()
});

// Request OTP for signup
router.post("/request-otp", async (req, res) => {
  const { username, firstName, lastName, password } = req.body;
  
  // Check if user already exists and is verified
  const existingUser = await User.findOne({ username, isVerified: true });
  if (existingUser) {
    return res.status(411).json({
      message: "Email already taken"
    });
  }

  // Generate and send OTP
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  // Store OTP in separate collection
  await OTP.findOneAndUpdate(
    { email: username },
    { 
      email: username,
      otp, 
      otpExpires,
      firstName,
      lastName,
      password
    },
    { upsert: true, new: true }
  );

  // Send OTP email
  const emailSent = await sendOTPEmail(username, otp);
  
  if (!emailSent) {
    return res.status(500).json({
      message: "Failed to send OTP email"
    });
  }

  res.json({
    message: "OTP sent to your email"
  });
});

// Verify OTP and complete signup
router.post("/verify-otp", async (req, res) => {
  const { username, otp } = req.body;
  
  // Find OTP record
  const otpRecord = await OTP.findOne({
    email: username,
    otp,
    otpExpires: { $gt: Date.now() } // OTP not expired
  });

  if (!otpRecord) {
    return res.status(411).json({
      message: "Invalid or expired OTP"
    });
  }

  try {
    // Create the user
    const newUser = await User.create({
      username: otpRecord.email,
      password: otpRecord.password,
      firstName: otpRecord.firstName,
      lastName: otpRecord.lastName,
      isVerified: true
    });

    const userId = newUser._id;

    // Create account
    await Account.create({
      userId,
      balance: 1 + Math.random() * 10000
    });

    // Generate token
    const token = jwt.sign({ userId }, JWT_SECRET);

    // Clean up OTP data
    await OTP.findByIdAndDelete(otpRecord._id);

    res.json({
      message: "User created successfully",
      token: token
    });
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key error
      return res.status(411).json({
        message: "User already exists with this email"
      });
    }
    
    console.error("Error in verify-otp:", error);
    res.status(500).json({
      message: "Internal server error"
    });
  }
});

// Resend OTP
router.post("/resend-otp", async (req, res) => {
  const { username } = req.body;
  
  // Find existing OTP record
  const otpRecord = await OTP.findOne({ email: username });
  if (!otpRecord) {
    return res.status(411).json({
      message: "No OTP request found for this email"
    });
  }

  // Generate new OTP
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  // Update OTP
  await OTP.findByIdAndUpdate(otpRecord._id, { otp, otpExpires });

  // Send OTP email
  const emailSent = await sendOTPEmail(username, otp);
  
  if (!emailSent) {
    return res.status(500).json({
      message: "Failed to send OTP email"
    });
  }

  res.json({
    message: "OTP resent to your email"
  });
});

// Keep your existing signin, update, and bulk routes...
// ... [your existing code for signin, update, bulk routes]

// Signin route (unchanged)
const signinBody = zod.object({
  username: zod.string().email(),
  password: zod.string()
});

router.post("/signin", async (req, res) => {
  const { success } = signinBody.safeParse(req.body)
  if (!success) {
    return res.status(411).json({
      message: "Incorrect inputs"
    })
  }

  const user = await User.findOne({
    username: req.body.username,
    password: req.body.password
  });

  if (user) {
    // Check if user is verified
    if (!user.isVerified) {
      return res.status(411).json({
        message: "Please verify your email first"
      });
    }

    const token = jwt.sign({
      userId: user._id
    }, JWT_SECRET);

    res.json({
      token: token
    })
    return;
  }

  res.status(411).json({
    message: "Error while logging in"
  })
});

// Update route (unchanged)
const updateBody = zod.object({
  password: zod.string().optional(),
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
});

router.put("/", authMiddleware, async (req, res) => {
  const { success } = updateBody.safeParse(req.body)
  if (!success) {
    res.status(411).json({
      message: "Error while updating information"
    })
  }

  await User.updateOne({_id: req.userId}, req.body);

  res.json({
    message: "Updated successfully"
  })
});

// Bulk route (unchanged)
router.get("/bulk", async (req, res) => {
  const filter = req.query.filter || "";

  const users = await User.find({
    $or: [{
      firstName: {
        "$regex": filter
      }
    }, {
      lastName: {
        "$regex": filter
      }
    }]
  })

  res.json({
    user: users.map(user => ({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      _id: user._id
    }))
  })
});

router.post("/google-auth", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      message: "Google token is required"
    });
  }

  try {
  // Verify Google token
  const googleUser = await verifyGoogleToken(token);
    
    if (!googleUser.emailVerified) {
      return res.status(400).json({
        message: "Google email not verified"
      });
    }

    // Check if user already exists
    let user = await User.findOne({ username: googleUser.email });
    
    if (user) {
      // If user exists but doesn't have a password (Google-created earlier), generate one
      if (!user.password) {
        const dummy = crypto.randomBytes(12).toString('base64').replace(/\+/g,'0').replace(/\//g,'0');
        user.password = dummy;
        await user.save();
      }
      // User exists, generate token
      const token = jwt.sign({ userId: user._id }, JWT_SECRET);
      
      return res.json({
        message: "Login successful",
        token: token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.username
        }
      });
    } else {
      // Create new user
      // generate a random dummy password so other flows expecting a password continue to work
      const dummyPassword = crypto.randomBytes(12).toString('base64').replace(/\+/g,'0').replace(/\//g,'0');
      const newUser = await User.create({
        username: googleUser.email,
        password: dummyPassword,
        firstName: googleUser.firstName || "Google",
        lastName: googleUser.lastName || "User",
        isVerified: true
      });

      const userId = newUser._id;

      // Create account
      await Account.create({
        userId,
        balance: 1 + Math.random() * 10000
      });

      // Generate token
      const token = jwt.sign({ userId }, JWT_SECRET);

      res.json({
        message: "User created successfully",
        token: token,
        user: {
          id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.username
        }
      });
    }
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(400).json({
      message: error.message || "Google authentication failed"
    });
  }
});

module.exports = router;