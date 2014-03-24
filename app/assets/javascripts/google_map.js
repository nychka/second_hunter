function GoogleMap() {
    var self = this;
    this.init = function() {
        this.position = new google.maps.LatLng(48.887535, 24.707565);
        this.geocoder = new google.maps.Geocoder();
        this.icon_base = "images/google_maps_markers/cool/PNG/";
        this.current_city = "Івано-Франківськ";
        var mapOptions = {
            center: self.position,
            zoom: 12
        };
        this.map = new google.maps.Map(document.getElementById("map-canvas"),
                mapOptions);
        this.seconds = [];
        this.create_legend().then(function(legend) {
            self.add_legend(legend);
        });
        this.add_search_box();
        this.add_footer_to_map();
    };
    this.add_footer_to_map = function() {
        var input = document.getElementById('footer');
        this.map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(input);
    };
    this.add_search_box = function() {
        var input = document.createElement('input');
        input.setAttribute('id', 'search-box');
        input.setAttribute('placeholder', "Пошук міста");
        this.map.controls[google.maps.ControlPosition.TOP_CENTER].push(input);
        this.search_box = new google.maps.places.SearchBox((input));
        google.maps.event.addListener(this.search_box, 'places_changed', function() {
            var places = self.search_box.getPlaces();
            console.log(places);
            if (places.length !== 1) {
                alert("Виберіть саме місто");
            }
            if (places.length === 1) {
                var place = places[0];
                if (place.types[0] === 'locality') { // <= should be ['locality', 'political']
                    self.current_city = place.name; // <= "Івано-Франківськ"
                    self.map.setCenter(place.geometry.location);
                } else {
                    alert("Виберіть саме місто");
                }
            }
        });
        return this.search_box;
    };
    this.add_second_marker = function() {
        var position = this.map.getCenter();
        this.new_second_marker = new google.maps.Marker({
            map: self.map,
            position: position,
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
        }, function(err) {
            console.log(err);
            //1.Повертати маркер до поточного міста
            //2.Очистити вулицю
             $('#second_address').val("");
            //3.Відкрити вікно на маркері з текстом про помилку
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
        $('.legend tr[data-role=new_second]').remove();
    };
    this.find_city_from_results = function(results) {
        console.log(results);
        if (results && results.length) {
            for (var i in results) {
                var result = results[i], type = result.types[0];
                if (type === 'locality') {
                    var city = result.address_components[0].long_name;
                    console.log("Found city: " + city);
                    return city;
                }
            }
            return false;
        }else {
            throw new Error("Bad results");
        }
    };
    this.get_city_from_lat_lng = function(location, callback, errback) {
        this.geocoder.geocode({'latLng': location}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                console.log(results);
                var city = null;
                if (city = self.find_city_from_results(results)) {
                    callback.call(self, city);
                    return true;
                } else {
                    errback(self, "City was not found");
                }
                return false;
            }
        });
    };
    this.get_address_from_lat_lng = function(lat, lng, callback, errback) {

        var latlng = new google.maps.LatLng(lat, lng);
        this.geocoder.geocode({'latLng': latlng}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                console.log(results);
                if (results.length) {
                    var result = results[0];
                    if (result.types[0] === "street_address") {
                        var street_number = result.address_components[0];
                        var route = result.address_components[1];
                        if (street_number.types[0] === "street_number" &&
                                route.types[0] === "route") {
                            street_number = street_number.long_name;
                            route = route.long_name;
                            var city = self.find_city_from_results(results);
                            if (city !== self.current_city) {
                                errback.call(self, "City: " + city + " is not current city: " + self.current_city);
                            }
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
    this.add_icon_to_legend = function(icon, text, role) {
        var data = {icon: icon, title: text, role: role};
        var template = app.template.get('legend_item', data).then(function(html) {
            $('.legend tbody').prepend(html);
        });
        return template;
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
        var html = app.template.get('legend', {icons: icons}).then(function(html) {
            var div = document.createElement('div');
            div.innerHTML = html;
            return div;
        });
        return html;
    };
    this.add_legend = function(legend) {
        this.map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);
    };
    this.set_shop_markers = function() {
        return new Promise(function(resolve, reject) {
            $.get('/shops').done(function(shops) {
                for (var i in shops) {
                    var second = new Second(shops[i], self.map);
                    second.create_marker();
                    self.seconds.push(second);
                }
                if (shops.length === self.seconds.length) {
                    resolve(self.seconds);
                } else {
                    reject("Some seconds are missed!");
                }
            }, function(err) {
                reject(err);
            });
        });
    };
    this.init();
}
;
function Second(shop, map) {
    var self = this;
    this.init = function(shop, map) {
        this.DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        this.shop = shop;
        this.second_show_time = 200;
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
        self.create_content().then(function(content) {
            self.create_info_window(content);
        });
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
        time = (time * self.second_show_time) || 0;
        setTimeout(function() {
            self.create_marker();
        }, time);
    };
    this.create_content = function() {
        var html = app.template.get('second_hand', self.shop);
        return html;
    };
    this.create_info_window = function(content) {
        var info_window = new google.maps.InfoWindow({
            content: content
        });
        this.info_window = info_window;
        google.maps.event.addListener(this.info_window, 'domready', function() {
            console.log("inside second class");
            var days = $('td[data-name=' + self.DAYS[self.refresh_day] + ']').addClass('refreshDay');
            var today = new Date().getDay();
            $('td[data-name=' + self.DAYS[today] + ']').addClass('today');
            //new RefreshDay(days);
        });
        return this.info_window;
    };
    self.init(shop, map);
}
;
