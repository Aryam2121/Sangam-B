import { Router } from "express";
import { createProject, deleteProject, updateProject, getProjectById, getAllTasksByProjectId, getAllProjects } from "../controllers/project.controller.js";
import { createTask, getTaskById, updateTask, deleteTask, getAllTasksByUserId, getAllTasks } from "../controllers/tasks.controller.js";
import { createDepartment, getAllDepartments, getDepartmentById, updateDepartment, deleteDepartment } from "../controllers/department.controller.js";
import { createPath, updatePath, getPathById } from "../controllers/totalPath.controller.js";
import { createResource, assignResourceToProject, getResourceById, getResourcesByProjectId, getAllResources, updateResourceById, deleteResourceById } from "../controllers/resources.controller.js";
import { uploadProjectReport, getReportByProjectId, uploadTaskReport, updateProjectReport, updateTaskReport, getReportByTaskId } from "../controllers/report.controller.js";
import { createProjectMLModel, getProjectMLModelById, updateProjectMLModelById } from '../controllers/projectml.controller.js';
import { createSeminar, getAllSeminars } from "../controllers/training.controller.js";
import { createNewPath, getNewPath, getAllNewPaths } from "../controllers/newPath.controller.js";
import { createCompletedPath, getCompletedPathById, updateCompletedPath } from "../controllers/completedPath.controller.js";
import { getChatHistory, getChatContacts, sendChatMessage } from "../controllers/chat.controller.js";
import { getDiscussionHistory, createDiscussionMessage } from "../controllers/discussionForum.controller.js";
import { getDashboardSummary } from "../controllers/dashboard.controller.js";
import { assistantChat } from "../controllers/assistant.controller.js";
import { globalSearch } from "../controllers/search.controller.js";
import { getActivityTimeline } from "../controllers/activity.controller.js";
import { createBid, deleteBid, getAllBids, updateBid } from "../controllers/bid.controller.js";
import { getCityKpis, exportKpiReport } from "../controllers/kpi.controller.js";
import { createInterDeptRequest, getInterDeptRequests, updateInterDeptRequest, escalateOverdueRequests } from "../controllers/workflow.controller.js";
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from "../controllers/announcement.controller.js";
import { getBudgetSummary, createBudgetEntry, updateProjectBudgetCap } from "../controllers/budget.controller.js";
import { getAuditTrail, getAuditStats } from "../controllers/audit.controller.js";
import { getMapHubData, uploadGeoLayer, getGeoLayers, deleteGeoLayer, updateProjectLocation, syncProjectLocations } from "../controllers/geo.controller.js";
import { getWebhooks, createWebhook, testWebhook, sendIntegrationAlert } from "../controllers/integration.controller.js";
import { getMlPrefillData } from "../controllers/mlPrefill.controller.js";
import { markSeminarAttendance, getSeminarAttendance, getMySeminarCertificates } from "../controllers/training.controller.js";
import { getNotifications, markNotificationsRead, markAllNotificationsRead } from "../controllers/notifications.controller.js";
import { getWorkerDashboard } from "../controllers/workerDashboard.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.middleware.js";
import { imageUpload } from "../middlewares/upload.middleware.js";
import { validateBody, validateMongoIds } from "../middlewares/validation.middleware.js";
import {
  projectValidators,
  taskValidators,
  departmentValidators,
  resourceValidators,
  apiValidators,
} from "../utils/validators.js";

const router = Router();

router.use(verifyJWT);

const adminOnly = authorizeRoles('Main Admin', 'Department Admin');
const managers = authorizeRoles('Main Admin', 'Department Admin', 'Officer');
const workersAndUp = authorizeRoles('Main Admin', 'Department Admin', 'Officer', 'Worker');

router.route("/project").post(
  managers,
  validateBody(apiValidators.validateProjectCreate),
  createProject
);

router.route('/getprojectbyid/:id').get(
  validateMongoIds('id'),
  getProjectById
);

router.route('/getpathbyid/:id').get(
  validateMongoIds('id'),
  getPathById
);

router.route('/project/:projectId').delete(
  validateMongoIds('projectId'),
  managers,
  deleteProject
);

