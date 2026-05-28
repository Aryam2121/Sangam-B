import { Router } from "express";
import { loginUser,logoutUser,refreshAccessToken,registerUser,changeCurrentPassword, getAllUsers ,getUserById,getAllUsersByDepartmentId} from "../controllers/user.controller.js";
import { loginWithGoogle, completeGoogleRegistration, updateFcmToken } from "../controllers/googleAuth.controller.js";
import { authorizeRoles } from "../middlewares/auth.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateBody, sanitizeInput } from "../middlewares/validation.middleware.js";
import { userValidators } from "../utils/validators.js";

const router = Router()

// Middleware to sanitize all inputs
router.use(sanitizeInput);

router.route("/register").post(
    validateBody(userValidators.validateRegistration),
    registerUser
)

router.route("/login").post(
    validateBody(userValidators.validateLogin),
    loginUser
)

router.route("/google-login").post(loginWithGoogle)

router.route("/google-register").post(completeGoogleRegistration)

router.route("/fcm-token").patch(verifyJWT, updateFcmToken)

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(
    verifyJWT,
    validateBody(userValidators.validatePasswordChange),
    changeCurrentPassword
)

router.route("/getalluser").get(
    verifyJWT,
    authorizeRoles('Main Admin', 'Department Admin'),
    getAllUsers
)

router.route("/getuserbyid").get(
    verifyJWT,
    getUserById
)

router.route('/getuserbydepartmentId').get(
    verifyJWT,
    getAllUsersByDepartmentId
)

export default router