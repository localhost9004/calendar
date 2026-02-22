require('dotenv').config();
const { refreshContests } = require('./contest-fetchers');

(async () => {
    await refreshContests();
})();
