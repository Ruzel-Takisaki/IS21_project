const BaseHandler = require('../BaseHandler.js');

class UsePotionHandler extends BaseHandler {
    constructor(db) {
        super(db);
    }

    async execute(params) {
        const { token } = params; 
        
        // Получаем пользователя по токену
        const user = await this.checkUserByToken(token);
        if (user.error) return user;
        
        // Получаем персонажа
        const character = await this.checkCharacterExists(user.id);
        if (character.error) return character;
        
        // проверка наличия зелий
        const hasPotion = await this.db.hasCharacterPotion(character.id);
        if (!hasPotion) {
            return { error: 4010 };
        }

        // используем зелье
        return await this.usePotion(character.id);
    }
}

module.exports = UsePotionHandler;