const BaseHandler = require('../BaseHandler.js');

class UseArrowHandler extends BaseHandler {
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
        
        // проверка наличия лука
        const hasBow = await this.db.hasCharacterWeaponType(character.id, 'bow');
        if (!hasBow) {
            return { error: 4008 };
        }

        // проверка наличия стрел
        const hasArrows = await this.db.hasCharacterArrows(character.id);
        if (!hasArrows) {
            return { error: 4009 };
        }

        // используем стрелу
        return await this.useArrow(character.id);
    }
}

module.exports = UseArrowHandler;