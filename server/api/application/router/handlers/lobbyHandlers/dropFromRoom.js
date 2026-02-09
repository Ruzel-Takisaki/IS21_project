const BaseManager = require('../../BaseManager.js');

class DropFromRoom extends BaseManager {
    constructor(db) {
        super(db);
    }
    
    async execute(params) {
        if (!params.token || !params.targetToken) {
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
        
        const roomMember = await this.checkUserIsRoomOwner(user.id);
        if (roomMember.error) {
            return roomMember;
        }
        
        const targetUser = await this.db.getUserByToken(params.targetToken);
        if (!targetUser) {
            return { error: 705 };
        }
        
        if (user.id === targetUser.id) {
            return { error: 2007 };
        }
        
        const targetRoomMember = await this.db.getRoomMemberByUserId(targetUser.id);
        
        if (!targetRoomMember || targetRoomMember.roomId !== roomMember.roomId) {
            return { error: 2009 };
        }
        
        await this.db.leaveParticipantFromRoom(targetUser.id);
        
        await this.db.updateRoomStatus(roomMember.roomId, 'open');

        await this.db.updateRoomHash(this.md5(Math.random().toString()));
        
        return true;
    }
}

module.exports = DropFromRoom;