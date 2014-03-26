function GoogleMap() {
    var self = this;
    this.init = function() {
        this.current_location = new google.maps.LatLng(48.887535, 24.707565);
        this.geocoder = new google.maps.Geocoder();
        this.icon_base = "images/google_maps_markers/cool/PNG/";
        this.current_city = "Івано-Франківськ";
        this.COUNTRY = "Україна";
        var mapOptions = {
            center: self.current_location,
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
            if (places.length !== 1) {
                alert("Виберіть саме місто");
            }
            if (places.length === 1) {
                var place = places[0];
                if (place.types[0] === 'locality') { // <= should be ['locality', 'political']
                    self.current_city = place.name; // <= "Івано-Франківськ"
                    self.current_location = place.geometry.location;
                    self.map.setCenter(self.current_location);
                    var add_form = $('#add-second-form');
                    if (add_form.length)
                        add_form.find('#add_second_cancel').click();
                } else {
                    alert("Виберіть саме місто");
                }
            }
        });
        return this.search_box;
    };
    this.get_back_new_second_marker = function() {
        if (!self.current_location instanceof google.maps.LatLng) {
            throw new Error("current location is undefined");
            alert("current location is undefined");
            return false;
        }
        if (this.new_second_marker && this.new_second_marker.map) {
            this.new_second_marker.setPosition(self.current_location);
        } else {
            alert('new second marker is undefined');
        }
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
            self.get_back_new_second_marker();
            //2.Очистити вулицю
            $('#second_address').val("");
            self.map.setCenter(self.current_location);
            //3.Відкрити вікно на маркері з текстом про помилку
        });
    };
    /*
     * Геокодування адреси в координати
     */
    this.get_lat_lng_from_address = function(street) {
        //var address = document.getElementById("address").value;
        var address = street + "," + app.google_map.current_city + "," + this.COUNTRY;
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
        //console.log(results);
        if (results && results.length) {
            for (var i in results) {
                var result = results[i], type = result.types[0];
                if (type === 'locality') {
                    var city = result.address_components[0].long_name;
                    //console.log("Found city: " + city);
                    return city;
                }
            }
            return false;
        } else {
            throw new Error("Bad results");
        }
    };
    this.get_city_from_lat_lng = function(location, callback, errback) {
        this.geocoder.geocode({'latLng': location}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                //console.log(results);
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
                //console.log(results);
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
                                return false;
                            }
                            var address = {street_number: street_number,
                                street_name: route};
                            address.formatted_address = address.street_name + "," + address.street_number;
                            //console.log(address);
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
    this.create_legend = function() {
        var base = this.icon_base;
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
