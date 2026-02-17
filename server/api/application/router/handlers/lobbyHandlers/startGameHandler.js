const BaseManager = require('../../BaseManager.js');

class StartGame extends BaseManager {
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
        
        // Проверка, является ли пользователь владельцем комнаты
        const roomMember = await this.checkUserIsRoomOwner(user.id);
        if (roomMember.error) {
            return roomMember;
        }
        
        // Получение информации о комнате
        const room = await this.db.getRoomById(roomMember.roomId);
        if (!room) {
            return { error: 2003 };
        }
        
        // Проверка, закрыта ли комната (все участники на месте)
        if (room.status !== 'closed') {
            return { error: 2015 };
        }
        
        // Получение всех участников комнаты
        const roomMembers = await this.db.getAllRoomMembers(roomMember.roomId);
        
        // Подсчет готовых игроков
        let readyPlayers = 0;
        for (const member of roomMembers) {
            if (member.status === 'ready') {
                readyPlayers++;
            }
        }
        
        // Проверка, все ли участники готовы
        if (readyPlayers !== room.room_size) {
            return { error: 2012 };
        }
        
        // Начало игры: обновление статуса комнаты и участников
        await this.db.updateRoomStatus(roomMember.roomId, 'started');
        await this.db.updateAllRoomMembersStatus(roomMember.roomId, 'started');
        
        // Создание начальных ботов для комнаты
        await this.db.createInitialBotsForRoom(roomMember.roomId);
        
        // Создание начальных стрел для комнаты
        await this.db.createInitialArrowsForRoom(roomMember.roomId);
        
        // Обновление хеша комнаты для синхронизации клиентов
        await this.db.updateRoomHash(this.md5(Math.random().toString()));
        
        return true;
    }
}

module.exports = StartGame;