/* Magic Mirror
 * Module: UK National Rail
 *
 * Originally by Nick Wootton
 * Migrated to OpenLDBWS by Matt Dyson
 *
 * https://github.com/mattdy/MMM-UKNationalRail
 *
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const Rail = require("national-rail-darwin");
const Log = require("../../js/logger");

module.exports = NodeHelper.create({
  start: function () {
    Log.info("MMM-UKNationalRail helper started");

    this.started = false;
    this.config = null;
    this.rail = null;
  },

  getTimetable: function () {
    var self = this;

    if (this.rail === null) {
      return;
    }

    var options = {};

    options.rows = this.config.fetchRows;

    if (this.config.filterDestination !== "") {
      options.destination = this.config.filterDestination;
    }

    Log.info("Sending request for departure board information");
    this.rail.getDepartureBoard(
      this.config.station,
      options,
      function (error, result) {
        Log.info("Return from getDepartureBoard: " + error + " - " + result);

        if (!error) {
          self.sendSocketNotification("UKNR_DATA", result);
        }
      }
    );
  },

  socketNotificationReceived: function (notification, payload) {
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
