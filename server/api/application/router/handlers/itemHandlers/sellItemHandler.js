const BaseHandler = require('../BaseHandler.js');

class SellItemHandler extends BaseHandler {
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
        
        // проверка, есть ли предмет в инвентаре
        const userItem = await this.db.getUserItem(character.id, item.id);
        if (!userItem) {
            return { error: 4006 };
        }
        
        const sellPrice = Math.round(item.cost);

        // начинаем транзакцию
        const connection = await this.db.beginTransaction();
        try {
            // уменьшаем количество расходников или удаляем предмет
            if (['potion', 'arrow'].includes(item.itemType) && userItem.quantity > 1) {
                // уменьшяем количество расходников
                const itemUpdated = await this.db.updateUserItemQuantity(
                    character.id, itemId, userItem.quantity - 1
                );
                if (!itemUpdated) {
                    await this.db.rollback(connection);
                    return { error: 4007 };
                }
            } else {
                // удаляем предмет
                const itemDeleted = await this.db.deleteUserItem(character.id, itemId);
                if (!itemDeleted) {
                    await this.db.rollback(connection);
                    return { error: 4007 };
                }
            }
            
            // записываем деньги
            const moneyUpdated = await this.db.updateCharacterMoneyAdd(character.id, sellPrice);
            if (!moneyUpdated) {
                await this.db.rollback(connection);
                return { error: 4007 };
            }
            
            await this.db.commit(connection);
            return true;
        } catch (e) {
            await this.db.rollback(connection);
            return { error: 4007 };
        }
    }
}

module.exports = SellItemHandler;