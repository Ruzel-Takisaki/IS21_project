const BaseManager = require('../../BaseManager.js');

class LeaveRoom extends BaseManager {
    constructor(db) {
        super(db);
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
    
    async deleteAllRoomMembers(roomId) {
        await this.db.execute(
            "DELETE FROM room_members WHERE room_id=?", 
            [roomId]
        );
    }
    
    async deleteRoom(roomId) {
        await this.db.execute(
            "DELETE FROM rooms WHERE id=?", 
            [roomId]
        );
    }
    
    async deleteAllBotsForRoom(roomId) {
        await this.db.execute(
            "DELETE FROM bots_rooms WHERE room_id = ?", 
            [roomId]
        );
    }
    
    async deleteAllArrowsForRoom(roomId) {
        await this.db.execute(
            "DELETE FROM arrows WHERE room_id = ?", 
            [roomId]
        );
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
        
        const roomMember = await this.getRoomMemberByUserId(user.id);
        if (!roomMember) {
            return { error: 2006 };
        }
        
        const room = await this.getRoomById(roomMember.roomId);
        if (!room) {
            return { error: 2003 };
        }
        
        const userType = await this.getUserTypeInRoom(user.id);
        
        if (userType === 'owner') {

            if (room.status === 'started') {
                await this.deleteAllBotsForRoom(roomMember.roomId);
                await this.deleteAllArrowsForRoom(roomMember.roomId);
            }
            
            await this.deleteAllRoomMembers(roomMember.roomId);
            await this.deleteRoom(roomMember.roomId);
            
        } else {
            await this.leaveParticipantFromRoom(user.id);
            
            if (room.status !== 'started') {
                await this.db.execute(
                    "UPDATE rooms SET status=? WHERE id=?", 
                    ['open', roomMember.roomId]
                );
            }
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

module.exports = LeaveRoom;