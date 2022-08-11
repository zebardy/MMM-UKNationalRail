/* Live Station Info */

/* Magic Mirror
 * Module: UK National Rail Info
 * By Nick Wootton
 * MIT Licensed.
 */

var NodeHelper = require('node_helper');
var request = require('request');
var Rail = require('national-rail-darwin');

module.exports = NodeHelper.create({

   start : function() {
      console.log('MMM-UKNationalRail helper started');

      this.started = false;
      this.config = null;
      this.rail = null;
   },

   getTimetable : function() {
      var self = this;
      var retry = true;

      this.rail.getDepartureBoard(this.config.station, {},
            function(err, result) {
               if (!error) {
                  self.sendSocketNotification('UKNR_DATA', JSON.parse(result));
               }
            });
   },

   socketNotificationReceived : function(notification, payload) {
      switch (notification) {

      case "UKNR_TRAININFO":
         this.getTimetable();
         break;

      case "UKNR_CONFIG":
         Log.info("MMM-UKNationalRail received configuration");
         this.config = payload;

         this.rail = new Rail(this.config.token);

         this.sendSocketNotification("UKNR_STARTED", true);
         this.getTimetable();
         this.started = true;
      }
   }

});
