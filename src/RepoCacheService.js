import axios from "axios";

//const repoCacheApiBaseUrl = "/api/repoCaching/v1/";
const repoCacheApiBaseUrl = "https://middleware-repocacheapis-mw.apps.nprdc-ocp.dhdigital.co.in/api/repoCaching/v1/"

class RepoCacheService {

  getProject() {
    return axios.get(`${repoCacheApiBaseUrl}GetProject`);
  }

  addProjectData(newProjectData) {
    return axios.post(`${repoCacheApiBaseUrl}AddProject`, newProjectData);
  }

  updateProject(updatedProjectData) {
    return axios.put(
      `${repoCacheApiBaseUrl}UpdateProject`,
      updatedProjectData
    );
  }

  deleteProject(projectCode) {
    return axios.delete(
      `${repoCacheApiBaseUrl}DeleteProject?projectCode=${projectCode}`
    );
  }

  getProcess() {
    return axios.get(`${repoCacheApiBaseUrl}GetProcess`);
  }

  updateProcess(updatedProcesData) {
    return axios.put(
      `${repoCacheApiBaseUrl}UpdateProcess`,
      updatedProcesData
    );
  }

  addProcessData(newProcessData) {
    return axios.post(`${repoCacheApiBaseUrl}AddProcess`, newProcessData);
  }

  deleteProcess(projectCode, processCode) {
    const queryParameters = [
      projectCode ? `projectCode=${projectCode}` : null,
      processCode ? `processCode=${processCode}` : null,
    ]
      .filter((param) => param !== null)
      .join("&");

    return axios.delete(
      `${repoCacheApiBaseUrl}DeleteProcess?${queryParameters}`
    );
  }

  getParams(processId, paramCode) {
    const queryParameters = [
      paramCode ? `paramCode=${paramCode}` : null,
      processId ? `processId=${processId}` : null,
    ]
      .filter((param) => param !== null)
      .join("&");

    return axios.get(
      `${repoCacheApiBaseUrl}GetProcessParams?${queryParameters}`
    );
  }

  addParams(newData) {
    return axios.post(`${repoCacheApiBaseUrl}AddProcessParams`, newData);
  }

  updateParams(updatedData) {
    return axios.put(
      `${repoCacheApiBaseUrl}UpdateProcessParams`,
      updatedData
    );
  }

  deleteParams(processId, paramCode) {
    const queryParameters = [
      processId ? `processId=${processId}` : null,
      paramCode ? `paramCode=${paramCode}` : null,
    ]
      .filter((param) => param !== null)
      .join("&");
    return axios.delete(
      `${repoCacheApiBaseUrl}DeleteProcessParams?${queryParameters}`
    );
  }
}

const repoCacheServiceInstance = new RepoCacheService();

export default repoCacheServiceInstance;