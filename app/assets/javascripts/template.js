function Template() {
    var self = this;
    this.templates = [];
    this.init = function() {
        //initialize
    };
    this.get = function(template, options) {
        var data = null,
            path = '/template/' + template,
            promise = new Promise(function(resolve, reject) {
            if (data = self.find(template)) {
                resolve(self.ejs_render(data, options));
            }else {
                $.get(path).done(function(response) {
                    self.save(template, response);
                    console.log(self.templates);
                    if (data = self.find(template)) {
                        resolve(self.ejs_render(data, options));
                    } else {
                        reject("Template was not saved");
                    }
                }, function(err){
                   reject(err);
                });
            }
        });
        return promise;
    };
    this.pre_load = function(template){
        return this.get(template);
    };
    this.ejs_render = function(obj, options) {
        if (!obj)throw new Error("Must be object");
        if(options){
            return new EJS(obj).render(options);
        }else {
            return new EJS(obj);
        }
    };
    this.get_templates = function() {
        return this.templates;
    };
    this.find = function(template) {
        for(var i in this.templates){
            var item = this.templates[i];
            if (item.title === template) return item;
        }
        return false;
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
