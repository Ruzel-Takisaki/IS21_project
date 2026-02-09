const BaseManager = require('../../BaseManager.js');
const CONFIG = require('../../../../config.js');

class CreateRoom extends BaseManager {
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
    
    async createRoom(userId, roomName, roomSize) {
        const character = await this.db.getCharacterByUserId(userId);
        if (!character) return false;
        
        const result = await this.db.execute(
            "INSERT INTO rooms (name, room_size) VALUES (?, ?)", 
            [roomName, roomSize]
        );
        const roomId = result.insertId;
        
        await this.db.execute(
            "INSERT INTO room_members (room_id, character_id, type, status) VALUES (?, ?, ?, ?)",
            [roomId, character.id, 'owner', 'ready']
        );
        return roomId;
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
        
        if (await this.isUserPlaying(user.id)) {
            return { error: 2001 };
        }
        
        const roomSize = parseInt(params.roomSize);
        
        if (roomSize < CONFIG.ROOM_MIN_SIZE || roomSize > CONFIG.ROOM_MAX_SIZE) {
            return { error: 2013 };
        }
        
        const userType = await this.getUserTypeInRoom(user.id);
        
        if (userType === 'owner') {
            return { error: 2002 };
        }
        
        if (userType === 'participant') {
            await this.leaveParticipantFromRoom(user.id);
        }
        
        const roomId = await this.createRoom(user.id, params.roomName, roomSize);
        
        if (roomSize === 1) {
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

module.exports = CreateRoom;