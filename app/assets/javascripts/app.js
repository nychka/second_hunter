$(document).ready(function() {
    window.app = {};
    app.$aside = $('#aside');
    app.$context = $('#map-canvas');
    app.template = new Template();
    app.google_map = new GoogleMap();

    /*google.maps.event.addListener(app.google_map.map, 'dragend', function() {
        console.log("drag end");
    });*/
    /**
     * Завантажує один раз потрібний темплейнт
     *  в залежності від прав користувачів
     */
    app.template.pre_load('second_hand')
            .then(app.google_map.set_shop_markers)
            .then(function(seconds) {
                seconds.forEach(function(second) {
                    google.maps.event.addListener(second.info_window, 'domready', function() {
                        app.$context.trigger('second-info-window-opened');
                    });
                    google.maps.event.addListener(second.marker, 'click', function() {
                        app.$context.trigger('second-marker-clicked');
                    });
                });
            });
    app.template.pre_load('legend_item');
    app.template.pre_load('add_second').then(function() {
        $('#add_second_hand').on('click', function() {
            app.$context.trigger('click-add-second-button');
        });
    });
    app.$context.bind('second-info-window-opened', function() {
        console.log("second-info-window-opened");
    });
    app.$context.bind('click-add-second-button', function() {
        if (app.$aside.is(":visible")) {
            $('#add_second_cancel').click();
            return false;
        }
        app.template.get('add_second', {}).then(function(html) {
            app.$aside.show().html(html);
            $('#city').val(app.google_map.current_city);
            app.google_map.add_second_marker();
            $('#add_second_cancel').on('click', function() {
                app.$aside.hide().empty();
                app.google_map.remove_add_second_marker();
            });
            $('#second_address').on('mouseleave blur', function() {
                var street = $(this).val();
                app.google_map.get_lat_lng_from_address(street);
            });
        });
    });
});