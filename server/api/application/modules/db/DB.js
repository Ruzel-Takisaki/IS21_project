const mysql = require('mysql2/promise');
const CONFIG = require('../../../config.js');

class DB {
    constructor() {
        this.pool = mysql.createPool({
            host: CONFIG.DB_HOST,
            port: CONFIG.DB_PORT,
            user: CONFIG.DB_USER,
            password: CONFIG.DB_PASS,
            database: CONFIG.DB_NAME,
            charset: CONFIG.DB_CHARSET,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }

    async execute(sql, params = []) {
        const [result] = await this.pool.execute(sql, params);
        return result;
    }

    async query(sql, params = []) {
        const [rows] = await this.pool.execute(sql, params);
        return rows[0] || null;
    }

    async queryAll(sql, params = []) {
        const [rows] = await this.pool.execute(sql, params);
        return rows;
    }

    // ============ USER METHODS ============
    async getUserByLogin(login) {
        return await this.query("SELECT * FROM users WHERE login=?", [login]);
    }

    async getUserByToken(token) {
        return await this.query("SELECT * FROM users WHERE token=?", [token]);
    }

    async getUserById(id) {
        return await this.query("SELECT * FROM users WHERE id = ?", [id]);
    }

    async updateToken(userId, token) {
        await this.execute("UPDATE users SET token=? WHERE id=?", [token, userId]);
    }

    async registration(login, password, nickname) {
        await this.execute(
            "INSERT INTO users (login, password, nickname) VALUES (?, ?, ?)",
            [login, password, nickname]
        );
    }

    async getRatingTable() {
        return await this.queryAll(`
            SELECT 
                u.nickname,
                c.rating
            FROM characters c
            JOIN users u ON c.user_id = u.id
            WHERE c.rating > 0
            ORDER BY c.rating DESC
            LIMIT 20
        `);
    }

    // ============ CHARACTER METHODS ============
    async getCharacterByUserId(userId) {
        return await this.query("SELECT * FROM characters WHERE user_id = ?", [userId]);
    }

    async createCharacter(userId) {
        const result = await this.execute(
            "INSERT INTO characters (user_id, hp, defense, money) VALUES (?, 100, 0, 1000)",
            [userId]
        );
        return result.affectedRows > 0;
    }

    async deleteCharacter(userId) {
        const result = await this.execute("DELETE FROM characters WHERE user_id = ?", [userId]);
        return result.affectedRows > 0;
    }

    async updateCharacterMoneyAdd(characterId, amount) {
        const result = await this.execute("UPDATE characters SET money = money + ? WHERE id = ?", [amount, characterId]);
        return result.affectedRows > 0;
    }

    async updateCharacterMoneySubtract(characterId, amount) {
        const result = await this.execute("UPDATE characters SET money = money - ? WHERE id = ?", [amount, characterId]);
        return result.affectedRows > 0;
    }

    // ============ LOBBY METHODS (нужны для deleteUser) ============
    async getUserTypeInRoom(userId) {
        const character = await this.getCharacterByUserId(userId);
        if (!character) return null;
        return await this.query("SELECT type, room_id as roomId FROM room_members WHERE character_id=?", [character.id]);
    }

    // ============ LOBBY METHODS ============
    async getRoomMemberByUserId(userId) {
        const character = await this.getCharacterByUserId(userId);
        if (!character) return null;
        
        return await this.query(
            "SELECT id, room_id as roomId, character_id as characterId, type, status, data FROM room_members WHERE character_id=?", 
            [character.id]
        );
    }

    async deleteAllRoomMembers(roomId) {
        const result = await this.execute(
            "DELETE FROM room_members WHERE room_id=?", 
            [roomId]
        );
        return result.affectedRows > 0;
    }

    async deleteRoom(roomId) {
        const result = await this.execute(
            "DELETE FROM rooms WHERE id=?", 
            [roomId]
        );
        return result.affectedRows > 0;
    }

    async deleteAllBotsForRoom(roomId) {
        const result = await this.execute(
            "DELETE FROM bots_rooms WHERE room_id = ?", 
            [roomId]
        );
        return result.affectedRows > 0;
    }

    async deleteAllArrowsForRoom(roomId) {
        const result = await this.execute(
            "DELETE FROM arrows WHERE room_id = ?", 
            [roomId]
        );
        return result.affectedRows > 0;
    }

    async isUserPlaying(userId) {
        const character = await this.getCharacterByUserId(userId);
        if (!character) return false;
        
        const result = await this.query(
            "SELECT id FROM room_members WHERE character_id = ? AND status = 'started'", 
            [character.id]
        );
        return result !== null;
    }

    async getUserTypeInRoom(userId) {
        const character = await this.getCharacterByUserId(userId);
        if (!character) return null;
        
        const result = await this.query(
            "SELECT type, room_id as roomId FROM room_members WHERE character_id=?", 
            [character.id]
        );
        return result ? { type: result.type, roomId: result.roomId } : null;
    }

    async leaveParticipantFromRoom(userId) {
        const character = await this.getCharacterByUserId(userId);
        if (!character) return false;
        
        await this.execute(
            "DELETE FROM room_members WHERE character_id=?", 
            [character.id]
        );
        return true;
    }

    async createRoom(userId, roomName, roomSize) {
        const character = await this.getCharacterByUserId(userId);
        if (!character) return false;
        
        const result = await this.execute(
            "INSERT INTO rooms (name, room_size) VALUES (?, ?)", 
            [roomName, roomSize]
        );
        const roomId = result.insertId;
        
        await this.execute(
            "INSERT INTO room_members (room_id, character_id, type, status) VALUES (?, ?, ?, ?)",
            [roomId, character.id, 'owner', 'ready']
        );
        return roomId;
    }

    async addRoomMember(roomId, characterId, type, status = 'ready') {
        await this.execute(
            "INSERT INTO room_members (room_id, character_id, type, status) VALUES (?, ?, ?, ?)",
            [roomId, characterId, type, status]
        );
    }

    async updateRoomStatus(roomId, status) {
        await this.execute(
            "UPDATE rooms SET status=? WHERE id=?", 
            [status, roomId]
        );
    }

    async updateAllRoomMembersStatus(roomId, status) {
        await this.execute(
            "UPDATE room_members SET status=? WHERE room_id=?", 
            [status, roomId]
        );
    }

    async createInitialBotsForRoom(roomId) {
        await this.execute(
            "INSERT INTO bots_rooms (room_id) VALUES (?)",
            [roomId]
        );
    }

    async createInitialArrowsForRoom(roomId) {
        await this.execute(
            "INSERT INTO arrows (room_id) VALUES (?)",
            [roomId]
        );
    }

    async updateRoomHash(hash) {
        await this.execute(
            "UPDATE hashes SET room_hash = ? WHERE id = 1",
            [hash]
        );
    }

    async getAllRoomMembers(roomId) {
        return await this.queryAll(
            "SELECT * FROM room_members WHERE room_id=?", 
            [roomId]
        );
    }

    // ============ MESSAGE METHODS ============
    async deleteUserMessages(userId) {
        const result = await this.execute("DELETE FROM messages WHERE user_id = ?", [userId]);
        return result.affectedRows > 0;
    }

    // ============ CLASS METHODS ============
    async getUserSelectedClassId(userId) {
        const character = await this.getCharacterByUserId(userId);
        if (!character) return null;

        const result = await this.query(
            "SELECT class_id FROM characters_classes WHERE character_id = ? AND selected = 1",
            [character.id]
        );

        return result ? result.class_id : null;
    }

    async getUserPurchasedClassIds(userId) {
        const character = await this.getCharacterByUserId(userId);
        if (!character) return [];

        const results = await this.queryAll(
            "SELECT class_id FROM characters_classes WHERE character_id = ?",
            [character.id]
        );

        return results.map(row => parseInt(row.class_id));
    }

    async addUserPersonClass(userId, classId) {
        const character = await this.getCharacterByUserId(userId);
        if (!character) return false;

        const result = await this.execute(
            "INSERT INTO characters_classes (character_id, class_id, selected) VALUES (?, ?, 0)",
            [character.id, classId]
        );
        return result.affectedRows > 0;
    }

    async setUserSelectedPersonClass(userId, classId) {
        const character = await this.getCharacterByUserId(userId);
        if (!character) return false;

        const result = await this.execute(
            "UPDATE characters_classes SET selected = 1 WHERE character_id = ? AND class_id = ?",
            [character.id, classId]
        );
        return result.affectedRows > 0;
    }

    // ============ ITEM METHODS ============
    async getItemById(itemId) {
        const result = await this.query(
            `SELECT 
                id, 
                name, 
                item_type as itemType,
                weapon_type as weaponType,
                damage,
                attack_speed as attackSpeed,
                attack_distance as attackDistance,
                bonus_defense as bonusDefense,
                bonus_hp as bonusHp,
                cost
            FROM items 
            WHERE id = ?`,
            [itemId]
        );
        return result;
    }

    async getUserItem(characterId, itemId) {
        return await this.query(
            "SELECT * FROM character_items WHERE character_id=? AND item_id=?",
            [characterId, itemId]
        );
    }

    async getUserPurchasedItemsWithQuantity(characterId) {
        const results = await this.queryAll(
            "SELECT item_id as itemId, quantity FROM character_items WHERE character_id = ?",
            [characterId]
        );

        return results.map(row => ({
            itemId: parseInt(row.itemId),
            quantity: parseInt(row.quantity)
        }));
    }

    async addUserItem(characterId, itemId) {
        const result = await this.execute(
            "INSERT INTO character_items (character_id, item_id, quantity) VALUES (?, ?, 1)",
            [characterId, itemId]
        );
        return result.affectedRows > 0;
    }

    async hasCharacterWeaponType(characterId, weaponType) {
        const result = await this.query(
            `SELECT ci.* FROM character_items ci 
            JOIN items i ON ci.item_id = i.id 
            WHERE ci.character_id = ? AND i.weapon_type = ?`,
            [characterId, weaponType]
        );
        return result;
    }

    async hasCharacterItemType(characterId, itemType) {
        const result = await this.query(
            `SELECT 
                ci.id, 
                ci.item_id as itemId, 
                ci.character_id as characterId, 
                ci.quantity, 
                i.item_type as itemType, 
                i.weapon_type as weaponType
            FROM character_items ci 
            JOIN items i ON ci.item_id = i.id 
            WHERE ci.character_id = ? AND i.item_type = ?`,
            [characterId, itemType]
        );
        return result;
    }

    async hasCharacterArrows(characterId) {
        const arrowItem = await this.query(
            `SELECT ci.* FROM character_items ci 
            JOIN items i ON ci.item_id = i.id 
            WHERE ci.character_id = ? AND i.item_type = 'arrow' AND ci.quantity > 0`,
            [characterId]
        );
        return arrowItem && arrowItem.quantity > 0;
    }

    async hasCharacterPotion(characterId) {
        const potionItem = await this.query(
            `SELECT ci.* FROM character_items ci 
            JOIN items i ON ci.item_id = i.id 
            WHERE ci.character_id = ? AND i.item_type = 'potion' AND ci.quantity > 0`,
            [characterId]
        );
        return potionItem && potionItem.quantity > 0;
    }
    
    async getCharacterConsumable(characterId, itemType) {
        const result = await this.query(
            `SELECT ci.id, ci.item_id as itemId, ci.quantity 
            FROM character_items ci 
            JOIN items i ON ci.item_id = i.id 
            WHERE ci.character_id = ? AND i.item_type = ?`,
            [characterId, itemType]
        );
        return result;
    }

    async updateUserItemQuantity(characterId, itemId, quantity) {
        const result = await this.execute(
            "UPDATE character_items SET quantity = ? WHERE character_id = ? AND item_id = ?",
            [quantity, characterId, itemId]
        );
        return result.affectedRows > 0;
    }

    async deleteUserItem(characterId, itemId) {
        const result = await this.execute(
            "DELETE FROM character_items WHERE character_id = ? AND item_id = ?", 
            [characterId, itemId]
        );
        return result.affectedRows > 0;
    }

    async getAllItemsData() {
        return await this.queryAll(`
            SELECT 
                id,
                name,
                item_type as itemType,
                weapon_type as weaponType,
                damage,
                attack_speed as attackSpeed,
                attack_distance as attackDistance,
                bonus_defense as bonusDefense,
                bonus_hp as bonusHp,
                cost
            FROM items
        `);
    }

    // ============ DELETE USER METHODS ============
    async deleteAllCharacterItems(characterId) {
        const result = await this.execute("DELETE FROM character_items WHERE character_id = ?", [characterId]);
        return result.affectedRows > 0;
    }

    async deleteAllCharacterClasses(characterId) {
        const result = await this.execute("DELETE FROM characters_classes WHERE character_id = ?", [characterId]);
        return result.affectedRows > 0;
    }

    async deleteUser(userId) {
        const result = await this.execute("DELETE FROM users WHERE id=?", [userId]);
        return result.affectedRows > 0;
    }

    // ============ TRANSACTION METHODS ============
    async beginTransaction() {
        const connection = await this.pool.getConnection();
        await connection.beginTransaction();
        return connection;
    }

    async commit(connection) {
        await connection.commit();
        connection.release();
    }

    async rollback(connection) {
        await connection.rollback();
        connection.release();
    }
}

module.exports = DB;