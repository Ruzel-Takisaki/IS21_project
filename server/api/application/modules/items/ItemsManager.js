const BuyItemHandler = require('../../router/handlers/itemHandlers/buyItemHandler.js');
const SellItemHandler = require('../../router/handlers/itemHandlers/sellItemHandler.js');
const UseArrowHandler = require('../../router/handlers/itemHandlers/useArrowHandler.js');
const UsePotionHandler = require('../../router/handlers/itemHandlers/usePotionHandler.js');
const GetItemsDataHandler = require('../../router/handlers/itemHandlers/getItemsDataHandler.js');

class ItemsManager {
    constructor({ mediator, db }) {
        this.db = db;
        this.mediator = mediator;

        // Получение типов ивентов и триггеров из медиатора
        const events = mediator.getEventTypes();
        const triggers = mediator.getTriggerTypes();

        // Подписка на ивенты
        mediator.subscribe(events.BUY_ITEM, this.buyItem.bind(this));
        mediator.subscribe(events.SELL_ITEM, this.sellItem.bind(this));
        mediator.subscribe(events.USE_ARROW, this.useArrow.bind(this));
        mediator.subscribe(events.USE_POTION, this.usePotion.bind(this));
        
        // Устанавливаем обработчики для триггеров
        mediator.set(triggers.GET_ITEMS_DATA, this.getItemsData.bind(this));
    }

    async buyItem(params) {
        if (!params.token || !params.itemId) {
            return { error: 242 };
        }
        const handler = new BuyItemHandler(this.db);
        return await handler.execute(params); 
    }

    async sellItem(params) {
        if (!params.token || !params.itemId) {
            return { error: 242 };
        }
        const handler = new SellItemHandler(this.db);
        return await handler.execute(params);
    }

    async useArrow(params) {
        if (!params.token) {
            return { error: 242 };
        }
        const handler = new UseArrowHandler(this.db);
        return await handler.execute(params); 
    }

    async usePotion(params) {
        if (!params.token) {
            return { error: 242 };
        }
        const handler = new UsePotionHandler(this.db);
        return await handler.execute(params); 
    }

    async getItemsData(params) {
        if (!params.token) {
            return { error: 242 };
        }
        const handler = new GetItemsDataHandler(this.db);
        return await handler.execute(params); 
    }
}

module.exports = ItemsManager;