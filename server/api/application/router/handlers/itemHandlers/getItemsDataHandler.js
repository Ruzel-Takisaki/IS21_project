const BaseHandler = require('../BaseHandler.js');

class GetItemsDataHandler extends BaseHandler {
    constructor(db) {
        super(db);
    }

    async execute() {
        return this.db.getAllItemsData();
    }
}

module.exports = GetItemsDataHandler;