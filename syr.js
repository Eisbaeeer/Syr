/**
 *      CCU.IO Syr Connect Adapter 0.7.0
 *      
 *      You need a router who can reroute a DNS request from Syr to a local IP-
 *      address. Tested and possible with fritzbox or own DNS Server.
 *      What do you additional need?
 *      - apache or windows webserver 24/7 to host the own WebService
 *      - DNS who resolv the address from: syrconnect.consoft.de to: local web-server
 *      - CCU.IO with adapter syr
 *      You get the adatper @ github.com/Eisbaeeer/syr
 *
 *      2015 06 03  Eisbaeeer 
 *                  Initial release  0.5.0
 *      2015 06 08  Eisbaeeer
 *                  Adding water consumtion statistics  0.6.0  
 *      2015 06 12  Eisbaeeer
 *                  Fine tuning - summary water consumption statistics 0.7.0
 */

var settings = require(__dirname+'/../../settings.js');

if (!settings.adapters.syr || !settings.adapters.syr.enabled) {
    process.exit();
}

//Settings laden
var syrSettings = settings.adapters.syr.settings;

//Global vars require
var logger = require(__dirname+'/../../logger.js'),
    io     = require('socket.io-client'),
    fs     = require("fs"),
	  net    = require('net');

//Global vars
var objects = {},
    result = {},
	  datapoints = {};
	

if (settings.ioListenPort) {
	var socket = io.connect("127.0.0.1", {
		port: settings.ioListenPort
	});
} else if (settings.ioListenPortSsl) {
	var socket = io.connect("127.0.0.1", {
		port: settings.ioListenPortSsl,
		secure: true
	});
} else {
	process.exit();
}


socket.on('connect', function () {
    logger.info("info", "connected to ccu.io");
});

socket.on('disconnect', function () {
    logger.info("info", "disconnected from ccu.io");
});

function stop() {
    logger.info("info", "terminating");
    setTimeout(function () {
        process.exit();
    }, 250);
}

process.on('SIGINT', function () {
    stop();
});

process.on('SIGTERM', function () {
    stop();
});

function setObject(id, obj) {
    objects[id] = obj;
    if (obj.Value) {
        datapoints[obj.Name] = [obj.Value];
    }
    socket.emit("setObject", id, obj);
}

function getState(id, callback) {
    logger.verbose("adapter fritzBox getState "+id);
    socket.emit("getDatapoint", [id], function (id, obj) {
        callback (id, obj);
    });
}

var getSTA = {};
var rows = {};
var Syr_REST_CAPACITY_BEFORE = {};
var Syr_WATER_CONSUMPTION_SUMMARY = {};
var Syr_LITER_DELTA = {};

