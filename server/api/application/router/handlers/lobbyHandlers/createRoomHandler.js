const BaseManager = require('../../BaseManager.js');
const CONFIG = require('../../../../config.js');

class CreateRoom extends BaseManager {
    constructor(db) {
        super(db);
    }
    
    async execute(params) {
        // Проверка наличия всех необходимых параметров
        if (!params.token || !params.roomName || !params.roomSize) {
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
        
        // Проверка, играет ли пользователь в данный момент
        const isPlaying = await this.db.isUserPlaying(user.id);
        if (isPlaying) {
            return { error: 2001 };
        }
        
        // Преобразование размера комнаты в число
        const roomSize = parseInt(params.roomSize);
        
        // Проверка допустимости размера комнаты
        if (roomSize < CONFIG.ROOM_MIN_SIZE || roomSize > CONFIG.ROOM_MAX_SIZE) {
            return { error: 2013 };
        }
        
        // Получение информации о типе пользователя в комнате (если есть)
        const userTypeInRoom = await this.db.getUserTypeInRoom(user.id);
        
        // Проверка, является ли пользователь уже владельцем комнаты
        if (userTypeInRoom && userTypeInRoom.type === 'owner') {
            return { error: 2002 };
        }
        
        // Если пользователь является участником другой комнаты, выходим из нее
        if (userTypeInRoom && userTypeInRoom.type === 'participant') {
            await this.db.leaveParticipantFromRoom(user.id);
        }
        
        // Создание новой комнаты
        const roomId = await this.db.createRoom(user.id, params.roomName, roomSize);
        
        // Если размер комнаты равен 1, автоматически закрываем ее
        if (roomSize === 1) {
            await this.db.updateRoomStatus(roomId, 'closed');
        }
        
        // Обновление хеша комнаты для синхронизации клиентов
        await this.db.updateRoomHash(this.md5(Math.random().toString()));
        
        return true;
    }
}

module.exports = CreateRoom;