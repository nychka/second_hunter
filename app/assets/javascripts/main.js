$(document).ready(function() {
    var aside = $('#aside');
    var map = $('#map-canvas');
    window.app = {};
    app.template = new Template();
    app.google_map = new GoogleMap();
    app.google_map.init();
    app.google_map.set_shop_markers();
    //TODO: повторний виклик форми!
    $('#add_second_hand').on('click', function() {
        //if form is visible click cancel
        if(aside.is(":visible")) {
            $('#add_second_cancel').click();
            return false;
        }
        var html = app.template.render('add_second', {});
        aside.show().html(html).addClass('divider');
        map.addClass('divider');
        app.google_map.add_second_marker();
        $('#add_second_cancel').on('click', function() {
            aside.hide().empty().removeClass('divider');
            map.removeClass('divider');
            app.google_map.remove_add_second_marker();
        });
        $('#second_address').on('blur', function(){
           var city = $('#city option:selected').text();
           var street = $(this).val();
           var address = street + "," + city + "," + "Україна";
           app.google_map.get_lat_lng_from_address(address);
        });
    });
});
//Google Maps Initialization
google.maps.event.addDomListener(window, 'load', function() {
    //load
});