// XML Datei einlesen
function getValues() {
   var file = fs.readFileSync('/var/www/WebServices/SyrConnectLimexWebService.asmx/lex.txt', "utf8");
      if (syrSettings.debug == true) {
      logger.info("adapter SYR raw:"+file);
      }
      if (syrSettings.debug == true) {
      logger.info("adapter SYR Syr_LITER_DELTA: "+Syr_LITER_DELTA);
      }     
       if (syrSettings.debug == true) {
      logger.info("adapter Syr_REST_CAPACITY_BEFORE: "+Syr_REST_CAPACITY_BEFORE);
      } 
       if (syrSettings.debug == true) {
      logger.info("adapter SYR Syr_WATER_CONSUMPTION_SUMMARY: "+Syr_WATER_CONSUMPTION_SUMMARY);
      }      
      
   var array = file.split(",");
   
   var Syr_STATUS = array[4].substring(8);
   if (Syr_STATUS == "" || Syr_STATUS == "BETRIEB") {
       socket.emit("setState", [syrSettings.firstId+2, 'BETRIEB']);
       } else { 
   socket.emit("setState", [syrSettings.firstId+2, Syr_STATUS]);
       }    
   
   var Syr_HOLIDAY_BEGIN_DAY = array[17].substring(8);
   socket.emit("setState", [syrSettings.firstId+3, Syr_HOLIDAY_BEGIN_DAY]);
   
   var Syr_HOLIDAY_BEGIN_MONTH = array[18].substring(8);
   socket.emit("setState", [syrSettings.firstId+4, Syr_HOLIDAY_BEGIN_MONTH]);
   
   var Syr_HOLIDAY_BEGIN_YEAR = array[19].substring(8);
   socket.emit("setState", [syrSettings.firstId+5, Syr_HOLIDAY_BEGIN_YEAR]);
   
   var Syr_HOLIDAY_END_DAY = array[20].substring(8);
   socket.emit("setState", [syrSettings.firstId+6, Syr_HOLIDAY_END_DAY]);
   
   var Syr_HOLIDAY_END_MONTH = array[21].substring(8);
   socket.emit("setState", [syrSettings.firstId+7, Syr_HOLIDAY_END_MONTH]);
   
   var Syr_HOLIDAY_END_YEAR = array[22].substring(8);
   socket.emit("setState", [syrSettings.firstId+8, Syr_HOLIDAY_END_YEAR]);
   
   var Syr_REGENERATION_TIME_HOUR = array[23].substring(8);
   socket.emit("setState", [syrSettings.firstId+9, Syr_REGENERATION_TIME_HOUR]);
   
   var Syr_REGENERATION_TIME_MINUTE = array[24].substring(8);
   socket.emit("setState", [syrSettings.firstId+10, Syr_REGENERATION_TIME_MINUTE]);
   
   var Syr_DAILY_WATER_CONSUMPTION = array[27].substring(8);
   socket.emit("setState", [syrSettings.firstId+11, Syr_DAILY_WATER_CONSUMPTION]);
   
   var Syr_COUNT_OF_NORMAL_REGENERATION = array[29].substring(8);
   socket.emit("setState", [syrSettings.firstId+12, Syr_COUNT_OF_NORMAL_REGENERATION]);
   
   var Syr_COUNT_OF_SERVICE_REGENERATION = array[30].substring(8);
   socket.emit("setState", [syrSettings.firstId+13, Syr_COUNT_OF_SERVICE_REGENERATION]);
   
   var Syr_IN_WATER_HARDNESS = array[34].substring(8);
   socket.emit("setState", [syrSettings.firstId+14, Syr_IN_WATER_HARDNESS]);
   
   var Syr_OUT_WATER_HARDNESS = array[35].substring(8);
   socket.emit("setState", [syrSettings.firstId+15, Syr_OUT_WATER_HARDNESS]);
   
   var Syr_REST_CAPACITY_LITER = array[36].substring(8);
   socket.emit("setState", [syrSettings.firstId+16, Syr_REST_CAPACITY_LITER]);
   
   var Syr_RESTCAPACITY_IN_PERCENT = array[32].substring(8);
   socket.emit("setState", [syrSettings.firstId+17, Syr_RESTCAPACITY_IN_PERCENT]);
   
   var Syr_SALT_STORAGE_WEEKS = array[40].substring(8);
   socket.emit("setState", [syrSettings.firstId+18, Syr_SALT_STORAGE_WEEKS]);
   
   //Werte aus DB einlesen
   // Reading Datapoints
    getState (syrSettings.firstId+19, function (id, obj) {
        if (!obj){                           
           Syr_WATER_CONSUMPTION_SUMMARY = 0;
       }
        else {
            // take actual value
            Syr_WATER_CONSUMPTION_SUMMARY = obj[0];
       }
    });  


   
   //Wasserverbrauch ermitteln
   
      Syr_REST_CAPACITY_BEFORE = parseInt(Syr_REST_CAPACITY_BEFORE);
      Syr_REST_CAPACITY_LITER = parseInt(Syr_REST_CAPACITY_LITER);
   
   if (Syr_REST_CAPACITY_BEFORE != Syr_REST_CAPACITY_LITER) {
        Syr_LITER_DELTA = parseInt(Syr_REST_CAPACITY_BEFORE) - parseInt(Syr_REST_CAPACITY_LITER);
        socket.emit("setState", [syrSettings.firstId+22, Syr_LITER_DELTA]);
       
            Syr_REST_CAPACITY_BEFORE = Syr_REST_CAPACITY_LITER;
            socket.emit("setState", [syrSettings.firstId+20, Syr_REST_CAPACITY_BEFORE]);
                     
            Syr_LITER_DELTA = parseInt(Syr_LITER_DELTA);
          if (Syr_LITER_DELTA > 0) {
                   Syr_WATER_CONSUMPTION_SUMMARY = Syr_WATER_CONSUMPTION_SUMMARY + parseInt(Syr_LITER_DELTA);
                   socket.emit("setState", [syrSettings.firstId+19, Syr_WATER_CONSUMPTION_SUMMARY]);     
          }
     }
}


