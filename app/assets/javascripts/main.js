$(document).ready(function(){
   var refresh_day = new RefreshDay($('input[data-role=day]'));
   $('#add_second_hand').on('click', function(){
       //TODO: create popup with form
      window.location.href = '/new';
   });
});
//Google Maps Initialization
google.maps.event.addDomListener(window, 'load', function() {
    google_map = new GoogleMap();
    google_map.init();
    google_map.set_shop_markers();
  });



