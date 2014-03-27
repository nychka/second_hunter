$(document).ready(function() {
    window.app = {};
    app.$aside = $('#aside');
    app.$context = $('#map-canvas');
    app.template = new Template();
    app.google_map = new GoogleMap();

    $.notific8('configure', {
        life: 5000,
        theme: 'lime', //ruby for error
        sticky: false,
        horizontalEdge: 'top',
        heading: 'Успішно :)',
        verticalEdge: 'right',
        zindex: 1500
    });
    app.alert = function(message, status){
        var settings = {};
        if(status === "error")settings = {theme: 'ruby', heading: 'Помилка :('};
        if(status === "warning")settings = {theme: 'lemon', heading: 'Увага!'};
        $.notific8(message, settings);
    };
    /**
     * Завантажує один раз потрібний темплейнт
     *  в залежності від прав користувачів
     */
    app.template.pre_load('second_hand')
            .then(app.google_map.get_seconds)
            .then(function(seconds) {
                app.alert("Кіл-ть секондів - " + seconds.length + " завантажено!");
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
    app.$context.bind('close-add-second-form', function(){
        if (app.$aside.is(":visible")) {
            app.$aside.find($('#add_second_cancel')).click();
            return true;
        }
        throw new Error("You're trying to close form, but it's not opened!");
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
                app.google_map.remove_new_second_marker();
            });
            $('#second_address').on('mouseleave blur', function() {
                var street = $(this).val();
                app.google_map.get_lat_lng_from_address(street);
            });
            $('#add-second-form').on('submit', function(e){
               e.preventDefault();
               var data = $(this).serialize();
               var action = $(this).attr('action');
               $.post(action, data)
                 .done(function(response){
                   console.log(response);
                   if(response.status === "ok"){
                       app.alert(response.message);
                       app.google_map.add_second(response.data);
                   }else {
                       app.alert(response || response.message, "error");
                   }
               }).fail(function(error){
                   console.log(error);
                   app.alert("Помилка при добавленні: " + error.status + " - " + error.statusText, "error");
               });
            });
        });
    });
});