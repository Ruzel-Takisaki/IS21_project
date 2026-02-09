const BaseManager = require('../../BaseManager.js');

class JoinToRoom extends BaseManager {
    constructor(db) {
        super(db);
    }
    
    async execute(params) {
        if (!params.token || !params.roomId) {
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
        
        const roomId = parseInt(params.roomId);
        
        const room = await this.db.getRoomById(roomId);
        if (!room) {
            return { error: 2003 };
        }
        
        if (room.status !== 'open') {
            return { error: 2005 };
        }
        
        const isPlaying = await this.db.isUserPlaying(user.id);
        if (isPlaying) {
            return { error: 2001 };
        }
        
        const userTypeInRoom = await this.db.getUserTypeInRoom(user.id);
        
        if (userTypeInRoom && userTypeInRoom.type === 'owner') {
            return { error: 2002 };
        }
        
        if (userTypeInRoom && userTypeInRoom.type === 'participant') {
            if (userTypeInRoom.roomId === roomId) {
                return { error: 2004 };
            }
            await this.db.leaveParticipantFromRoom(user.id);
        }
        
        await this.db.addRoomMember(roomId, character.id, 'participant');
        
        const roomMembers = await this.db.getAllRoomMembers(roomId);
        if (roomMembers.length >= room.room_size) {
            await this.db.updateRoomStatus(roomId, 'closed');
        }
        
        await this.db.updateRoomHash(this.md5(Math.random().toString()));
        
        return true;
    }
}

module.exports = JoinToRoom;