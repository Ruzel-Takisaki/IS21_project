const BaseHandler = require('../BaseHandler.js');

class GetUserInfoHandler extends BaseHandler {
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
        if (!user) {
            return { error: 705 };
        }
        
        // Проверка существования пользака
        const userCheck = await this.checkUserExists(user.id);
        if (userCheck.error) {
            return userCheck;
        }

        // Проверка существования персонажа у пользака
        const character = await this.checkCharacterExists(user.id);
        if (character.error) {
            return character;
        }

        // Получение информации о классах и шмотках пользака
        const selectedClass = await this.db.getUserSelectedClassId(user.id);
        const purchasedClasses = await this.db.getUserPurchasedClassIds(user.id);
        const purchasedItems = await this.db.getUserPurchasedItemsWithQuantity(character.id);

        return {
            characterId: character.id,
            userId: user.id,
            login: user.login,
            nickname: user.nickname,
            money: character.money,
            selectedClass: selectedClass,
            purchasedClasses: purchasedClasses,
            purchasedItems: purchasedItems
        };
    }
}

module.exports = GetUserInfoHandler;