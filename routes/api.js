import { Router } from "express";
import { createProject, deleteProject, updateProject, getProjectById, getAllTasksByProjectId, getAllProjects } from "../controllers/project.controller.js";
import { createTask, getTaskById, updateTask, deleteTask, getAllTasksByUserId, getAllTasks } from "../controllers/tasks.controller.js";
import { createDepartment, getAllDepartments, getDepartmentById, updateDepartment, deleteDepartment } from "../controllers/department.controller.js";
import { createPath,updatePath,getPathById} from "../controllers/totalPath.controller.js";
import { createResource, assignResourceToProject, getResourceById, getResourcesByProjectId, getAllResources, updateResourceById, deleteResourceById } from "../controllers/resources.controller.js";
import { uploadProjectReport,getReportByProjectId,uploadTaskReport ,updateProjectReport,updateTaskReport,getReportByTaskId} from "../controllers/report.controller.js";
import { createProjectMLModel, getProjectMLModelById, updateProjectMLModelById } from '../controllers/projectml.controller.js';
import { createSeminar , getAllSeminars} from "../controllers/training.controller.js";
import { createNewPath,getNewPath,getAllNewPaths } from "../controllers/newPath.controller.js";
import { createCompletedPath,getCompletedPathById,updateCompletedPath } from "../controllers/completedPath.controller.js";
import multer from "multer";
import { getChatHistory, sendChatMessage } from "../controllers/chat.controller.js";
import { getDiscussionHistory, createDiscussionMessage } from "../controllers/discussionForum.controller.js";
import { getDashboardSummary } from "../controllers/dashboard.controller.js";
import { assistantChat } from "../controllers/assistant.controller.js";
import { globalSearch } from "../controllers/search.controller.js";
import { getNotifications } from "../controllers/notifications.controller.js";
import { getWorkerDashboard } from "../controllers/workerDashboard.controller.js";
import { createBid, deleteBid, getAllBids, updateBid } from "../controllers/bid.controller.js";
import { getActivityTimeline } from "../controllers/activity.controller.js";


const router=Router();


router.route("/project").post(
    createProject
)


router.route('/getprojectbyid/:id').get(
    getProjectById
)

router.route('/getpathbyid/:id').get(
    getPathById
)


router.route('/project/:projectId').delete(
    deleteProject
)


router.route('/updateproject/:projectId').patch(
    updateProject
)


router.route('/project/task').post(
    createTask
)


router.route('/project/getTaskById/:taskId').get(
    getTaskById
)


router.route('/createDepartment').post(
    createDepartment
)


router.route('/getalldep').get(
    getAllDepartments
)

router.route('/department/:id').get(getDepartmentById)
router.route('/department/:id').patch(updateDepartment)
router.route('/department/:id').delete(deleteDepartment)


router.route('/project/:projectId/tasks').get(
    getAllTasksByProjectId
)


router.route('/project/task/:taskId').patch(
    updateTask
)

router.route('/project/task/:taskId').delete(
    deleteTask
)


router.route('/getalltasksbyuserid/:userId').get(
    getAllTasksByUserId
)


router.route('/getallprojects').get(
    getAllProjects
)


// router.route('/project/task').post(
//     authorizeRoles('Project Admin'),
//     createTask
// )


router.route('/path').post(
    createPath
)

router.route('/path/:id').patch(
    updatePath
)



router.route('/resource').post(
    createResource
)


router.route('/resource/assign').post(
    assignResourceToProject
)


router.route('/resource/:resourceId').get(
    getResourceById
)


router.route('/project/:projectId/resources').get(
    getResourcesByProjectId
)

router.route('/getallresources').get(
    getAllResources
)

router.route('/getalltasks').get(
    getAllTasks
)

const upload = multer({ dest: 'uploads/' });

router.route('/uploadProjectReport/:projectId').post(
    upload.array('report',10),
    uploadProjectReport
);


router.route('/uploadtaskreport/:taskId').post(
    upload.array('report',10),
    uploadTaskReport
);


router.route('/getReportByProjectId/:projectId').get(
    getReportByProjectId
);


router.route('/updateprojectreport/:projectId').patch( 
    upload.array('report',10), updateProjectReport
);


router.route('/updatetaskreport/:taskId').patch(
    upload.array('report',10),updateTaskReport
);


router.route('/getreportbytaskid/:taskId').get(
       getReportByTaskId
)

router.route('/chat/history/:contact').get(
    getChatHistory
)

router.route('/chat/send').post(
    sendChatMessage
)

router.route('/discussion/history/:department').get(
    getDiscussionHistory
)

router.route('/discussion/send').post(
    createDiscussionMessage
)

router.route('/dashboard/summary').get(
    getDashboardSummary
)

router.route('/assistant/chat').post(
    assistantChat
)

router.route('/search').get(globalSearch)

router.route('/notifications').get(getNotifications)
router.route('/activity/timeline').get(getActivityTimeline)
router.route('/bids').get(getAllBids).post(createBid)
router.route('/bids/:bidId').patch(updateBid).delete(deleteBid)

router.route('/worker/dashboard').get(getWorkerDashboard)


router.post('/projectMLModel', createProjectMLModel);
router.get('/projectMLModel/:id', getProjectMLModelById);
router.patch('/projectMLModel/:id', updateProjectMLModelById);


router.route('/createseminar').post(
    createSeminar
)


router.route('/getallseminars').get(
    getAllSeminars
)


router.route('/resource/update/:id').patch(updateResourceById)

router.route('/deleteresource/:id').delete(
    deleteResourceById
)


router.route('/newpath').post(
    createNewPath
)
router.route('/getnewpath/:id').get(
    getNewPath
)

router.route('/getallnewpaths').get(
    getAllNewPaths
)

router.route('/createcompletedpath').post(
    createCompletedPath
)

router.route('/getcompletedpathbyid/:id').get(
    getCompletedPathById
)

router.route('/updatecompletepath/:id').patch(
    updateCompletedPath
)

export default router



