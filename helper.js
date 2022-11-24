/**
 * This file contains some generic helper methods needed elsewhere
 */
export function checkSuccess(response) {
    if (response?.code !== 'SUCCESS') {
        return false;
    }
    return true;
}