router.route('/updateproject/:projectId').patch(
  validateMongoIds('projectId'),
  managers,
  validateBody(projectValidators.validateProjectUpdate),
  updateProject
);

router.route('/project/task').post(
  managers,
  validateBody(apiValidators.validateTaskCreate),
  createTask
);

router.route('/project/getTaskById/:taskId').get(
  validateMongoIds('taskId'),
  getTaskById
);

router.route('/createDepartment').post(
  adminOnly,
  validateBody(departmentValidators.validateDepartmentCreation),
  createDepartment
);

router.route('/getalldep').get(getAllDepartments);

router.route('/department/:id').get(
  validateMongoIds('id'),
  getDepartmentById
);
router.route('/department/:id').patch(
  validateMongoIds('id'),
  adminOnly,
  validateBody(departmentValidators.validateDepartmentCreation),
  updateDepartment
);
router.route('/department/:id').delete(
  validateMongoIds('id'),
  adminOnly,
  deleteDepartment
);

router.route('/project/:projectId/tasks').get(
  validateMongoIds('projectId'),
  getAllTasksByProjectId
);

router.route('/project/task/:taskId').patch(
  validateMongoIds('taskId'),
  workersAndUp,
  validateBody(taskValidators.validateTaskUpdate),
  updateTask
);

router.route('/project/task/:taskId').delete(
  validateMongoIds('taskId'),
  managers,
  deleteTask
);

router.route('/getalltasksbyuserid/:userId').get(
  validateMongoIds('userId'),
  getAllTasksByUserId
);

router.route('/getallprojects').get(getAllProjects);

router.route('/path').post(
  managers,
  validateBody(apiValidators.validatePathCreate),
  createPath
);

router.route('/path/:id').patch(
  validateMongoIds('id'),
  managers,
  validateBody(apiValidators.validatePathUpdate),
  updatePath
);

router.route('/resource').post(
  managers,
  validateBody(resourceValidators.validateResourceCreation),
  createResource
);

router.route('/resource/assign').post(
  managers,
  validateBody(apiValidators.validateResourceAssign),
  assignResourceToProject
);

router.route('/resource/:resourceId').get(
  validateMongoIds('resourceId'),
  getResourceById
);

router.route('/project/:projectId/resources').get(
  validateMongoIds('projectId'),
  getResourcesByProjectId
);

router.route('/getallresources').get(getAllResources);

router.route('/getalltasks').get(getAllTasks);

router.route('/uploadProjectReport/:projectId').post(
  validateMongoIds('projectId'),
  workersAndUp,
  imageUpload.array('report', 10),
  uploadProjectReport
);

router.route('/uploadtaskreport/:taskId').post(
  validateMongoIds('taskId'),
  workersAndUp,
  imageUpload.array('report', 10),
  uploadTaskReport
);

router.route('/getReportByProjectId/:projectId').get(
  validateMongoIds('projectId'),
  getReportByProjectId
);

router.route('/updateprojectreport/:projectId').patch(
  validateMongoIds('projectId'),
  workersAndUp,
  imageUpload.array('report', 10),
  updateProjectReport
);

router.route('/updatetaskreport/:taskId').patch(
  validateMongoIds('taskId'),
  workersAndUp,
  imageUpload.array('report', 10),
  updateTaskReport
);

router.route('/getreportbytaskid/:taskId').get(
  validateMongoIds('taskId'),
  getReportByTaskId
);

router.route('/chat/contacts').get(getChatContacts);

router.route('/chat/history/:contact').get(getChatHistory);

router.route('/chat/send').post(
  validateBody(apiValidators.validateChatMessage),
  sendChatMessage
);

router.route('/discussion/history/:department').get(getDiscussionHistory);

router.route('/discussion/send').post(
  validateBody(apiValidators.validateDiscussionMessage),
  createDiscussionMessage
);

router.route('/dashboard/summary').get(getDashboardSummary);

router.route('/assistant/chat').post(
  validateBody(apiValidators.validateAssistantChat),
  assistantChat
);

router.route('/search').get(globalSearch);

router.route('/notifications').get(getNotifications);

router.route('/notifications/read').post(markNotificationsRead);

router.route('/notifications/read-all').post(markAllNotificationsRead);

router.route('/activity/timeline').get(getActivityTimeline);

