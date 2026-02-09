const BaseManager = require('../../BaseManager.js');

class LeaveRoom extends BaseManager {
    constructor(db) {
        super(db);
    }
    
    async execute(params) {
        if (!params.token) {
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
        
        const roomMember = await this.db.getRoomMemberByUserId(user.id);
        if (!roomMember) {
            return { error: 2006 };
        }
        
        const room = await this.db.getRoomById(roomMember.roomId);
        if (!room) {
            return { error: 2003 };
        }
        
        const userTypeInRoom = await this.db.getUserTypeInRoom(user.id);
        
        if (userTypeInRoom.type === 'owner') {
            if (room.status === 'started') {
                await this.db.deleteAllBotsForRoom(roomMember.roomId);
                await this.db.deleteAllArrowsForRoom(roomMember.roomId);
            }
            
            await this.db.deleteAllRoomMembers(roomMember.roomId);
            await this.db.deleteRoom(roomMember.roomId);
            
        } else {
            await this.db.leaveParticipantFromRoom(user.id);
            
            if (room.status !== 'started') {
                await this.db.updateRoomStatus(roomMember.roomId, 'open');
            }
        }
        
        await this.db.updateRoomHash(this.md5(Math.random().toString()));
        
        return true;
    }
}

module.exports = LeaveRoom;