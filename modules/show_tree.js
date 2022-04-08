let tree = require('./nodetree');
let db = require('./db');

(async () => {
    let res = await db.count.page()
    console.log(res);
  // await tree.drawTree()

  process.exit()
})();
