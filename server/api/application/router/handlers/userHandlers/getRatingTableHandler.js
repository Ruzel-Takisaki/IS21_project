const BaseHandler = require('../BaseHandler.js');

class GetRatingTableHandler extends BaseHandler {
    constructor(db) {
        super(db);
    }
    
    async execute(params) {
        // Проверка наличия всех необходимых параметров
        if (!params.token) {
            return { error: 242 };
        }
        
        // Получение пользака по токенуи
        const user = await this.db.getUserByToken(params.token);
        if (!user) {
            return { error: 705 };
        }
        
        // Получение таблицы рейтинга
        const ratingTable = await this.db.getRatingTable();
        return ratingTable;
    }
}

module.exports = GetRatingTableHandler;