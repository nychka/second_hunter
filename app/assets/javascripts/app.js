$(document).ready(function() {
    if (!window.hasOwnProperty("app")) {
        app = {};
    }
    app.$aside = $('#aside');
    app.$context = $('#map-canvas');
    app.template = new Template();
    app.google_map = new GoogleMap();
    //console.log(app);
    setTimeout(function() {
        var legend = $('#legend');
        var height = legend.find('thead').height();
        var margin = "-" + ($('#legendContainer').height() - height) + "px";
        //console.log(margin);
        //legend.css({marginBottom: margin});
        legend.off().on('click', function() {
            var $this = $(this);
            var marginBottom = $this.css("marginBottom");
            if (parseInt(marginBottom) === 0) {
                $this.finish().animate({marginBottom: margin});
            } else {
                $this.finish().animate({marginBottom: "0px"});
            }
        }).click();
    }, 3000);

    $.notific8('configure', {
        life: 5000,
        theme: 'lime', //ruby for error
        sticky: false,
        horizontalEdge: 'top',
        heading: 'Успішно :)',
        verticalEdge: 'right',
        zindex: 1500
    });
    app.alert = function(message, status) {
        var settings = {};
        if (status === "error")
            settings = {theme: 'ruby', heading: 'Помилка :('};
        if (status === "warning")
            settings = {theme: 'lemon', heading: 'Увага!'};
        $.notific8(message, settings);
    };
    /**
     * Завантажує один раз потрібний темплейнт
     *  в залежності від прав користувачів
     */
    app.template.pre_load('second_hand')
            .then(app.google_map.get_seconds)
            .then(function(seconds) {
                //app.alert("Кіл-ть секондів - " + seconds.length + " завантажено!");
            });
    app.template.pre_load('legend_item');
    app.template.pre_load('add_second').then(function() {
        $('#add_second_hand').on('click', function() {
            app.$context.trigger('click-add-second-button');
        });
    });
    app.$context.bind('second-info-window-opened', function(e, data) {
        //console.log(app.user.role);
        //console.log(data.shop);
        //console.log(app.user.can("edit", data.shop));

        var parent = $(data.parent);
        var form = parent.find('#edit_second');

        if (!app.user.can("edit", data.shop)) {
            //видалити всі buttons
            form.children(":first").unwrap();
            return false;
        }

        var id = form.data('second-id');
        var star = parent.find('#star');
        var trash = parent.find('#trash');
        var status = parent.find('#status');
        var save = parent.find('#save');
        var cancel = parent.find('#cancel');
        var input = $('<input />', {type: 'text', class: 'form-control'});
        var pencil = $('<span></span>', {id: 'pencil', class: 'glyphicon glyphicon-pencil'});
        var edittable = parent.find('[data-edit=true]');
        form.off().on('submit', function(e) {
            e.preventDefault();
            var data = form.serialize();
            $.post(form.attr('action'), data).done(function(response) {
                if (response.status === "ok") {
                    //1. замінити оновлені поля або сам маркер
                    app.google_map.replace_second(id, response.data);
                    //2. оновити дані у формі та нажати відміна
                    edittable.find('input[data-original]').each(function() {
                        var $this = $(this),
                                val = $this.val();
                        //console.log(val);
                        $this.attr('data-original', val);
                    });
                    cancel.click();
                    app.alert("Секонд-хенд успішно оновлений");
                } else {
                    app.alert(response.message || response, "error");
                }
            }).fail(function(error) {
                app.alert("Помилка при оновленні: " + error.status + " - " + error.statusText, "error");
                ////console.log(error);
            });
        });
        cancel.off().on('click', function(e) {
            e.preventDefault();
            edittable.find('input').each(function() {
                var input = $(this);
                var val = input.attr('data-original');
                $(this).parent().text(val);
                input.remove();
            });
            cancel.addClass('unvisible');
            save.addClass('unvisible');
        });

        edittable.off().on('mouseenter', function() {
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
                    var pattern = $this.data('match');
                    ($this.data('role') === 'price') ? name = "price[" + name + "]" : name;
                    save.removeClass('unvisible');
                    cancel.removeClass('unvisible');
                    $this.text("");
                    //1. замінюємо інпутом
                    input.clone()
                            .attr('data-original', val)
                            .attr('name', name)
                            .attr('pattern', pattern)
                            .val(val).appendTo($this);
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
        star.off()
                .on('mouseenter', function() {
                    $(this).removeClass(star_leave_class).addClass(star_enter_class);
                })
                .on('mouseleave', function() {
                    $(this).removeClass(star_enter_class).addClass(star_leave_class);
                })
                .on('click', function() {
                    $.post('/add/star/' + id).done(function(response) {
                        if (response.status === "ok") {
                            app.alert(response.message);
                        } else {
                            app.alert(response.message || response, "error");
                        }
                    }).fail(function(error) {
                        app.alert("Помилка при добавленні в улюблені: " + error.status + " - " + error.statusText, "error");
                        ////console.log(error);
                    });
                });
        // --- end star --- 

        var toggle_status = function(status) {
            if (status.hasClass('status-trusted')) {
                status.removeClass('status-trusted');
            } else {
                status.addClass('status-trusted');
            }
        };
        if (app.user.can("set_status", data.shop)) {
            status.off().on('click', function() {
                toggle_status($(this));
                $.post('/edit/second/status/' + id).done(function(response) {
                    if (response.status === "ok") {
                        app.google_map.replace_second(id, response.data);
                        app.alert(response.message);
                    } else {
                        app.alert(response.message || response, "error");
                    }
                }).fail(function(error) {
                    app.alert("Помилка при зміні статусу: " + error.status + " - " + error.statusText, "error");
                    ////console.log(error);
                });
            }).on('mouseenter', function() {
                toggle_status($(this));
            }).on('mouseleave', function() {
                toggle_status($(this));
            });
        }
        // --- trash ---
        if (app.user.can("delete", data.shop)) {
            trash.removeClass('unvisible').off().on('click', function(e) {
                e.preventDefault();
                if (!confirm("Ви дійсно хочете видалити секонд-хенд?"))
                    return false;
                $.post('/delete/second/' + id).done(function(response) {
                    ////console.log(response);
                    if (response.status === "ok") {
                        if (app.google_map.remove_second(id))
                            app.alert(response.message);
                        $('.glyphicon-remove').click();
                    } else {
                        app.alert(response.message || response, "error");
                    }
                }).fail(function(error) {
                    app.alert("Помилка при видалені: " + error.status + " - " + error.statusText, "error");
                    ////console.log(error);
                });
            });
        }
        // --- end trash --- 
    });
    app.$context.bind('close-add-second-form', function() {
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
            $('#second_address').on('blur', function() {
                var street = $(this).val();
                app.google_map.get_lat_lng_from_address(street);
            });
            $('#add-second-form').on('submit', function(e) {
                e.preventDefault();
                var data = $(this).serialize();
                var action = $(this).attr('action');
                $.post(action, data)
                        .done(function(response) {
                            ////console.log(response);
                            if (response.status === "ok") {
                                app.alert(response.message);
                                app.google_map.add_second(response.data);
                            } else {
                                app.alert(response || response.message, "error");
                            }
                        }).fail(function(error) {
                    ////console.log(error);
                    app.alert("Помилка при добавленні: " + error.status + " - " + error.statusText, "error");
                });
            });
        });
    });
});