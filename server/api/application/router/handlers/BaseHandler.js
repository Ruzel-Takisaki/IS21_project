class BaseHandler {
    constructor(db) {
        this.db = db;
    }

    // Проверка пользователя по токену
    async checkUserByToken(token) {
        const user = await this.db.getUserByToken(token);
        if (!user) {
            return { error: 705 };
        }
        return user;
    }
    
    // Проверка существования пользователя по ID
    async checkUserExists(userId) {
        const user = await this.db.getUserById(userId);
        if (!user) {
            return { error: 705 };
        }
        return user;
    }

    // Проверка существования персонажа у пользователя
    async checkCharacterExists(userId) {
        const character = await this.db.getCharacterByUserId(userId);
        if (!character) {
            return { error: 706 };
        }
        return character;
    }

    
    // Проверка, что пользователь является владельцем комнаты
    async checkUserIsRoomOwner(userId) {
        const roomMember = await this.db.getRoomMemberByUserId(userId);
        
        // Проверка, что пользователь в комнате и является владельцем
        if (!roomMember || roomMember.type !== 'owner') {
            return { error: 2010 };
        }
        
        return roomMember;
    }

    // Проверка, что комната имеет статус "started"
    async checkRoomIsStarted(roomId) {
        const room = await this.db.getRoomById(roomId);
        
        // Проверка существования комнаты и её статуса
        if (!room || room.status !== 'started') {
            return { error: 2011 };
        }
        
        return room;
    }

    // Проверка, что пользователь находится в комнате
    async checkUserInRoom(userId) {
        const roomMember = await this.db.getRoomMemberByUserId(userId);
        
        if (!roomMember) {
            return { error: 2006 };
        }
        
        return roomMember;
    }
    

    async useArrow(characterId) {
         //получаем запись о расходнике
        const consumable = await this.db.getCharacterConsumable(characterId, "arrow");
        //обрабатываем в зависимости от количества
        if (consumable.quantity > 1) {
            //уменьшаем количество на 1
            const newQuantity = consumable.quantity - 1;
            await this.db.updateUserItemQuantity(characterId, consumable.itemId, newQuantity);
        } else {
            //последний предмет - удаляем
            await this.db.deleteUserItem(characterId, consumable.itemId);
        }
        return true;
    }

    async usePotion(characterId) {
         //получаем запись о расходнике
        const consumable = await this.db.getCharacterConsumable(characterId, "potion");
        
        //обрабатываем в зависимости от количества
        if (consumable.quantity > 1) {
            //уменьшаем количество на 1
            const newQuantity = consumable.quantity - 1;
            await this.db.updateUserItemQuantity(characterId, consumable.itemId, newQuantity);
        } else {
            //последний предмет - удаляем
            await this.db.deleteUserItem(characterId, consumable.itemId);
        }
        return true;
    }
}

module.exports = BaseHandler;