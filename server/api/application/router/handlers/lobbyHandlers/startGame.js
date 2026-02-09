const BaseManager = require('../../BaseManager.js');

class StartGame extends BaseManager {
    constructor(db) {
        super(db);
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
    
    async updateRoomStatus(roomId, status) {
        await this.db.execute(
            "UPDATE rooms SET status=? WHERE id=?", 
            [status, roomId]
        );
    }
    
    async updateAllRoomMembersStatus(roomId, status) {
        await this.db.execute(
            "UPDATE room_members SET status=? WHERE room_id=?", 
            [status, roomId]
        );
    }
    
    async createInitialBotsForRoom(roomId) {
        await this.db.execute(
            "INSERT INTO bots_rooms (room_id) VALUES (?)",
            [roomId]
        );
    }
    
    async createInitialArrowsForRoom(roomId) {
        await this.db.execute(
            "INSERT INTO arrows (room_id) VALUES (?)",
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
        
        const roomMember = await this.checkUserIsRoomOwner(user.id);
        if (roomMember.error) {
            return roomMember;
        }
        
        const room = await this.getRoomById(roomMember.roomId);
        if (!room) {
            return { error: 2003 };
        }
        
        if (room.status !== 'closed') {
            return { error: 2015 };
        }
        
        const roomMembers = await this.getAllRoomMembers(roomMember.roomId);
        
        let readyPlayers = 0;
        for (const member of roomMembers) {
            if (member.status === 'ready') {
                readyPlayers++;
            }
        }
        
        if (readyPlayers !== room.room_size) {
            return { error: 2012 };
        }
        
        await this.updateRoomStatus(roomMember.roomId, 'started');
        await this.updateAllRoomMembersStatus(roomMember.roomId, 'started');
        
        await this.createInitialBotsForRoom(roomMember.roomId);
        await this.createInitialArrowsForRoom(roomMember.roomId);
        
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

module.exports = StartGame;