//Datenpunkte anlegen
function SyrInit() {

  socket.emit("setObject", syrSettings.firstId, {
    Name: "SYR-LEX10",
    TypeName: "DEVICE",
    HssType: "LEX10",
    Address: syrSettings.firstId,
    Interface: "CCU.IO",
    Channels: [
      syrSettings.firstId+1  
    ],
    _persistent: true
  });
              
  var mainDPs = {
    STATUS:                         syrSettings.firstId+2,
    HOLIDAY_BEGIN_DAY:              syrSettings.firstId+3,
    HOLIDAY_BEGIN_MONTH:            syrSettings.firstId+4,
    HOLIDAY_BEGIN_YEAR:             syrSettings.firstId+5,
    HOLIDAY_END_DAY:                syrSettings.firstId+6,
    HOLIDAY_END_MONTH:              syrSettings.firstId+7,
    HOLIDAY_END_YEAR:               syrSettings.firstId+8,
    REGENERATION_TIME_HOUR:         syrSettings.firstId+9,
    REGENERATION_TIME_MINUTE:       syrSettings.firstId+10,
    DAILY_WATER_CONSUMPTION:        syrSettings.firstId+11,
    COUNT_OF_NORMAL_REGENERATION:   syrSettings.firstId+12,
    COUNT_OF_SERVICE_REGENERATION:  syrSettings.firstId+13,
    IN_WATER_HARDNESS:              syrSettings.firstId+14,
    OUT_WATER_HARDNESS:             syrSettings.firstId+15,
    REST_CAPACITY_LITER:            syrSettings.firstId+16,
    RESTCAPACITY_IN_PERCENT:        syrSettings.firstId+17,
    SALT_STORAGE_WEEKS:             syrSettings.firstId+18,
    WATER_CONSUMPTION_SUMMARY:      syrSettings.firstId+19,
    REST_CAPACITY_BEFORE:           syrSettings.firstId+20,
    WATER_CONSUMPTION_DAY:          syrSettings.firstId+21,
    Syr_LITER_DELTA:                syrSettings.firstId+22     
  };
  
  
  socket.emit("setObject", syrSettings.firstId+1, {
    Name: "Syr Data",
    TypeName: "CHANNEL",
    Address: syrSettings.firstId+1,
    HssType: "Syr Data",
    DPs: mainDPs,
    Parent: syrSettings.firstId,
    _persistent: true
  });
  

	setObject(syrSettings.firstId+2, {
	  Name: "Syr_STATUS",
	  TypeName: "VARDP"
	});
	setObject(syrSettings.firstId+3, {
	  Name: "Syr_HOLIDAY-BEGIN-DAY",
	  TypeName: "VARDP"
	});
	setObject(syrSettings.firstId+4, {
	  Name: "Syr_HOLIDAY-BEGIN-MONTH",
	  TypeName: "VARDP"
	});
	setObject(syrSettings.firstId+5, {
	  Name: "Syr_HOLIDAY-BEGIN-YEAR",
	  TypeName: "VARDP"
	});
	setObject(syrSettings.firstId+6, {
	  Name: "Syr_HOLIDAY-END-DAY",
	  TypeName: "VARDP"
	});
	setObject(syrSettings.firstId+7, {
	  Name: "Syr_HOLIDAY-END-MONTH",
	  TypeName: "VARDP"
	});
	setObject(syrSettings.firstId+8, {
	  Name: "Syr_HOLIDAY-END-YEAR",
	  TypeName: "VARDP"
	});
	setObject(syrSettings.firstId+9, {
	  Name: "Syr_REGENERATION-TIME-HOUR",
	  TypeName: "VARDP"
	});
	setObject(syrSettings.firstId+10, {
	  Name: "Syr_REGENERATION-TIME-MINUTE",
	  TypeName: "VARDP"
	});
	setObject(syrSettings.firstId+11, {
	  Name: "Syr_DAILY-WATER-CONSUMPTION",
	  TypeName: "VARDP"
	});
	setObject(syrSettings.firstId+12, {
	  Name: "Syr_COUNT-OF-NORMAL-REGENERATION",
	  TypeName: "VARDP"
	});
	setObject(syrSettings.firstId+13, {
	  Name: "Syr_COUNT-OF-SERVICE-REGENERATION",
	  TypeName: "VARDP"
	});
	setObject(syrSettings.firstId+14, {
	  Name: "Syr_IN-WATER-HARDNESS",
	  TypeName: "VARDP"
	});
	setObject(syrSettings.firstId+15, {
	  Name: "Syr_OUT-WATER-HARDNESS",
	  TypeName: "VARDP"
	});
	setObject(syrSettings.firstId+16, {
	  Name: "Syr_REST-CAPACITY-LITER",
	  TypeName: "VARDP"
	});
	setObject(syrSettings.firstId+17, {
	  Name: "Syr_RESTCAPACITY-IN-PERCENT",
	  TypeName: "VARDP"
	});
	setObject(syrSettings.firstId+18, {
	  Name: "Syr_SALT-STORAGE-WEEKS",
	  TypeName: "VARDP"
	});

	setObject(syrSettings.firstId+19, {
	  Name: "Syr_WATER_CONSUMPTION_SUMMARY",
	  TypeName: "VARDP"
	});

	setObject(syrSettings.firstId+20, {
	  Name: "Syr_REST_CAPACITY_BEFORE",
	  TypeName: "VARDP"
	});

  setObject(syrSettings.firstId+21, {
	  Name: "Syr_WATER_CONSUMPTION_DAY",
	  TypeName: "VARDP"
	});

  setObject(syrSettings.firstId+22, {
	  Name: "Syr_LITER_DELTA",
	  TypeName: "VARDP"
	});
  
  
  logger.info("adapter syr objects inserted, starting at: "+syrSettings.firstId);

  if (syrSettings.debug == true) {
      logger.info("adapter SYR debug: enabled");
  }

}

