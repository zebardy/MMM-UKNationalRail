/* Timetable for Trains Module */

/* Magic Mirror
 * Module: UK National Rail
 *
 * By Nick Wootton
 * based on SwissTransport module by Benjamin Angst http://www.beny.ch
 * MIT Licensed.
 */

Module.register("MMM-UKNationalRail", {

    // Define module defaults
    defaults: {
        updateInterval: 5 * 60 * 1000, // Update every 5 minutes.
        animationSpeed: 2000,
        initialLoadDelay: 0, // start delay seconds.

        station: '', // CRS code for station
        token: '',

        filterDestination: '', // CRS code for station - only display departures calling here
        filterCancelled: false, // Filter out cancelled departures

        fetchRows: 20, // Maximum number of results to fetch (pre-filtering)
        displayRows: 10, // Maximum number of results to display (post-filtering)
        
        columns: [ 'platform', 'destination', 'origin', 'status', 'dep_estimated' ],
        
        debug: false
    },

    // Define required scripts.
    getStyles: function() {
        return ["trains.css", "font-awesome.css"];
    },

    // Define required scripts.
    getScripts: function() {
        return ["moment.js"];
    },

    //Define header for module.
    getHeader: function() {
        return this.data.header;
    },

    // Define start sequence.
    start: function() {
        Log.info("Starting module: " + this.name);

        // Set locale.
        moment.locale(config.language);

        this.trains = {};
        this.loaded = false;
        
        this.sendSocketNotification("UKNR_CONFIG", this.config);

        // Initial start up delay via a timeout
        this.updateTimer = setTimeout(() => {
            this.fetchTrainInfo();

            // Now we've had our initial delay, re-fetch our train information at the interval given in the config
            this.updateTimer = setInterval(() => {
                this.fetchTrainInfo();
            }, this.config.updateInterval);

        }, this.config.initialLoadDelay);
    },

    // Trigger an update of our train data
    fetchTrainInfo: function() {
        if (!this.hidden) {
            this.sendSocketNotification("UKNR_TRAININFO", { } );
        }
    },

    // Override dom generator.
    getDom: function() {
        var wrapper = document.createElement("div");

        if (this.config.station === "") {
            wrapper.innerHTML = "Please set the Station Code.";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        if (this.config.token === "") {
            wrapper.innerHTML = "Please set the OpenLDBWS token";
            wrapper.className = "dimmed light small";
            return wrapper;
        }

        if (!this.loaded) {
            wrapper.innerHTML = "Loading trains ...";
            wrapper.className = "dimmed light small";
            return wrapper;
        }
        
        if(this.trains.length === 0) {
           wrapper.innerHTML = "No trains found";
           wrapper.className = "dimmed light small";
           return wrapper
        }

        //Dump train data
        if (this.config.debug) {
            Log.info(this.trains);
        }

        var table = document.createElement("table");
        table.className = "small";

        for(var entry in this.trains) {
           var train = this.trains[entry];
           
           var row = document.createElement("tr");
           table.appendChild(row);
           
           for(var column in this.config.columns) {
              colName = this.config.columns[column];
              var cell = document.createElement("td");
              
              cell.innerHTML = train[colName];
              cell.className = colName;
              
              if(colName === "status") {
                 cell.className += " " + train[colName].replace(" ","").toLowerCase();
              }
              
              row.appendChild(cell);
           }
           
        }

        wrapper.appendChild(table);
        // *** End building results table

        return wrapper;
    },

    /* processTrains(data)
     * Uses the received data to set the various values.
     *
     * argument data object - Weather information received form openweather.org.
     */
    processTrains: function(data) {
       
       if (typeof data == 'undefined' || data == null) {
          return;
       }
       
       this.trains = [];
       
       for(var entry in data) {
          
          var train = data[entry];
          var status = "";
          
          // Run filters first
          if(train.etd === "Cancelled" && this.config.filterCancelled === true) {
             continue;
          }
          
          // Set status field appropriately
          if(train.etd === "Cancelled") {
             status = "Cancelled";
             train.etd = "";
          } else if(train.etd === "On time") {
             status = "On time";
             train.etd = train.std;
          } else if(train.etd && train.etd !== "") {
             status = "Late";
          }
          
          this.trains.push({
             "platform": train.platform !== undefined ? train.platform : "",
             "destination": train.destination.name,
             "origin": train.origin.name,
             "dep_scheduled": train.std,
             "dep_estimated": train.etd,
             "status": status
          });
       }
       
        this.loaded = true;
        this.updateDom(this.config.animationSpeed);
    },

    // Process data returned
    socketNotificationReceived: function(notification, payload) {
       
       switch(notification) {
       case "UKNR_DATA":
          this.processTrains(payload.trainServices);
          break;
       }
    }

});
