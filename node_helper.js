/* Live Station Info */

/* Magic Mirror
 * Module: UK National Rail Info
 * By Nick Wootton
 * MIT Licensed.
 */

const NodeHelper = require('node_helper');
const Rail = require('national-rail-darwin');
const Log = require("../../js/logger");

module.exports = NodeHelper.create({

   start : function() {
      Log.info('MMM-UKNationalRail helper started');

      this.started = false;
      this.config = null;
      this.rail = null;
   },

   getTimetable : function() {
      var self = this;
      var retry = true;

      if (this.rail === null) {
         return;
      }

      Log.info("Sending request for departure board information");
      this.rail.getDepartureBoard(this.config.station, {}, function(error,
            result) {
         Log.info("Return from getDepartureBoard: " + error + " - " + result);
         if (!error) {
            Log.info("Sending socket notification");
            self.sendSocketNotification('UKNR_DATA', JSON.parse(result));
            Log.info("Sent socket notification");
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
