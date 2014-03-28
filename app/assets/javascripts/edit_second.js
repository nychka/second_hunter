$(document).ready(function() {
    app.$context.bind('second-info-window-opened', function() {
        var form = $('#edit_second');
        var id = form.data('second-id');
        var star = $('#star');
        var status = $('#status');
        var save = $('#save').hide();
        var cancel = $('#cancel').hide();
        var input = $('<input />', {type: 'text', class: 'form-control'});
        var pencil = $('<span></span>', {id: 'pencil', class: 'glyphicon glyphicon-pencil'});
        var edittable = $('[data-edit=true]');
        save.off().on('click', function(e) {
            e.preventDefault();
            var data = form.serialize();
            $.post(form.attr('action'), data).done(function(response) {
                if (response.status === "ok") {
                    //1. замінити оновлені поля або сам маркер
                    app.google_map.replace_second(id, response.data);
                    app.alert("Секонд-хенд успішно оновлений");
                } else {
                    app.alert(response.message, "error");
                }
            }).fail(function(error) {
                app.alert("Помилка при оновленні: " + error.status + " - " + error.statusText, "error");
               //console.log(error);
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
            cancel.hide();
            save.hide();
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
                    save.show();
                    cancel.show();
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
                            app.alert(response.message, "error");
                        }
                    }).fail(function(error) {
                        app.alert("Помилка при добавленні в улюблені: " + error.status + " - " + error.statusText, "error");
                       //console.log(error);
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
        status.off().on('click', function() {
            toggle_status($(this));
            $.post('/edit/second/status/' + id).done(function(response) {
                if (response.status === "ok") {
                    app.google_map.replace_second(id, response.data);
                    app.alert(response.message);
                } else {
                    app.alert(response.message, "error");
                }
            }).fail(function(error) {
                app.alert("Помилка при зміні статусу: " + error.status + " - " + error.statusText, "error");
               //console.log(error);
            });
        }).on('mouseenter', function() {
            toggle_status($(this));
        }).on('mouseleave', function() {
            toggle_status($(this));
        });

        // --- trash ---
        $('#trash').off().on('click', function(e) {
            e.preventDefault();
            if (!confirm("Ви дійсно хочете видалити секонд-хенд?"))
                return false;
            $.post('/delete/second/' + id).done(function(response) {
               //console.log(response);
                if (response.status === "ok") {
                    if (app.google_map.remove_second(id))
                        app.alert(response.message);
                } else {
                    app.alert(response.message, "error");
                }
            }).fail(function(error) {
                app.alert("Помилка при видалені: " + error.status + " - " + error.statusText, "error");
               //console.log(error);
            });
        });
        // --- end trash --- 
    });
});