$(document).ready(function() {
    var aside = $('#aside');
    var map = $('#map-canvas');
    window.app = {};
    app.context = map;
    app.template = new Template();
    app.google_map = new GoogleMap();

    /*google.maps.event.addListener(app.google_map.map, 'center_changed', function(){
       console.log("center was changed");
       var location = app.google_map.map.getCenter();
        if(app.google_map.new_second_marker &&
                app.google_map.new_second_marker.map){
            app.google_map.new_second_marker.setPosition(location);
        } 
    });*/
    google.maps.event.addListener(app.google_map.map, 'dragend', function() {
        console.log("drag end");
        
        //2. Визначаємо місто по координатах
        /*app.google_map.get_city_from_lat_lng(location, function(city) {
            //3. Записуємо в поле місто у формі добавлення секонду
            console.log(city);
            if ($('#add-second-form')[0].length) {
                $('#city').val(city);
            }
        });*/
    });


    app.template.pre_load('second_hand')
            .then(app.google_map.set_shop_markers)
            .then(function(seconds) {
                seconds.forEach(function(second) {
                    google.maps.event.addListener(second.info_window, 'domready', function() {
                        app.context.trigger('second-info-window-is-opened');
                    });
                    google.maps.event.addListener(second.marker, 'click', function() {
                        app.context.trigger('second-marker-is-clicked');
                    });
                });
            });
    app.template.pre_load('legend_item');
    app.template.pre_load('add_second').then(function() {
        app.context.trigger('click-add-second-button');
    });
    app.context.bind('second-info-window-is-opened', function() {
        console.log("second-info-window-is-opened");
        var form = $('#edit_second');
        var id = parseInt(form.data('second-id'));
        var star = $('#star');
        var status = $('#status');
        var save = $('#save').hide();
        var cancel = $('#cancel').hide();
        var input = $('<input />', {type: 'text', class: 'form-control'});
        var pencil = $('<span></span>', {id: 'pencil', class: 'glyphicon glyphicon-pencil'});
        var edittable = $('[data-edit=true]');
        save.on('click', function(e) {
            e.preventDefault();
            console.log("saving");
            var data = form.serialize();
            console.log(data);
            $.post(form.attr('action'), data).done(function(success) {
                console.log(success);
            }, function(error) {
                console.log(error);
            });
        });
        cancel.on('click', function(e) {
            e.preventDefault();
            edittable.find('input').each(function() {
                var input = $(this);
                var val = input.attr('data-original');
                $(this).parent().text(val);
                input.remove();
            });
            cancel.hide();
            save.hide();
        });

        edittable.on('mouseenter', function() {
            if ($(this).is('input') || $(this).has('input').length)
                return false;
            $(this).append(pencil);
        })
                .on('mouseleave', function() {
                    if ($(this).is('input') || $(this).has('input').length)
                        return false;
                    pencil.remove();
                })
                .on('click', function(e) {
                    e.stopPropagation();
                    var $this = $(this);
                    if ($this.is('input') || $this.has('input').length)
                        return false;
                    var val = $this.text();
                    var name = $this.data('name');
                    save.show();
                    cancel.show();
                    $this.text("");
                    //1. замінюємо інпутом
                    input.clone().attr('data-original', val)
                            .attr('name', name).val(val).appendTo($this);
                });
        //--- star ---
        var star_enter_class, star_leave_class;
        if (star.hasClass('glyphicon-star')) {
            star_enter_class = 'glyphicon-star-empty';
            star_leave_class = 'glyphicon-star';
        } else {
            star_enter_class = 'glyphicon-star';
            star_leave_class = 'glyphicon-star-empty';
        }
        star
                .on('mouseenter', function() {
                    $(this).removeClass(star_leave_class).addClass(star_enter_class);
                })
                .on('mouseleave', function() {
                    $(this).removeClass(star_enter_class).addClass(star_leave_class);
                })
                .on('click', function() {
                    console.log('star');
                    $.post('/add/star/' + id).done(function(success) {
                        console.log(success);
                    }, function(err) {
                        console.log(err);
                    });
                });
        // --- end star --- 
      
        var toggle_status = function(status){
            if(status.hasClass('status-trusted')){
                status.removeClass('status-trusted');
            }else {
                status.addClass('status-trusted');
            }
        };
        status.on('click', function() {
            toggle_status($(this));
            $.post('/edit/second/status/' + id).done(function(success) {
                console.log(success);
            }, function(err) {
                console.log(err);
            });
        }).on('mouseenter', function(){
            toggle_status($(this));
        }).on('mouseleave', function(){
            toggle_status($(this));
        });

        // --- trash ---
        $('#trash').on('click', function(e) {
            e.preventDefault();
            if (!confirm("Ви дійсно хочете видалити секонд-хенд?"))
                return false;
            $.post('/delete/second/' + id).done(function(success) {
                console.log(success);
            }, function(err) {
                console.log(err);
            });
            console.log("I'm gonna destroy you " + id);
        });
        // --- end trash --- 
    });
    app.context.bind('click-add-second-button', function() {
        $('#add_second_hand').on('click', function() {
            if (aside.is(":visible")) {
                $('#add_second_cancel').click();
                return false;
            }
            app.template.get('add_second', {}).then(function(html) {
                aside.show().html(html);
                $('#city').val(app.google_map.current_city);
                app.google_map.add_second_marker();
                $('#add_second_cancel').on('click', function() {
                    aside.hide().empty().removeClass('divider');
                    map.removeClass('divider');
                    app.google_map.remove_add_second_marker();
                });
                $('#second_address').on('blur', function() {
                    var street = $(this).val();
                    var address = street + "," + app.google_map.current_city + "," + "Україна";
                    app.google_map.get_lat_lng_from_address(address);
                });
            });
        });
    });
});