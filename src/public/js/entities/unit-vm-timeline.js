/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global _, gs, me, utils, sh, ko, OrderVMTimeline*/

var UnitVMTimeline =  Object.extend({
    init: function(unit) {
        'use strict';
        var self = this;
        this.m = unit;
        this.orderVMs = [];
        this.orders = ko.observableArray();
        this.orders.subscribe(function(newValue) {
            utils.updateVMs({
                models: unit.orders,
                vms: self.orderVMs,
                DefaultConstructor: OrderVMTimeline
            });

            //send new orders to the frames
        });
        this.orders(unit.orders);
    },
    getOrderVM: function(orderModel) {
        'use strict';
        try {
            return utils.getVM(orderModel, this.m.orders, this.orderVMs);
        } catch (e) {
            return null;
        }
    }
});
