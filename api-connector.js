/**
 * This file contains all methods needed for communicating with the Ghostinspector API
 */
import axios from 'axios';
import { settings } from './settings-service.js';

export function getTests() {
    return axios.get(`${settings.ghostinspector.base_url}/tests/?apiKey=${settings.ghostinspector.api_key}`);
}

export function getOrganization() {
    return axios.get(`${settings.ghostinspector.base_url}/organizations/${settings.ghostinspector.organization_id}/?apiKey=${settings.ghostinspector.api_key}`);
}

export function getLastSuiteResult(suite_id) {
    return axios.get(`${settings.ghostinspector.base_url}/suites/${suite_id}/results/?apiKey=${settings.ghostinspector.api_key}&count=1`);
}

export function getFolders() {
    return axios.get(`${settings.ghostinspector.base_url}/folders/?apiKey=${settings.ghostinspector.api_key}`);
}

export function getSuitesInFolder(folder_id) {
    return axios.get(`${settings.ghostinspector.base_url}/folders/${folder_id}/suites/?apiKey=${settings.ghostinspector.api_key}`);
}

export function getTestsInSuite(suite_id) {
    return axios.get(`${settings.ghostinspector.base_url}/suites/${suite_id}/tests/?apiKey=${settings.ghostinspector.api_key}`);
}

export function getLastTestResult(test_id) {
    return axios.get(`${settings.ghostinspector.base_url}/tests/${test_id}/results/?apiKey=${settings.ghostinspector.api_key}&count=1`);
}
 