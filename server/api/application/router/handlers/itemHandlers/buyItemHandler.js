const BaseHandler = require('../BaseHandler.js');
const CONFIG = require('../../../../config.js');

class BuyItemHandler extends BaseHandler {
    constructor(db) {
        super(db);
    }

    async execute(params) {
        const { token, itemId } = params;
        
        // Получаем пользователя по токену
        const user = await this.checkUserByToken(token);
        if (user.error) return user;
        
        // Получаем персонажа
        const character = await this.checkCharacterExists(user.id);
        if (character.error) return character;
        
        // проверка, существует ли предмет
        const item = await this.db.getItemById(itemId);
        if (!item) {
            return { error: 4001 };
        }
        
        // проверка, есть ли у персонажа деньги
        if (character.money < item.cost) {
            return { error: 4002 };
        }
        
        // проверка, есть ли у персонажа предмет такого же типа
        const existingItemType = await this.db.hasCharacterItemType(character.id, item.itemType);
        
        if (existingItemType) {
            switch (existingItemType.itemType) {
                // для зелей и стрел проверяем только ограничение по количеству (для зелей макс. = 3, для стрел макс. = 50)
                case "potion":
                    if (existingItemType.quantity >= CONFIG.MAX_POTIONS_PER_USER) {
                        return { error: 4005 };
                    }
                    break;
                case "arrow":
                    if (existingItemType.quantity >= CONFIG.MAX_ARROWS_PER_USER) {
                        return { error: 4005 };
                    }
                    break;
                // для остальных типов предметов - нельзя иметь больше одного предмета данного типа
                default:
                    return { error: 4003 };
            }
        }
        
        // начинаем транзакцию
        const connection = await this.db.beginTransaction();
        try {
            // списываем деньги
            const moneyUpdated = await this.db.updateCharacterMoneySubtract(character.id, item.cost);
            if (!moneyUpdated) {
                await this.db.rollback(connection);
                return { error: 4004 };
            }
            
            // если это зелье или стрела, то увеличиваем количество
            if (existingItemType && ["arrow", "potion"].includes(item.itemType)) {
                const newQuantity = existingItemType.quantity + 1;
                const itemUpdated = await this.db.updateUserItemQuantity(
                    character.id, existingItemType.itemId, newQuantity
                );
                if (!itemUpdated) {
                    await this.db.rollback(connection);
                    return { error: 4004 };
                }
            } else {
                // добавляем новый предмет в инвентарь
                const itemAdded = await this.db.addUserItem(character.id, itemId);
                if (!itemAdded) {
                    await this.db.rollback(connection);
                    return { error: 4004 };
                }
            }
            
            await this.db.commit(connection);
            return true;
        } catch (e) {
            await this.db.rollback(connection);
            return { error: 4004 };
        }
    }
}

module.exports = BuyItemHandler;