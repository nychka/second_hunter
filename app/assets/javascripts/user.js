function User(user) {
        var self = this;
        this.init = function(user) {
          this.name = user.name;
          this.id = user.id.$oid;
          this.role = user.role;
        };
        this.can = function(operation, shop) {
          if(!shop)return false;
          if (this.role === "hunter")
            return true;
          //operation edit, set_status, delete
          if (this.role === "user") {
              if(operation === "set_status")return false;
              if(this.added_by_user(shop)){
                return true;
              }
          }
          return false;
        };
      this.added_by_user = function(shop) {
        return shop.user_id.$oid === this.id;
      };
      this.about = function() {
        console.log(this.name + " has role: " + this.role + " and id: " + this.id);
      };
      this.init(user);
      };
