const LoginHandler = require('../../router/handlers/userHandlers/loginHandler.js');
const LogoutHandler = require('../../router/handlers/userHandlers/logoutHandler.js');
const RegistrationHandler = require('../../router/handlers/userHandlers/registrationHandler.js');
const DeleteUserHandler = require('../../router/handlers/userHandlers/deleteUserHandler.js');
const GetUserInfoHandler = require('../../router/handlers/userHandlers/getUserInfoHandler.js');
const GetRatingTableHandler = require('../../router/handlers/userHandlers/getRatingTableHandler.js');

class UserManager {
    constructor({ mediator, db }) { 
        this.db = db;
        this.mediator = mediator;

        // Получение типов ивентов и триггеров из медиатора
        const events = mediator.getEventTypes();
        const triggers = mediator.getTriggerTypes();

        // Подписка на ивенты
        mediator.subscribe(events.LOGIN, this.login.bind(this));
        mediator.subscribe(events.LOGOUT, this.logout.bind(this));
        mediator.subscribe(events.REGISTRATION, this.registration.bind(this));
        mediator.subscribe(events.DELETE_USER, this.deleteUser.bind(this));

        // Устанавливаем обработчики для триггеров
        mediator.set(triggers.GET_RATING_TABLE, this.getRatingTable.bind(this));
        mediator.set(triggers.GET_USER_INFO, this.getUserInfo.bind(this));
    }

    async login(params) {
        if (!params.login || !params.passwordHash) {
            return { error: 242 };
        }
        const handler = new LoginHandler(this.db);
        return await handler.execute(params);
    }

    async logout(params) {
        if (!params.token) {
            return { error: 242 };
        }
        const handler = new LogoutHandler(this.db);
        return await handler.execute(params);
    }

    async registration(params) {
        if (!params.login || !params.passwordHash || !params.nickname) {
            return { error: 242 };
        }
        const handler = new RegistrationHandler(this.db);
        return await handler.execute(params);
    }

    async getUserInfo(params) {
        if (!params.token) {
            return { error: 242 };
        }
        const handler = new GetUserInfoHandler(this.db);
        return await handler.execute(params);
    }

    async deleteUser(params) {
        if (!params.token) {
            return { error: 242 };
        }
        const handler = new DeleteUserHandler(this.db);
        return await handler.execute(params);
    }

    async getRatingTable(params) {
        if (!params.token) {
            return { error: 242 };
        }
        const handler = new GetRatingTableHandler(this.db);
        return await handler.execute(params);
    }
}

module.exports = UserManager;