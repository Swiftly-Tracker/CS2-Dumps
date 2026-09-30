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
        // The list of panels listening for events
        subscribers = [];
        // Forces the use of getInstance() or allocTempCart()
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
        // Panels call this to listen for cart updates.
        subscribeToUpdates(panel, key, callback) {
            this.subscribers = this.subscribers.filter(sub => sub.panel.IsValid());
            // Check if this exact panel is already in the list
            const existingIndex = this.subscribers.findIndex(sub => sub.panel === panel && sub.key === key);
            if (existingIndex !== -1) {
                // Overwrite the old callback with the new one.
                // IsValid() returns true for dynamic lister tiles since they are never destroyed but reused
                this.subscribers[existingIndex].callback = callback;
            }
            else {
                this.subscribers.push({ panel, key, callback });
            }
            // Set initial state
            callback();
        }
        // The cart calls this internally whenever data changes.      
        broadcastUpdate() {
            // Remove any panels that were destroyed 
            this.subscribers = this.subscribers.filter(sub => sub.panel.IsValid());
            // Valid panels update themselves
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
        // Accessors
        addItem(product, quantity = 1) {
            if (this.totalItems >= 100) {
                return;
            }
            const existingItem = this.items.find(item => item.id === product.id);
            $.Msg('add item - name: ' + product.name);
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
                    // If it hits zero, reuse our existing method to wipe it out entirely
                    this.removeItem(productId);
                }
                else {
                    // Otherwise, just recalculate the new totals
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
        //Syncs all items in the cart against the upto date prices incase we update outside cart.
        //Pass in a lookup function that returns the true current price of an itemid.
        syncPrices(getPriceById) {
            let pricesChanged = false;
            for (const item of this.items) {
                const livePrice = getPriceById(item.id);
                // If the price is different from our cached price
                if (livePrice !== undefined && item.price !== undefined) {
                    //Save old price
                    item.oldPrice = item.price;
                    $.Msg('Price in cart Updated: ' + item.name);
                    item.price = livePrice;
                    pricesChanged = item.price !== item.oldPrice;
                }
            }
            // Only recalculate and update if something changed
            if (pricesChanged) {
                this.calculateTotals();
            }
        }
    }
    // Export the single instance globally
    ShoppingCart.cart = GlobalCart.getInstance();
    function findOrCreateTempCart(id, bCreateNew) { return GlobalCart.findOrCreateTempCart(id, bCreateNew); }
    ShoppingCart.findOrCreateTempCart = findOrCreateTempCart;
    function releaseTempCart(id) { GlobalCart.releaseTempCart(id); }
    ShoppingCart.releaseTempCart = releaseTempCart;
})(ShoppingCart || (ShoppingCart = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hvcHBpbmdfY2FydC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2NvbW1vbi9zaG9wcGluZ19jYXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsZ0RBQWdEO0FBRWhELElBQVUsWUFBWSxDQThQckI7QUE5UEQsV0FBVSxZQUFZO0lBc0JsQixNQUFNLFVBQVU7UUFFSixNQUFNLENBQUMsUUFBUSxDQUFhO1FBQ25CLFlBQVksR0FBRyxFQUFFLENBQUM7UUFDbEIsUUFBUSxHQUFHLEdBQUcsQ0FBQztRQUN4QixLQUFLLEdBQWUsRUFBRSxDQUFDO1FBQ3ZCLFVBQVUsR0FBVyxDQUFDLENBQUM7UUFDdkIsVUFBVSxHQUFXLENBQUMsQ0FBQztRQUUvQiwwQ0FBMEM7UUFDbEMsV0FBVyxHQUFxQixFQUFFLENBQUM7UUFFM0MscURBQXFEO1FBQ3JELGdCQUF3QixDQUFDO1FBRWpCLE1BQU0sQ0FBQyxZQUFZLEdBQW1DLEVBQUUsQ0FBQztRQUMxRCxNQUFNLENBQUMsb0JBQW9CLENBQUUsRUFBVSxFQUFFLFVBQW9CO1lBRWhFLElBQUssQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLGNBQWMsQ0FBRSxFQUFFLENBQUUsRUFDbEQ7Z0JBQ0ksSUFBSyxVQUFVO29CQUNYLFVBQVUsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxVQUFVLEVBQUUsQ0FBQzthQUN0RDtZQUNELE9BQU8sVUFBVSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN2QyxDQUFDO1FBQ00sTUFBTSxDQUFDLGVBQWUsQ0FBRSxFQUFVO1lBRXJDLE9BQU8sVUFBVSxDQUFDLFlBQVksQ0FBRSxFQUFFLENBQUUsQ0FBQztRQUN6QyxDQUFDO1FBRU0sTUFBTSxDQUFDLFdBQVc7WUFFckIsSUFBSyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQ3pCO2dCQUNJ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