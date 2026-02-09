const express = require('express');
const Answer = require('./application/router/Answer.js');
const Router = require('./application/router/Router.js');
const CONFIG = require('./config.js');

const app = express();

app.use((req, res, next) => {
    res.header('Content-Type', 'application/json; charset=utf-8');
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Обработчик запросов
app.all('/api', async (req, res) => {
    try {
        const params = req.method === 'GET' ? req.query : req.body;
        
        function result(params) {
            const method = params.method;
            if (method) {
                const app = new Router();
                switch (method) {
                    // userHandlers
                    case 'login': return app.login(params);
                    case 'logout': return app.logout(params);
                    case 'registration': return app.registration(params);
                    case 'deleteUser': return app.deleteUser(params);
                    case 'getUserInfo': return app.getUserInfo(params);
                    case 'getRatingTable': return app.getRatingTable(params);
                    // lobbyHandlers
                    case 'createRoom': return app.createRoom(params);
                    case 'joinToRoom': return app.joinToRoom(params);
                    case 'leaveRoom': return app.leaveRoom(params);
                    case 'dropFromRoom': return app.dropFromRoom(params);
                    case 'startGame': return app.startGame(params);
                    
                    default: return { error: 102 };
                }
            }
            return { error: 101 };
        }

        const response = await result(params);
        res.json(Answer.response(response));
        
    } catch (error) {
        console.error('Server error:', error);
        res.json(Answer.response({ error: 9000 }));
    }
});

// Запуск сервака
const PORT = CONFIG.SERVER_PORT;
const NAME = CONFIG.SERVER_NAME;
app.listen(PORT, () => {
    console.log(`Server ${NAME} running on port ${PORT}`);
});

module.exports = app;