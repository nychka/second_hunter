function Template() {
    var self = this;
    this.postfix = '_ejs';
    this.templates = [];
    this.init = function() {
        //initialize
        console.log("hello");
    };
    this.render = function(template, options){
        var template = this.get(template);
        var html = new EJS(template).render(options);
        return html;
    };
    this.append_to_DOM = function(template, html){
        var id = template + this.postfix;
        var div = $('<textarea></textarea>', {id: id});
        div.val(html);
        div.appendTo($('body'));
    };
    /**
     * Витягування шаблону
     * @returns {undefined}
     */
    this.get = function(template) {
        var template = this.find(template) || this.load(template);
        if (!template)throw new Error("template was not found");
        return template;
    };
    this.get_templates = function() {
        return this.templates;
    };
    this.find = function(template) {
        var result = false;
       this.templates.forEach(function(item) {
            if (item.title === template) {
                result = item;
                return;
            }
        });
        return result;
    };
    /**
     * Завантажує шаблон і зберігає у сховищі
     * @returns {undefined}
     */
    this.load = function(title, callback) {
        var path = '/template/' + title;
        var result = null;
        try {
            $.ajax({
                url: path,
                async: false,
                success: function(html) {
                    //console.log(html);
                    self.save(title, html);
                    if (callback)
                        callback.call(self);
                }
            });
            result = this.find(title);
            return result;
        } catch (e) {
            console.log(e);
            result =  false;
        }finally {
            return result;
        }
    };
    this.save = function(title, html) {
        var obj = {title: title, html: html};
        try {
            var result = self.templates.push(obj);
            //this.append_to_DOM(title, html);
            if (!result)
                throw new Error("Error while adding new template");
        } catch (e) {
            console.log(e);
        }
    };
    this.init();
}
;
