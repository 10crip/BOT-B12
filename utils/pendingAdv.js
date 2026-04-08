const pendingAdvMap = new Map();

function createPendingAdv(key, data) {
    pendingAdvMap.set(key, data);
}

function getPendingAdv(key) {
    return pendingAdvMap.get(key) || null;
}

function deletePendingAdv(key) {
    pendingAdvMap.delete(key);
}

module.exports = {
    createPendingAdv,
    getPendingAdv,
    deletePendingAdv
};
