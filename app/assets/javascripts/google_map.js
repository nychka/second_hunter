function GoogleMap() {
    var self = this;
    this.init = function() {
        var mapOptions = {
            center: new google.maps.LatLng(48.887535, 24.707565),
            zoom: 12
        };
        this.map = new google.maps.Map(document.getElementById("map-canvas"),
                mapOptions);
        this.seconds = [];
        this.second_show_time = 200;
    };
    this.set_shop_markers = function() {
        $.get('/shops', function(shops) {
            console.log(shops);
            for (var i in shops) {
                var second = new Second(shops[i], self.map);
                second.show(i * self.second_show_time);
                self.seconds.push(second);
            }
        });
    };
}
;
function Second(shop, map) {
    var self = this;
    this.init = function(shop, map) {
        this.DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        this.icon_base = "images/google_maps_markers/cool/PNG/";
        var marker_days = {
            refresh_day: "pin-red-solid-15.png",
            custom_day: "pin-blue-solid-15.png",
            after_refresh_day: "pin-yellow-solid-15.png",
        };
        this.icons = this.set_icons(marker_days);
        console.log(this.icons);
        this.shop = shop;
        this.position = {lng: shop.lng, lat: shop.lat};
        this.map = map;
        var content = self.create_content();
        self.create_info_window(content);
    };
    this.set_icons = function(days) {
        var icons =  Array.apply(null, new Array(7)).map(String.prototype.valueOf, days.custom_day);
        icons[0] = days.refresh_day;
        if (days.hasOwnProperty("after_refresh_day"))
            icons[1] = days.after_refresh_day;
        return icons;
    };
    this.define_refresh_day = function() {
        var days = [];
        this.DAYS.forEach(function(day) {
            days.push(self.shop[day]);
        });
        var max = Math.max.apply(Math, days);
        console.log(max);
        var index = days.indexOf(max);
        if (days[index] !== max)
            throw Error;
        return index;
    };
    this.create_marker = function() {
        var icon = self.define_icon_for_marker();
        var marker = new google.maps.Marker({
            map: self.map,
            position: self.position,
            icon: icon,
            animation: google.maps.Animation.DROP
        });
        self.marker = marker;
        console.log(this.marker);
        google.maps.event.addListener(self.marker, 'click', function() {
            self.info_window.open(self.map, self.marker);
        });
        return marker;
    };
    this.define_icon_for_marker = function() {
        var refresh_day = this.define_refresh_day();
        var right = this.DAYS.slice(refresh_day);
        var left = this.DAYS.slice(0, refresh_day);
        var sorted_days_by_freshness = right.concat(left);
        var today = new Date();
        var day_of_week = this.DAYS[today.getDay()];
        var index = sorted_days_by_freshness.indexOf(day_of_week);
        var icon = this.icon_base + this.icons[index];
        console.log("Today image is: " + icon + " because refresh day is: " + this.DAYS[refresh_day]);
        return icon;
    };
    this.show = function(time) {
        time = time || 0;
        setTimeout(function() {
            self.create_marker();
        }, time);
    };
    this.create_content = function() {
        var html = new EJS({url: 'templates/second_hand.ejs'}).render(self.shop);
        return html;
    };
    this.create_info_window = function(content) {
        var info_window = new google.maps.InfoWindow({
            content: content
        });
        this.info_window = info_window;
        google.maps.event.addListener(this.info_window, 'domready', function() {
            var days = $('td[data-role=day]');
            new RefreshDay(days);
        });
        return this.info_window;
    };
    self.init(shop, map);
}
;
