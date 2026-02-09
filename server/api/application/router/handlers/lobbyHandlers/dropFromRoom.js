const BaseManager = require('../../BaseManager.js');

class DropFromRoom extends BaseManager {
    constructor(db) {
        super(db);
    }
    
    async leaveParticipantFromRoom(userId) {
        const character = await this.db.getCharacterByUserId(userId);
        if (!character) return false;
        
        await this.db.execute(
            "DELETE FROM room_members WHERE character_id=?", 
            [character.id]
        );
        return true;
    }
    
    async getRoomMemberByUserId(userId) {
        const character = await this.db.getCharacterByUserId(userId);
        if (!character) return null;
        
        return await this.db.query(
            "SELECT id, room_id as roomId, character_id as characterId, type, status, data FROM room_members WHERE character_id=?", 
            [character.id]
        );
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
        
        const targetRoomMember = await this.getRoomMemberByUserId(targetUser.id);
        
        if (!targetRoomMember || targetRoomMember.roomId !== roomMember.roomId) {
            return { error: 2009 };
        }
        
        await this.leaveParticipantFromRoom(targetUser.id);
        
        await this.db.execute(
            "UPDATE rooms SET status=? WHERE id=?", 
            ['open', roomMember.roomId]
        );

        await this.db.execute(
            "UPDATE hashes SET room_hash = ? WHERE id = 1",
            [this.md5(Math.random().toString())]
        );
        
        return true;
    }
    
    md5(input) {
        const crypto = require('crypto');
        return crypto.createHash('md5').update(input).digest('hex');
    }
}

module.exports = DropFromRoom;