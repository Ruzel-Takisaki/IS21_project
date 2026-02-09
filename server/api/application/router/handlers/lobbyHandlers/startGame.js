const BaseManager = require('../../BaseManager.js');

class StartGame extends BaseManager {
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
        
        const roomMember = await this.checkUserIsRoomOwner(user.id);
        if (roomMember.error) {
            return roomMember;
        }
        
        const room = await this.db.getRoomById(roomMember.roomId);
        if (!room) {
            return { error: 2003 };
        }
        
        if (room.status !== 'closed') {
            return { error: 2015 };
        }
        
        const roomMembers = await this.db.getAllRoomMembers(roomMember.roomId);
        
        let readyPlayers = 0;
        for (const member of roomMembers) {
            if (member.status === 'ready') {
                readyPlayers++;
            }
        }
        
        if (readyPlayers !== room.room_size) {
            return { error: 2012 };
        }
        
        await this.db.updateRoomStatus(roomMember.roomId, 'started');
        await this.db.updateAllRoomMembersStatus(roomMember.roomId, 'started');
        
        await this.db.createInitialBotsForRoom(roomMember.roomId);
        await this.db.createInitialArrowsForRoom(roomMember.roomId);
        
        await this.db.updateRoomHash(this.md5(Math.random().toString()));
        
        return true;
    }
}

module.exports = StartGame;