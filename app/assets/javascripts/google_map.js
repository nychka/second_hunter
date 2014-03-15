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
    };
    this.set_shop_markers = function() {
        $.get('/shops', function(shops) {
            console.log(shops);
            for (var i in shops) {
                var second = new Second(shops[i], self.map);
                self.seconds.push(second);
            }
        });
    };
}
;
function Second(shop, map) {
    var self = this;
    this.init = function(shop, map) {
        this.position = {lng: shop.lng, lat: shop.lat};
        this.map = map;
        this.shop = shop;
        this.marker = this.create_marker();
        var content = self.create_content();
        this.info_window = self.create_info_window(content);
        google.maps.event.addListener(this.marker, 'click', function() {
            self.info_window.open(self.map, self.marker);
        });
        google.maps.event.addListener(this.info_window, 'domready', function() {
            var days = $('td[data-role=day]');
            new RefreshDay(days);
        });
    };
    this.create_marker = function() {
        var marker = new google.maps.Marker({
            map: self.map,
            position: self.position
        });
        return marker;
    };
    this.create_content = function() {
        var html = new EJS({url: 'templates/second_hand.ejs'}).render(self.shop);
        return html;
    };
    this.create_info_window = function(content) {
        var info_window = new google.maps.InfoWindow({
            content: content
        });
        return info_window;
    };
    self.init(shop, map);
}
;
