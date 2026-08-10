"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/formattext.ts" />
var ShoppingCart;
(function (ShoppingCart) {
    class GlobalCart {
        static instance;
        MAX_PER_ITEM = 10;
        MAX_CART = 100;
        items = [];
        totalItems = 0;
        totalPrice = 0;
        subscribers = [];
        constructor() { }
        static mapTempCarts = {};
        static findOrCreateTempCart(id, bCreateNew) {
            if (!GlobalCart.mapTempCarts.hasOwnProperty(id)) {
                if (bCreateNew)
                    GlobalCart.mapTempCarts[id] = new GlobalCart();
            }
            return GlobalCart.mapTempCarts[id];
        }
        static releaseTempCart(id) {
            delete GlobalCart.mapTempCarts[id];
        }
        static getInstance() {
            if (!GlobalCart.instance) {
                GlobalCart.instance = new GlobalCart();
            }
            return GlobalCart.instance;
        }
        subscribeToUpdates(panel, key, callback) {
            this.subscribers = this.subscribers.filter(sub => sub.panel.IsValid());
            const existingIndex = this.subscribers.findIndex(sub => sub.panel === panel && sub.key === key);
            if (existingIndex !== -1) {
                this.subscribers[existingIndex].callback = callback;
            }
            else {
                this.subscribers.push({ panel, key, callback });
            }
            callback();
        }
        broadcastUpdate() {
            this.subscribers = this.subscribers.filter(sub => sub.panel.IsValid());
            for (const sub of this.subscribers) {
                sub.callback();
            }
        }
        calculateTotals() {
            let totalItems = 0;
            let totalPrice = 0;
            for (const item of this.items) {
                totalItems += item.quantity;
                totalPrice += (item.price * item.quantity);
            }
            this.totalItems = totalItems;
            this.totalPrice = totalPrice;
            this.broadcastUpdate();
        }
        addItem(product, quantity = 1) {
            if (this.totalItems >= 100) {
                return;
            }
            const existingItem = this.items.find(item => item.id === product.id);
            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity;
                existingItem.quantity = Math.min(newQuantity, this.MAX_PER_ITEM);
            }
            else {
                const initialQuantity = Math.min(quantity, this.MAX_PER_ITEM);
                this.items.push({ ...product, quantity: initialQuantity });
            }
            this.calculateTotals();
        }
        removeItem(productId) {
            this.items = this.items.filter(item => item.id !== productId);
            this.calculateTotals();
        }
        decrementItem(productId, amount = 1) {
            const item = this.items.find(item => item.id === productId);
            if (item) {
                item.quantity -= amount;
                if (item.quantity <= 0) {
                    this.removeItem(productId);
                }
                else {
                    this.calculateTotals();
                }
            }
        }
        updateQuantity(productId, quantity) {
            if (quantity <= 0) {
                this.removeItem(productId);
                return;
            }
            const item = this.items.find(item => item.id === productId);
            if (item) {
                item.quantity = Math.min(quantity, this.MAX_PER_ITEM);
                this.calculateTotals();
            }
        }
        getItemQuantity(productId) {
            const item = this.items.find(item => item.id === productId);
            return item ? item.quantity : 0;
        }
        clearCart() {
            this.items = [];
            this.calculateTotals();
        }
        getItems() {
            return this.items;
        }
        getItemUnitPrice(productId) {
            const item = this.items.find(item => item.id === productId);
            return item ? item.price : 0;
        }
        getItemLinePrice(productId) {
            const item = this.items.find(item => item.id === productId);
            return item ? (item.price * item.quantity) : 0;
        }
        getTotalItems() {
            return this.totalItems;
        }
        getTotalPrice() {
            return this.totalPrice;
        }
        syncPrices(getPriceById) {
            let pricesChanged = false;
            for (const item of this.items) {
                const livePrice = getPriceById(item.id);
                if (livePrice !== undefined && item.price !== undefined) {
                    item.oldPrice = item.price;
                    item.price = livePrice;
                    pricesChanged = item.price !== item.oldPrice;
                }
            }
            if (pricesChanged) {
                this.calculateTotals();
            }
        }
    }
    ShoppingCart.cart = GlobalCart.getInstance();
    function findOrCreateTempCart(id, bCreateNew) { return GlobalCart.findOrCreateTempCart(id, bCreateNew); }
    ShoppingCart.findOrCreateTempCart = findOrCreateTempCart;
    function releaseTempCart(id) { GlobalCart.releaseTempCart(id); }
    ShoppingCart.releaseTempCart = releaseTempCart;
})(ShoppingCart || (ShoppingCart = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hvcHBpbmdfY2FydC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2NvbW1vbi9zaG9wcGluZ19jYXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsZ0RBQWdEO0FBRWhELElBQVUsWUFBWSxDQThQckI7QUE5UEQsV0FBVSxZQUFZO0lBc0JsQixNQUFNLFVBQVU7UUFFSixNQUFNLENBQUMsUUFBUSxDQUFhO1FBQ25CLFlBQVksR0FBRyxFQUFFLENBQUM7UUFDbEIsUUFBUSxHQUFHLEdBQUcsQ0FBQztRQUN4QixLQUFLLEdBQWUsRUFBRSxDQUFDO1FBQ3ZCLFVBQVUsR0FBVyxDQUFDLENBQUM7UUFDdkIsVUFBVSxHQUFXLENBQUMsQ0FBQztRQUd2QixXQUFXLEdBQXFCLEVBQUUsQ0FBQztRQUczQyxnQkFBd0IsQ0FBQztRQUVqQixNQUFNLENBQUMsWUFBWSxHQUFtQyxFQUFFLENBQUM7UUFDMUQsTUFBTSxDQUFDLG9CQUFvQixDQUFFLEVBQVUsRUFBRSxVQUFvQjtZQUVoRSxJQUFLLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQyxjQUFjLENBQUUsRUFBRSxDQUFFLEVBQ2xEO2dCQUNJLElBQUssVUFBVTtvQkFDWCxVQUFVLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksVUFBVSxFQUFFLENBQUM7YUFDdEQ7WUFDRCxPQUFPLFVBQVUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdkMsQ0FBQztRQUNNLE1BQU0sQ0FBQyxlQUFlLENBQUUsRUFBVTtZQUVyQyxPQUFPLFVBQVUsQ0FBQyxZQUFZLENBQUUsRUFBRSxDQUFFLENBQUM7UUFDekMsQ0FBQztRQUVNLE1BQU0sQ0FBQyxXQUFXO1lBRXJCLElBQUssQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUN6QjtnQkFDSSxVQUFVLENBQUMsUUFBUSxHQUFHLElBQUks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