class CONFIG {
    static DB_HOST = '127.127.126.15';     // Хост базы данных
    static DB_PORT = '3306';               // Порт базы данных
    static DB_NAME = 'knightwars';         // Имя базы данных
    static DB_USER = 'root';               // Имя пользователя БД
    static DB_PASS = '';                   // Пароль пользователя БД
    static DB_CHARSET = 'utf8mb4';         // Кодировка подключения

    static SERVER_PORT = '3000';           // Хост сервера
    static SERVER_NAME = 'Schizophrenia';  // Имя сервера

    static ROOM_MIN_SIZE = 1;              // Минимальное количество игроков в комнате
    static ROOM_MAX_SIZE = 6;              // Максимальное количество игроков в комнате

    static MAX_POTIONS_PER_USER = 3;       // Максимальное количество зелий у одного пользователя
    static MAX_ARROWS_PER_USER = 50;       // Максимальное количество стрел у одного пользователя

    static STARTED_CLASS_ID = 1;           // ID стартового класса (воин)
    static STARTED_ITEMS = [3, 5, 6, 7, 8];   // ID стартовых предметов

    static PASSWORD_SALT_LENGTH = 100000;  // Длина соли для пароля

    //ивенты
    static EVENTS = {
        //user events
        LOGIN: 'LOGIN',
        LOGOUT: 'LOGOUT',
        REGISTRATION: 'REGISTRATION',
        DELETE_USER: 'DELETE_USER',
        //items events
        BUY_ITEM: 'BUY_ITEM',
        SELL_ITEM: 'SELL_ITEM',
        USE_ARROW: 'USE_ARROW',
        USE_POTION: 'USE_POTION',
    }

    //триггеры
    static TRIGGERS = {
        //user triggers
        GET_USER_INFO: 'GET_USER_INFO',
        GET_RATING_TABLE: 'GET_RATING_TABLE',
        //items triggers
        GET_ITEMS_DATA: 'GET_ITEMS_DATA',
    }
}

module.exports = CONFIG;