const BaseManager = require('../../BaseManager.js');

class DropFromRoom extends BaseManager {
    constructor(db) {
        super(db);
    }
    
    async execute(params) {
        // Проверка наличия всех необходимых параметров
        if (!params.token || !params.targetToken) {
            return { error: 242 };
        }
        
        // Получение пользователя по токену (инициатор исключения)
        const user = await this.db.getUserByToken(params.token);
        if (!user) {
            return { error: 705 };
        }
        
        // Проверка существования пользователя
        const userCheck = await this.checkUserExists(user.id);
        if (userCheck.error) {
            return userCheck;
        }

        // Проверка существования персонажа у пользователя
        const character = await this.checkCharacterExists(user.id);
        if (character.error) {
            return character;
        }
        
        // Проверка, является ли пользователь владельцем комнаты
        const roomMember = await this.checkUserIsRoomOwner(user.id);
        if (roomMember.error) {
            return roomMember;
        }
        
        // Получение целевого пользователя по токену (кого исключают)
        const targetUser = await this.db.getUserByToken(params.targetToken);
        if (!targetUser) {
            return { error: 705 };
        }
        
        // Проверка, не пытается ли пользователь исключить самого себя
        if (user.id === targetUser.id) {
            return { error: 2007 };
        }
        
        // Получение информации о членстве целевого пользователя в комнате
        const targetRoomMember = await this.db.getRoomMemberByUserId(targetUser.id);
        
        // Проверка, находится ли целевой пользователь в той же комнате
        if (!targetRoomMember || targetRoomMember.roomId !== roomMember.roomId) {
            return { error: 2009 };
        }
        
        // Исключение целевого пользователя из комнаты
        await this.db.leaveParticipantFromRoom(targetUser.id);
        
        // Открытие комнаты для новых участников после исключения
        await this.db.updateRoomStatus(roomMember.roomId, 'open');

        // Обновление хеша комнаты для синхронизации клиентов
        await this.db.updateRoomHash(this.md5(Math.random().toString()));
        
        return true;
    }
}

module.exports = DropFromRoom;