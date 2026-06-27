let appIo = null;

export const setAppIo = (io) => {
  appIo = io;
};

export const getAppIo = () => appIo;

export const emitWorkspaceEvent = (event, payload) => {
  if (!appIo) return;
  appIo.emit(event, payload);
};

export const emitToUser = (userId, event, payload) => {
  if (!appIo || !userId) return;
  appIo.to(`user:${userId}`).emit(event, payload);
};

export const emitToDepartment = (department, event, payload) => {
  if (!appIo || !department) return;
  appIo.to(department).emit(event, payload);
};

export const emitToProject = (projectId, event, payload) => {
  if (!appIo || !projectId) return;
  appIo.to(`project:${projectId}`).emit(event, payload);
};
