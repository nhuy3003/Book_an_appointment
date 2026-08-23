const blacklist = new Set();

const addToken = (token) => {
    blacklist.add(token);
};

const hasToken = (token) => {
    return blacklist.has(token);
};

module.exports = {
    addToken,
    hasToken,
};