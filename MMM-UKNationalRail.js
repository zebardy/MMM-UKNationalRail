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
        fade: true,
        fadePoint: 0.25, // Start on 1/4th of the list.
        initialLoadDelay: 0, // start delay seconds.

        station: '', // CRS code for station
        token: '',

        destination: '',

        maxResults: 5, //Maximum number of results to display
        
        showOrigin: false, //Show origin of train
        showPlatform: true, //Show departure platform of train
        showActualDeparture: true, //Show real-time departure time

        debug: false
    },

    // Define required scripts.
    getStyles: function() {
        return ["trains.css", "font-awesome.css"];
    },

    // Define required scripts.
    getScripts: function() {
        return ["moment.js", this.file('titleCase.js')];
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

        //Dump train data
        if (this.config.debug) {
            Log.info(this.trains);
        }

        // *** Start Building Table
        var table = document.createElement("table");
        table.className = "small";

        //With data returned
        if (this.trains.data.length > 0) {
            for (var t in this.trains.data) {
                var myTrain = this.trains.data[t];

                //Create row for data item
                var row = document.createElement("tr");
                table.appendChild(row);

                //If platform is required, create first table cell
                if (this.config.showPlatform) {
                    if (myTrain.platform) {
                        platform = myTrain.platform;
                    } else {
                        platform = '-';
                    }

                    var trainPlatformCell = document.createElement("td");
                    trainPlatformCell.innerHTML = " " + platform + " ";
                    trainPlatformCell.className = "platform";
                    row.appendChild(trainPlatformCell);
                }

                //Train destination cell
                var trainDestCell = document.createElement("td");
                trainDestCell.innerHTML = myTrain.destination;
                trainDestCell.className = "bright dest";
                row.appendChild(trainDestCell);

                //If required train origin cell
                if (this.config.showOrigin) {
                    var trainOriginCell = document.createElement("td");
                    trainOriginCell.innerHTML = myTrain.origin;
                    trainOriginCell.className = "trainOrigin";
                    row.appendChild(trainOriginCell);
                }

                //Timetabled departure time
                var plannedDepCell = document.createElement("td");
                plannedDepCell.innerHTML = myTrain.plannedDeparture;
                plannedDepCell.className = "timeTabled";
                row.appendChild(plannedDepCell);

                //If required, live departure time
                if (this.config.showActualDeparture) {
                    var actualDepCell = document.createElement("td");
                    if(myTrain.actualDeparture != null) { // Only display actual time if it exists
                        actualDepCell.innerHTML = "(" + myTrain.actualDeparture + ")";
                    } else {
                        actualDepCell.innerHTML = "&nbsp;";
                    }
                    actualDepCell.className = "actualTime";
                    row.appendChild(actualDepCell);
                }

                //Train status cell
                var statusCell = document.createElement("td");
                statusCell.innerHTML = " " + titleCase(myTrain.status) + " ";

                if (myTrain.status == "ON TIME") {
                    statusCell.className = "bright nonews status";
                } else if (myTrain.status == "LATE") {
                    statusCell.className = "bright late status";
                } else if (myTrain.status == "EARLY") {
                    statusCell.className = "bright early status";
                } else if (myTrain.status == "CANCELLED") {
                    statusCell.className = "late status";
                } else if (myTrain.status == "ARRIVED") {
                    statusCell.className = "early status";
                } else if (myTrain.status == "REINSTATEMENT" || myTrain.status == "STARTS HERE") {
                    statusCell.className = "goodnews status";
                } else if (myTrain.status == "NO REPORT" || myTrain.status == "OFF ROUTE") {
                    statusCell.className = "nonews status";
                } else {
                    statusCell.className = "nonews status";
                }

                row.appendChild(statusCell);

                if (this.config.fade && this.config.fadePoint < 1) {
                    if (this.config.fadePoint < 0) {
                        this.config.fadePoint = 0;
                    }
                    var startingPoint = this.trains.length * this.config.fadePoint;
                    var steps = this.trains.length - startingPoint;
                    if (t >= startingPoint) {
                        var currentStep = t - startingPoint;
                        row.style.opacity = 1 - (1 / steps * currentStep);
                    }
                }
            }
        } else {
            var row1 = document.createElement("tr");
            table.appendChild(row1);

            var messageCell = document.createElement("td");
            messageCell.innerHTML = " " + this.trains.message + " ";
            messageCell.className = "bright";
            row1.appendChild(messageCell);

            var row2 = document.createElement("tr");
            table.appendChild(row2);

            var timeCell = document.createElement("td");
            timeCell.innerHTML = " " + this.trains.timestamp + " ";
            timeCell.className = "bright";
            row2.appendChild(timeCell);
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
       
       this.trains = {}
       
        this.loaded = true;
        this.updateDom(this.config.animationSpeed);
    },


    /* getParams(compliments)
     * Generates an url with api parameters based on the config.
     *
     * return String - URL params.
     */
    getParams: function() {
        var params = "?";
        params += "app_id=" + this.config.app_id;
        params += "&app_key=" + this.config.app_key;

        if (this.config.called_at.length > 0) {
            params += "&called_at=" + this.config.called_at;
        }

        if (this.config.calling_at.length > 0) {
            params += "&calling_at=" + this.config.calling_at;
        }

        if (this.config.darwin) {
            params += "&darwin=" + this.config.darwin;
        }

        if (this.config.destination.length > 0) {
            params += "&destination=" + this.config.destination;
        }

        if (this.config.from_offset.length > 0) {
            params += "&from_offset=" + this.config.from_offset;
        }

        if (this.config.operator.length > 0) {
            params += "&operator=" + this.config.operator;
        }

        if (this.config.origin.length > 0) {
            params += "&origin=" + this.config.origin;
        }

        if (this.config.service.length > 0) {
            params += "&service=" + this.config.service;
        }

        if (this.config.to_offset.length > 0) {
            params += "&to_offset=" + this.config.to_offset;
        }

        if (this.config.train_status.length > 0) {
            params += "&train_status=" + this.config.train_status;
        }

        if (this.config.type.length > 0) {
            params += "&type=" + this.config.type;
        }

        if (this.config.debug) {
            Log.warn(params);
        }

        return params;
    },

    // Process data returned
    socketNotificationReceived: function(notification, payload) {
       
       switch(notification) {
       case "UKNR_DATA":
          this.processTrains(payload.data);
          break;
       }
    }

});
