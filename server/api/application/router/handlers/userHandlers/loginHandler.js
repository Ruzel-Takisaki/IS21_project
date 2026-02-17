const BaseHandler = require('../BaseHandler.js');

class LoginHandler extends BaseHandler {
    constructor(db) {
        super(db);
    }
    
    async execute(params) {
        // Проверка наличия всех необходимых параметров
        if (!params.login || !params.passwordHash) {
            return { error: 242 };
        }
        
        // Получение пользака по логину
        const user = await this.db.getUserByLogin(params.login);
        if (user) {
            if (params.passwordHash === user.password) {
                const token = this.md5(Math.random().toString());
                await this.db.updateToken(user.id, token);
                return {
                    id: user.id,
                    nickname: user.nickname,
                    token: token
                };
            }
            return { error: 1002 };
        }
        return { error: 1005 };
    }
    
    // Доп функция для создания хеша
    md5(input) {
        const crypto = require('crypto');
        return crypto.createHash('md5').update(input).digest('hex');
    }
}

module.exports = LoginHandler;