const BaseHandler = require('../BaseHandler.js');

class LogoutHandler extends BaseHandler {
    constructor(db) {
        super(db);
    }
    
    async execute(params) {
        // Проверка наличия всех необходимых параметров
        if (!params.token) {
            return { error: 242 };
        }
        
        // Получение пользака по токену
        const user = await this.db.getUserByToken(params.token);
        if (user) {
            // Обнуление токена
            await this.db.updateToken(user.id, null);
            return true;
        }
        return { error: 1003 };
    }
}

module.exports = LogoutHandler;