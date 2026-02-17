const BaseManager = require('../../BaseManager.js');

class JoinToRoom extends BaseManager {
    constructor(db) {
        super(db);
    }
    
    async execute(params) {
        // Проверка наличия всех необходимых параметров
        if (!params.token || !params.roomId) {
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
        
        // Преобразование ID комнаты в число
        const roomId = parseInt(params.roomId);
        
        // Получение информации о комнате
        const room = await this.db.getRoomById(roomId);
        if (!room) {
            return { error: 2003 };
        }
        
        // Проверка, открыта ли комната для присоединения
        if (room.status !== 'open') {
            return { error: 2005 };
        }
        
        // Проверка, играет ли пользователь в данный момент
        const isPlaying = await this.db.isUserPlaying(user.id);
        if (isPlaying) {
            return { error: 2001 };
        }
        
        // Получение информации о типе пользователя в комнате (если есть)
        const userTypeInRoom = await this.db.getUserTypeInRoom(user.id);
        
        // Проверка, является ли пользователь уже владельцем комнаты
        if (userTypeInRoom && userTypeInRoom.type === 'owner') {
            return { error: 2002 };
        }
        
        // Проверка, находится ли пользователь уже в этой комнате
        if (userTypeInRoom && userTypeInRoom.type === 'participant') {
            if (userTypeInRoom.roomId === roomId) {
                return { error: 2004 };
            }
            // Если пользователь в другой комнате, выходим из нее
            await this.db.leaveParticipantFromRoom(user.id);
        }
        
        // Добавление пользователя в комнату как участника
        await this.db.addRoomMember(roomId, character.id, 'participant');
        
        // Получение всех участников комнаты
        const roomMembers = await this.db.getAllRoomMembers(roomId);
        
        // Проверка, заполнена ли комната
        if (roomMembers.length >= room.room_size) {
            // Если комната заполнена, закрываем ее
            await this.db.updateRoomStatus(roomId, 'closed');
        }
        
        // Обновление хеша комнаты для синхронизации клиентов
        await this.db.updateRoomHash(this.md5(Math.random().toString()));
        
        return true;
    }
}

module.exports = JoinToRoom;