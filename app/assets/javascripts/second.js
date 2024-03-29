function Second(shop, map) {
    var self = this;
    this.init = function(shop, map) {
        this.DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        this.shop = shop;
        this.id = this.shop["_id"]["$oid"];
        this.user_id = this.shop["user_id"]["$oid"];
        this.second_show_time = 200;
        this.position = {lng: shop.address.lng, lat: shop.address.lat};
        this.map = map;
        this.refresh_day = this.define_refresh_day();
        this.sorted_days_by_freshness = this.sort_days_by_freshness();
        this.icon_base = "images/google_maps_markers/cool/PNG/";
        var marker_days = null;
        var trusted = {
            refresh_day: "pin-red-solid-15.png",
            custom_day: "pin-blue-solid-15.png",
            after_refresh_day: "pin-yellow-solid-15.png",
        };
        var untrusted = {
            refresh_day: "pin-red-15.png",
            custom_day: "pin-blue-15.png",
            after_refresh_day: "pin-yellow-15.png",
        };
        (shop.status) ? marker_days = trusted : marker_days = untrusted;
        this.icons = this.set_icons(marker_days);
        self.create_content().then(function(content) {
            //В залежності від прав видаляти елементи та події
            self.create_info_bubble(content);
        });
    };
    this.remove_marker = function() {
        this.marker.setMap(null);
    };
    this.set_icons = function(days) {
        var icons = Array.apply(null, new Array(7)).map(String.prototype.valueOf, days.custom_day);
        icons[0] = days.refresh_day;
        if (days.hasOwnProperty("after_refresh_day"))
            icons[1] = days.after_refresh_day;
        return icons;
    };
    this.define_refresh_day = function() {
        var days = [];
        this.DAYS.forEach(function(day) {
            days.push(self.shop.price[day]);
        });
        var max = Math.max.apply(Math, days);
        var index = days.indexOf(max);
        if (days[index] !== max)
            throw new Error("Days are not matched");
        return index;
    };
    this.create_marker = function() {
        var icon = self.define_icon_for_marker();
        var z_index = self.set_z_index_for_marker();
        //console.log("zIndex: " + z_index + " because refresh_day: " + this.refresh_day);
        var marker = new google.maps.Marker({
            map: self.map,
            position: self.position,
            icon: icon,
            zIndex: z_index,
            animation: google.maps.Animation.DROP
        });
        self.marker = marker;
        google.maps.event.addListener(self.marker, 'click', function() {
            self.info_bubble.open(self.map, self.marker);
            setTimeout(function() {
                    var parent = $(self.info_bubble.getContainer()),
                        today = new Date().getDay();
                    parent.find('td[data-name=' + self.DAYS[self.refresh_day] + ']').addClass('refreshDay');
                    parent.find('td[data-name=' + self.DAYS[today] + ']').addClass('today');
                    //TODO: new RefreshDay(days);
                    if(self.info_bubble.isOpen()){
                        app.$context.trigger('second-info-window-opened', {parent: parent, shop: self.shop});
                    }else {
                        app.alert("info bubble is closed", "warning");
                    }
            }, 100);
        });
        return marker;
    };
    /**
     * Порівнюємо індекси дня оновлення та поточного дня
     * та виставляємо відповідно до цього zIndex
     * @returns {undefined
     */
    this.set_z_index_for_marker = function() {
        return 100 - this.refresh_priority();
    };
    /**
     * Визначає пріоритет оновлення секонда в поточний день
     * Чим меньше число, тим свіжіший товар у секонді
     * 0 - день оновлення
     * 1 - день після оновлення
     * 6 - останній день
     * @returns {Number}
     */
    this.refresh_priority = function() {
        var today = new Date();
        var day_of_week = this.DAYS[today.getDay()];
        return this.sorted_days_by_freshness.indexOf(day_of_week);
    };
    this.sort_days_by_freshness = function() {
        var right = this.DAYS.slice(this.refresh_day);
        var left = this.DAYS.slice(0, this.refresh_day);
        return right.concat(left);
    };
    /**
     * refresh_day - 3 day of week (wed) 
     * sorted_days_by_freshness - ["wed", "thu", 'fri", "sat", "sun", "mon", "tue"]
     * today - 1 day of week (mon)
     * 
     */
    this.define_icon_for_marker = function() {
        var index = this.refresh_priority();
        //console.log("refresh priority: " + index);
        var icon = this.icon_base + this.icons[index];
        //console.log("Today image is: " + icon + " because refresh day is: " + this.DAYS[this.refresh_day]);
        return icon;
    };
    this.show = function(time) {
        time = (time * self.second_show_time) || 0;
        setTimeout(function() {
            self.create_marker();
        }, time);
    };
    this.create_content = function() {
        var html = app.template.get('second_hand', self.shop);
        return html;
    };
    this.create_info_bubble = function(content) {
        var info_bubble = new InfoBubble({
            minWidth: 500,
            content: content,
            shadowStyle: 1,
            padding: 0,
            backgroundColor: 'white',
            borderRadius: 0,
            arrowSize: 10,
            borderWidth: 0,
            borderColor: 'white'
        });
        this.info_bubble = info_bubble;
    };
    self.init(shop, map);
}
;
