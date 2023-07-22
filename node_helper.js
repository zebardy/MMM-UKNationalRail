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
    this.rail = null;
  },

  getTimetable: function (config) {
    var self = this;

    if (this.rail === null) {
      if (config.token === null {
        return;
      }
      this.rail = new Rail(config.token)
    }

    var options = {};

    options.rows = config.fetchRows;

    if (config.filterDestination !== "") {
      options.destination = config.filterDestination;
    }

    Log.info("Sending request for departure board information");
    this.rail.getDepartureBoard(
      config.station,
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
        this.getTimetable(payload);
        break;

      case "UKNR_CONFIG":
        Log.info("MMM-UKNationalRail received configuration");

        this.sendSocketNotification("UKNR_STARTED", true);
        this.getTimetable(payload);
        this.started = true;
    }
  }
});
