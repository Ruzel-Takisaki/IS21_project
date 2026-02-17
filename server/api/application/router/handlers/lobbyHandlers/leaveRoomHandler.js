const BaseManager = require('../../BaseManager.js');

class LeaveRoom extends BaseManager {
    constructor(db) {
        super(db);
    }
    
    async execute(params) {
        // Проверка наличия токена
        if (!params.token) {
            return { error: 242 };
        }
        
        // Получение пользователя по токену
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
        
        // Получение информации о членстве пользователя в комнате
        const roomMember = await this.db.getRoomMemberByUserId(user.id);
        if (!roomMember) {
            return { error: 2006 };
        }
        
        // Получение информации о комнате
        const room = await this.db.getRoomById(roomMember.roomId);
        if (!room) {
            return { error: 2003 };
        }
        
        // Получение типа пользователя в комнате
        const userTypeInRoom = await this.db.getUserTypeInRoom(user.id);
        
        // Проверка, является ли пользователь владельцем комнаты
        if (userTypeInRoom.type === 'owner') {
            // Если игра уже началась, удаляем ботов и стрелы
            if (room.status === 'started') {
                await this.db.deleteAllBotsForRoom(roomMember.roomId);
                await this.db.deleteAllArrowsForRoom(roomMember.roomId);
            }
            
            // Удаление всех участников комнаты и самой комнаты
            await this.db.deleteAllRoomMembers(roomMember.roomId);
            await this.db.deleteRoom(roomMember.roomId);
            
        } else {
            // Если пользователь участник, просто удаляем его из комнаты
            await this.db.leaveParticipantFromRoom(user.id);
            
            // Если игра еще не началась, открываем комнату для новых участников
            if (room.status !== 'started') {
                await this.db.updateRoomStatus(roomMember.roomId, 'open');
            }
        }
        
        // Обновление хеша комнаты для синхронизации клиентов
        await this.db.updateRoomHash(this.md5(Math.random().toString()));
        
        return true;
    }
}

module.exports = LeaveRoom;