router.route('/bids').get(getAllBids).post(
  managers,
  validateBody(apiValidators.validateBidCreate),
  createBid
);

router.route('/bids/:bidId').patch(
  validateMongoIds('bidId'),
  managers,
  updateBid
).delete(
  validateMongoIds('bidId'),
  managers,
  deleteBid
);

router.route('/worker/dashboard').get(getWorkerDashboard);

router.post(
  '/projectMLModel',
  managers,
  validateBody(apiValidators.validateProjectMLCreate),
  createProjectMLModel
);
router.get(
  '/projectMLModel/:id',
  validateMongoIds('id'),
  getProjectMLModelById
);
router.patch(
  '/projectMLModel/:id',
  validateMongoIds('id'),
  managers,
  validateBody(apiValidators.validateProjectMLUpdate),
  updateProjectMLModelById
);

router.route('/createseminar').post(
  adminOnly,
  validateBody(apiValidators.validateSeminarCreate),
  createSeminar
);

router.route('/getallseminars').get(getAllSeminars);

router.route('/resource/update/:id').patch(
  validateMongoIds('id'),
  managers,
  validateBody(apiValidators.validateResourceUpdate),
  updateResourceById
);

router.route('/deleteresource/:id').delete(
  validateMongoIds('id'),
  managers,
  deleteResourceById
);

router.route('/newpath').post(
  managers,
  validateBody(apiValidators.validateNewPathCreate),
  createNewPath
);

router.route('/getnewpath/:id').get(
  validateMongoIds('id'),
  getNewPath
);

router.route('/getallnewpaths').get(getAllNewPaths);

router.route('/createcompletedpath').post(
  managers,
  validateBody(apiValidators.validateCompletedPathCreate),
  createCompletedPath
);

router.route('/getcompletedpathbyid/:id').get(
  validateMongoIds('id'),
  getCompletedPathById
);

router.route('/updatecompletepath/:id').patch(
  validateMongoIds('id'),
  managers,
  validateBody(apiValidators.validateCompletedPathUpdate),
  updateCompletedPath
);

router.route('/kpi/city').get(getCityKpis);
router.route('/kpi/export').get(exportKpiReport);

router.route('/workflow').get(getInterDeptRequests).post(workersAndUp, createInterDeptRequest);
router.route('/workflow/escalate').post(adminOnly, escalateOverdueRequests);
router.route('/workflow/:id').patch(workersAndUp, validateMongoIds('id'), updateInterDeptRequest);

router.route('/announcements').get(getAnnouncements).post(managers, createAnnouncement);
router.route('/announcements/:id').delete(adminOnly, validateMongoIds('id'), deleteAnnouncement);

router.route('/budget/summary').get(getBudgetSummary);
router.route('/budget/entry').post(managers, createBudgetEntry);
router.route('/budget/project/:projectId').patch(managers, validateMongoIds('projectId'), updateProjectBudgetCap);

router.route('/audit/trail').get(adminOnly, getAuditTrail);
router.route('/audit/stats').get(adminOnly, getAuditStats);

router.route('/geo/hub').get(getMapHubData);
router.route('/geo/sync-locations').post(adminOnly, syncProjectLocations);
router.route('/geo/layers').get(getGeoLayers).post(adminOnly, uploadGeoLayer);
router.route('/geo/layers/:id').delete(adminOnly, validateMongoIds('id'), deleteGeoLayer);
router.route('/geo/project/:projectId/location').patch(managers, validateMongoIds('projectId'), updateProjectLocation);

router.route('/integrations/webhooks').get(adminOnly, getWebhooks).post(adminOnly, createWebhook);
router.route('/integrations/webhooks/:id/test').post(adminOnly, validateMongoIds('id'), testWebhook);
router.route('/integrations/alert').post(managers, sendIntegrationAlert);

router.route('/ml/prefill').get(getMlPrefillData);

router.route('/seminars/:seminarId/attend').post(workersAndUp, validateMongoIds('seminarId'), markSeminarAttendance);
router.route('/seminars/:seminarId/attendance').get(validateMongoIds('seminarId'), getSeminarAttendance);
router.route('/seminars/certificates/me').get(getMySeminarCertificates);

export default router;
