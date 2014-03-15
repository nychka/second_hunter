function RefreshDay(days) {
    var self = this;
    this.init = function(days) {
        //TODO: days instanceof jQuery
        this.days = days;
        this.refresh_class = 'refreshDay';
        
        this.days.off('keyup').on('keyup', function(e) {
            self.run();
        });
        self.run();
    };
    this.run = function() {
        console.log("refresh day is running");
        self.days_are_filled() ? self.define_refresh_day() : self.reset();
    };
    this.get_value = function(day){
      if(day.is("input")) return day.val();
      return day.html();
    };
    /**
     * Повертає індекс інпута, з максимальною ціною
     * @returns {Number}
     */
    this.get_max_index = function() {
        var max_index = 0;
        var max_price = 0;
        self.days.each(function(i) {
            var day = $(this);
            var price = parseInt(self.get_value(day));
            if (price > max_price) {
                max_index = i;
                max_price = price;
            }
        });
        return max_index;
    };
    this.reset = function() {
        this.days.removeClass(this.refresh_class);
    };
    this.refresh = function(index) {
        this.reset();
        $(this.days[index]).addClass(this.refresh_class);
    };
    /**
     * 
     * Визначає день оновлення
     */
    this.define_refresh_day = function() {
        self.refresh(self.get_max_index());
    };
    /**
     * Перевіряє чи усі дні заповнені
     * @returns {Boolean}
     */
    this.days_are_filled = function() {
        var flag = true;
        this.days.each(function() {
            var day = $(this);
            var val = self.get_value(day);
            if (val === "" || val === null || val === undefined) {
                flag = false;
                return;
            }
        });
        return flag;
    };
    this.init(days);
}
