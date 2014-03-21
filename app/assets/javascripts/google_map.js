function GoogleMap() {
    var self = this;
    this.init = function() {
        this.position = new google.maps.LatLng(48.887535, 24.707565);
        this.geocoder = new google.maps.Geocoder();
        //app.template = app.template;
        this.icon_base = "images/google_maps_markers/cool/PNG/";
        var mapOptions = {
            center: self.position,
            zoom: 12
        };
        this.map = new google.maps.Map(document.getElementById("map-canvas"),
                mapOptions);
        this.seconds = [];
        this.second_show_time = 200;
        this.add_legend(this.create_legend());
    };
    this.add_second_marker = function() {
        this.new_second_marker = new google.maps.Marker({
            map: self.map,
            position: self.position,
            icon: self.icon_base + "pin-green-solid-13.png",
            draggable: true
        });
        var icon = this.new_second_marker.getIcon();
        var title = "Новий секонд";
        var role = "new_second";
        this.add_icon_to_legend(icon, title, role);

        google.maps.event.addListener(this.new_second_marker, "dragend", function() {
            var pos = self.new_second_marker.getPosition();
            self.set_new_second_location(pos.lat(), pos.lng());
        });
    };
    this.set_new_second_location = function(lat, lng) {
        //1. геокодуємо координати у вулицю
        self.get_address_from_lat_lng(lat, lng, function(address) {
            //2. записуємо вулицю в поле адреси
            $('#second_address').val(address.formatted_address);
            //3. записуємо координати в приховані поля форми
            self.set_hidden_lat_lng(lat, lng);
        });
    };
    /*
     * Геокодування адреси в координати
     */
    this.get_lat_lng_from_address = function(address) {
        //var address = document.getElementById("address").value;
        this.geocoder.geocode({'address': address}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                var location = results[0].geometry.location;
                self.map.setCenter(location);
                self.new_second_marker.setPosition(location);
                self.set_hidden_lat_lng(location.lat(), location.lng());
            } else {
                alert("Geocode was not successful for the following reason: " + status);
            }
        });
    };
    this.set_hidden_lat_lng = function(lat, lng) {
        if (lat && lng) {
            $('#lat').val(lat);
            $('#lng').val(lng);
        } else {
            throw new Error("Location isn't correct!");
        }
    };
    this.remove_add_second_marker = function() {
        this.new_second_marker.setMap(null);
        //TODO: видалити іконку
        $('.legend tr[data-role=new_second]').remove();
    };
    this.get_address_from_lat_lng = function(lat, lng, callback) {

        var latlng = new google.maps.LatLng(lat, lng);
        this.geocoder.geocode({'latLng': latlng}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                var results = results[0];
                if (results) {
                    //TODO: перевірка на прилягаємість до поточного міста
                    if (results.types[0] === "street_address") {
                        var street_number = results.address_components[0];
                        var route = results.address_components[1];
                        if (street_number.types[0] === "street_number" &&
                                route.types[0] === "route") {
                            street_number = street_number.long_name;
                            route = route.long_name;

                            var address = {street_number: street_number,
                                street_name: route};
                            address.formatted_address = address.street_name + "," + address.street_number;
                            console.log(address);
                            callback.call(self, address);
                            return true;
                        } else {
                            alert("Address should have street number and street name!");
                        }
                    } else {
                        alert("Address is not street!");
                    }
                }
            } else {
                alert("Geocoder failed due to: " + status);
            }
        });
        $('#second_address').val("");
    };
    //TODO: доробити
    this.add_icon_to_legend = function(icon, text, role) {
        var data = {icon: icon, title: text, role: role};
        var html = app.template.render('legend_item', data);
        $('.legend tbody').prepend(html);
    };
    //TODO: добавляти нові елементи при різних умовах
    this.create_legend = function() {
        var base = this.icon_base;
        console.log(base);
        var icons = [
            {image: base + "pin-red-solid-15.png", title: "День оновлення", role: "show_day"},
            {image: base + "pin-yellow-solid-15.png", title: "День після оновлення", role: "show_day"},
            {image: base + "pin-blue-solid-15.png", title: "Звичайний день", role: "show_day"}
        ];
        var html = app.template.render('legend', {icons: icons});
        var div = document.createElement('div');
        div.innerHTML = html;
        return div;
    };
    this.add_legend = function(legend) {
        this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);
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
        this.shop = shop;
        this.position = {lng: shop.lng, lat: shop.lat};
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
        var content = self.create_content();
        self.create_info_window(content);
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
        var z_index = self.set_z_index_for_marker();
        console.log("zIndex: " + z_index + " because refresh_day: " + this.refresh_day);
        var marker = new google.maps.Marker({
            map: self.map,
            position: self.position,
            icon: icon,
            zIndex: z_index,
            animation: google.maps.Animation.DROP
        });
        self.marker = marker;
        console.log(this.marker);
        google.maps.event.addListener(self.marker, 'click', function() {
            self.info_window.open(self.map, self.marker);
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
        console.log("refresh priority: " + index);
        var icon = this.icon_base + this.icons[index];
        console.log("Today image is: " + icon + " because refresh day is: " + this.DAYS[this.refresh_day]);
        return icon;
    };
    this.show = function(time) {
        time = time || 0;
        setTimeout(function() {
            self.create_marker();
        }, time);
    };
    this.create_content = function() {
        var html = app.template.render('second_hand', self.shop);
        return html;
    };
    this.create_info_window = function(content) {
        var info_window = new google.maps.InfoWindow({
            content: content
        });
        this.info_window = info_window;
        google.maps.event.addListener(this.info_window, 'domready', function() {
            var days = $('td[data-day=' + self.DAYS[self.refresh_day] + ']').addClass('refreshDay');
            var today = new Date().getDay();
            $('td[data-day=' + self.DAYS[today] + ']').addClass('today');
            //new RefreshDay(days);
        });
        return this.info_window;
    };
    self.init(shop, map);
}
;
