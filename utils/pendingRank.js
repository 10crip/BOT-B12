const pendingRankMap = new Map();

function createPendingRank(key, data) {
    pendingRankMap.set(key, data);
}

function getPendingRank(key) {
    return pendingRankMap.get(key) || null;
}

function deletePendingRank(key) {
    pendingRankMap.delete(key);
}

module.exports = {
    createPendingRank,
    getPendingRank,
    deletePendingRank
};