logger.info("adapter Syr start");
    
       SyrInit ();

            // Reading Datapoints
   getState (syrSettings.firstId+19, function (id, obj) {
        if (!obj){                           
           Syr_WATER_CONSUMPTION_SUMMARY = 0;
       }
        else {
            // take actual value
            Syr_WATER_CONSUMPTION_SUMMARY = obj[0];
       }     
       });      
              // Reading Datapoints
        getState (syrSettings.firstId+20, function (id, obj) {
        if (!obj){                           
           Syr_REST_CAPACITY_BEFORE = 0;
       }
        else {
            // take actual value
            Syr_REST_CAPACITY_BEFORE = obj[0];
       }
      }); 
              // Reading Datapoints
        getState (syrSettings.firstId+22, function (id, obj) {
        if (!obj){                           
           Syr_LITER_DELTA = 0;
       }
        else {
            // take actual value
            Syr_LITER_DELTA = obj[0];
       }
      }); 


      
      if (syrSettings.debug == true) {
      logger.info("adapter SYR Syr_LITER_DELTA: -init- "+Syr_LITER_DELTA);
      }     
       if (syrSettings.debug == true) {
      logger.info("adapter Syr_REST_CAPACITY_BEFORE: -init- "+Syr_REST_CAPACITY_BEFORE);
      } 
       if (syrSettings.debug == true) {
      logger.info("adapter SYR Syr_WATER_CONSUMPTION_SUMMARY: -init- "+Syr_WATER_CONSUMPTION_SUMMARY);
      } 
                           
getValues();
                    
setInterval(getValues, settings.adapters.syr.settings.interval || 180000);
