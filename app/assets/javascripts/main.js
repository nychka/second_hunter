$(document).ready(function() {
    var refresh_day = new RefreshDay($('input[data-role=day]'));
    var aside = $('#aside');
    var map = $('#map-canvas');
    $('#add_second_hand').on('click', function() {
        var html = new EJS({url: 'templates/add_second.ejs'}).render({});
        aside.show().html(html).addClass('divider')
        map.addClass('divider');
        google_map.add_second_marker();
        $('#add_second_cancel').on('click', function() {
            aside.hide().removeClass('divider');
            map.removeClass('divider');
        });
        $('#second_address').on('blur', function(){
           var city = $('#city option:selected').text();
           var street = $(this).val();
           var address = street + "," + city + "," + "Україна";
           google_map.get_lat_lng_from_address(address);
        });
    });
});
//Google Maps Initialization
google.maps.event.addDomListener(window, 'load', function() {
    google_map = new GoogleMap();
    google_map.init();
    google_map.set_shop_markers();
});



