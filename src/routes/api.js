import { Router } from "express";
//import { assignProjectToUser,getAllUsers,getUserById } from "../controllers/user.controller.js";
import { createProject,getProjects,deleteProject,updateProject, getProjectById,getAllTasksByProjectId } from "../controllers/project.controller.js";
import { createTask,getTaskById,getTasks,updateTask,deleteTask } from "../controllers/tasks.controller.js";
import { createDepartment, getAllDepartments } from "../controllers/department.controller.js";
import { createPath,getPathById } from "../controllers/geolocation.controller.js";
//import { createMessage,deleteMessage,getMessageById,getMessagesByDiscussion } from "../controllers/message.controller.js";
//import { createDiscussion,getDiscussions,addMessage } from "../controllers/discussion.controller";
import { authorizeRoles } from "../middlewares/auth.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

// router.route('/assignProjectToUser').post(
//     authorizeRoles('Main Admin','Project Admin'),
//     assignProjectToUser
// )

// router.route('/users').get(
//     authorizeRoles('Main Admin'),
//     getAllUsers
// )

// router.route('/getUserById').get(
//     authorizeRoles('Main Admin'),
//     getUserById
// )

router.route("/project").post(
    createProject
)

// router.route('/getProject').get(
//     getProjects
// )

router.route('/getprojectbyid').get(
    getProjectById
)

router.route('/deleteprojectbyid').delete(
    deleteProject
)

router.route('/updateproject').patch(
    updateProject
)

router.route('/project/task').post(
    createTask
)

router.route('/project/getTaskById').get(
    getTaskById
)

router.route('/createDepartment').post(
    createDepartment
)

router.route('/getalldep').get(
    getAllDepartments
)

router.route('/project/:projectId/tasks').get(
    getAllTasksByProjectId
)

// router.route('/project/task').post(
//     authorizeRoles('Project Admin'),
//     createTask
// )
router.route('/path').post(
    createPath
)

router.route('/path/:id').get(
    getPathById
)
export default router



