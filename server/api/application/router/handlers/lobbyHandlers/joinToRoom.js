const BaseManager = require('../../BaseManager.js');

class JoinToRoom extends BaseManager {
    constructor(db) {
        super(db);
    }
    
    async isUserPlaying(userId) {
        const character = await this.db.getCharacterByUserId(userId);
        if (!character) return false;
        
        const result = await this.db.query(
            "SELECT id FROM room_members WHERE character_id = ? AND status = 'started'", 
            [character.id]
        );
        return result !== null;
    }
    
    async getUserTypeInRoom(userId) {
        const character = await this.db.getCharacterByUserId(userId);
        if (!character) return false;
        
        const result = await this.db.query(
            "SELECT type, room_id as roomId FROM room_members WHERE character_id=?", 
            [character.id]
        );
        return result ? result.type : false;
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
    
    async getRoomById(roomId) {
        return await this.db.query(
            "SELECT id, status, name, room_size FROM rooms WHERE id=?", 
            [roomId]
        );
    }
    
    async getAllRoomMembers(roomId) {
        return await this.db.queryAll(
            "SELECT * FROM room_members WHERE room_id=?", 
            [roomId]
        );
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
        
        const room = await this.getRoomById(roomId);
        if (!room) {
            return { error: 2003 };
        }
        
        if (room.status !== 'open') {
            return { error: 2005 };
        }
        
        if (await this.isUserPlaying(user.id)) {
            return { error: 2001 };
        }
        
        const userType = await this.getUserTypeInRoom(user.id);
        
        if (userType === 'owner') {
            return { error: 2002 };
        }
        
        if (userType === 'participant') {
            const currentRoomMember = await this.db.getRoomMemberByUserId(user.id);
            if (currentRoomMember && currentRoomMember.roomId === roomId) {
                return { error: 2004 };
            }
            await this.leaveParticipantFromRoom(user.id);
        }
        
        await this.db.execute(
            "INSERT INTO room_members (room_id, character_id, type, status) VALUES (?, ?, ?, ?)",
            [roomId, character.id, 'participant', 'ready']
        );
        
        const roomMembers = await this.getAllRoomMembers(roomId);
        if (roomMembers.length >= room.room_size) {
            await this.db.execute(
                "UPDATE rooms SET status=? WHERE id=?", 
                ['closed', roomId]
            );
        }
        
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

module.exports = JoinToRoom;