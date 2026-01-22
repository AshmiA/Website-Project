
// import express from "express";
// import {
//   getUsers,
//   createUser,
//   deleteUser
// } from "../controllers/userController.js";

// const router = express.Router();

// router.get("/", getUsers);
// router.post("/", createUser);
// router.delete("/:id", deleteUser);

// export default router;








// import express from "express";
// import {
//   getUsers,
//   createUser,
//   deleteUser,
//   sendAdminOtp,
//   verifyAdminOtp,
//   resetAdminPassword,
// } from "../controllers/userController.js";

// const router = express.Router();

// /* USER CRUD */
// router.get("/", getUsers);
// router.post("/", createUser);
// router.delete("/:id", deleteUser);

// /* FORGOT PASSWORD FLOW */
// router.post("/forgot-password/send-otp", sendAdminOtp);
// router.post("/forgot-password/verify-otp", verifyAdminOtp); // ✅ REQUIRED
// router.post("/forgot-password/reset", resetAdminPassword);

// export default router;




import express from "express";
import {
  getUsers,
  createUser,
  deleteUser,
  sendAdminOtp,
  verifyAdminOtp,
  resetAdminPassword,
} from "../controllers/userController.js";

const router = express.Router();

/* CRUD */
router.get("/", getUsers);
router.post("/", createUser);
router.delete("/:id", deleteUser);

router.post("/forgot-password/send-otp", sendAdminOtp);
router.post("/forgot-password/verify-otp", verifyAdminOtp);
router.post("/forgot-password/reset", resetAdminPassword);

export default router;
