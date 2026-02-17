const BaseHandler = require('../BaseHandler.js');

class DeleteUserHandler extends BaseHandler {
    constructor(db) {
        super(db);
    }
    
    async execute(params) {
        // Проверка наличия всех необходимых параметров
        if (!params.token) {
            return { error: 242 };
        }
        
        // Получение пользователя по токену
        const user = await this.db.getUserByToken(params.token);
        if (!user) {
            return { error: 705 };
        }
        
         // Удаление перса и связанных данных
        const character = await this.db.getCharacterByUserId(user.id);
        if (character) {
            const characterId = character.id;
            
            await this.db.deleteAllCharacterItems(characterId);
            await this.db.deleteAllCharacterClasses(characterId);
            await this.db.deleteCharacter(user.id);
        }
        
        // Удаление сообщений пользака
        await this.db.deleteUserMessages(user.id);
        
         // Удаление пользака из бд
        const success = await this.db.deleteUser(user.id);
        if (success) {
            return true;
        }
        return { error: 2012 };
    }
}

module.exports = DeleteUserHandler;