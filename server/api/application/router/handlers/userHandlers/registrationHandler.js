const BaseHandler = require('../BaseHandler.js');
const CONFIG = require('../../../../config.js');
const LoginHandler = require('./loginHandler.js');

class RegistrationHandler extends BaseHandler {
    constructor(db) {
        super(db);
    }
    
    async execute(params) {
        // Проверка наличия всех необходимых параметров
        if (!params.login || !params.passwordHash || !params.nickname) {
            return { error: 242 };
        }
        
        // Проверка существования пользака с таким логином
        const existingUser = await this.db.getUserByLogin(params.login);
        if (existingUser) {
            return { error: 1001 }; 
        }
        
        // Регистрация нового пользака
        await this.db.registration(params.login, params.passwordHash, params.nickname);
        
        // Получение только что созданного пользака
        const newUser = await this.db.getUserByLogin(params.login);
        if (!newUser) {
            return { error: 705 }; 
        }
        
        /****Создание персонажа с базовым классом и стандартными предметами****/ 
        // Создание перса
        const characterCreated = await this.db.createCharacter(newUser.id);
        if (!characterCreated) {
            return { error: 1007 }; // Персонаж не создан
        }
        
        // Добавление стартового класса
        const classAdded = await this.db.addUserPersonClass(newUser.id, CONFIG.STARTED_CLASS_ID);
        if (!classAdded) {
            return { error: 1008 };
        }
        
        // Выбор стартового класса
        const classSelected = await this.db.setUserSelectedPersonClass(newUser.id, CONFIG.STARTED_CLASS_ID);
        if (!classSelected) {
            return { error: 1009 };
        }

        // Проверка существования перса
        const character = await this.checkCharacterExists(newUser.id);
        if (character.error) return character;

        // Добавление стартового шмота
        for (const itemId of CONFIG.STARTED_ITEMS) {
            await this.db.addUserItem(character.id, itemId);
        }
        /********************************************/ 
        
        // Автоматический логин после регистрации
        const Login = require('./loginHandler.js');
        const login = new Login(this.db);
        return await login.execute({
            login: params.login,
            passwordHash: params.passwordHash
        });
    }
}

module.exports = RegistrationHandler;