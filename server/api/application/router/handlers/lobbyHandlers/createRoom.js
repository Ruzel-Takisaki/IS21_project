const BaseManager = require('../../BaseManager.js');
const CONFIG = require('../../../../config.js');

class CreateRoom extends BaseManager {
    constructor(db) {
        super(db);
    }
    
    async execute(params) {
        if (!params.token || !params.roomName || !params.roomSize) {
            return { error: 242 };
        }
        
        const user = await this.db.getUserByToken(params.token);
        if (!user) {
            return { error: 705 };
        }
        
        const userCheck = await this.checkUserExists(user.id);
        if (userCheck.error) {
            return userCheck;
        }

        const character = await this.checkCharacterExists(user.id);
        if (character.error) {
            return character;
        }
        
        const isPlaying = await this.db.isUserPlaying(user.id);
        if (isPlaying) {
            return { error: 2001 };
        }
        
        const roomSize = parseInt(params.roomSize);
        
        if (roomSize < CONFIG.ROOM_MIN_SIZE || roomSize > CONFIG.ROOM_MAX_SIZE) {
            return { error: 2013 };
        }
        
        const userTypeInRoom = await this.db.getUserTypeInRoom(user.id);
        
        if (userTypeInRoom && userTypeInRoom.type === 'owner') {
            return { error: 2002 };
        }
        
        if (userTypeInRoom && userTypeInRoom.type === 'participant') {
            await this.db.leaveParticipantFromRoom(user.id);
        }
        
        const roomId = await this.db.createRoom(user.id, params.roomName, roomSize);
        
        if (roomSize === 1) {
            await this.db.updateRoomStatus(roomId, 'closed');
        }
        
        await this.db.updateRoomHash(this.md5(Math.random().toString()));
        
        return true;
    }
}

module.exports = CreateRoom;