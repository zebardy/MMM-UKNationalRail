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
      if (config.token === null) {
        return;
      }
      this.rail = new Rail(config.token);
    }

    var options = {};

    options.rows = config.fetchRows;

    if (config.filterDestination !== "") {
      options.destination = config.filterDestination;
    }

    Log.info("Sending request for departure board information: station - " + config.station + " rows - " + options.rows);
    this.rail.getDepartureBoard(
      config.station,
      options,
      function (error, result) {

        if (!error) {
          Log.info("Return from getDepartureBoard: " + result.toString());
          self.sendSocketNotification("UKNR_DATA_"+config.station, result);
        } else {
          Log.info("Return from getDepartureBoard: " + error.toString() + " - " + result);
        }
      }
    );
  },

  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      case "UKNR_TRAININFO":
        Log.info("MMM-UKNationalRail train info request");
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
