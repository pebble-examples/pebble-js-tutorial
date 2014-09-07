var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');
var Accel = require('ui/accel');
var Vibe = require('ui/vibe');

var parseFeed = function(data, quantity) {
  var items = [];
  for(var i = 0; i < quantity; i++) {
    // Always upper case the description string
    var title = data.list[i].weather[0].main;
    title = title.charAt(0).toUpperCase() + title.substring(1);

    // Get date/time substring
    var time = data.list[i].dt_txt;
    time = time.substring(time.indexOf('-') + 1, time.indexOf(':') + 3);

    // Add to menu items array
    items.push({
      title:title,
      subtitle:time
    });
  }

  // Finally return whole array
  return items;
};

// Show splash screen while waiting for data
var splashWindow = new UI.Window({
  backgroundColor:'white'
});

// Text element to inform user
var text = new UI.Text({
  position: new Vector2(0, 30),
  size: new Vector2(144, 40),
  text:'Downloading weather data...',
  font:'GOTHIC_28_BOLD',
  color:'black',
  textOverflow:'wrap',
  textAlign:'center'
});

// Add to splashWindow and show
splashWindow.add(text);
splashWindow.show();

// Make request to openweathermap.org
ajax(
  {
    url:'http://api.openweathermap.org/data/2.5/forecast?q=London',
    type:'json'
  },
  function(data) {
    // Create an array of Menu items
    var menuItems = parseFeed(data, 10);

    // Construct Menu to show to user
    var resultsMenu = new UI.Menu({
      sections: [{
        title: 'Current Forecast',
        items: menuItems
      }]
    });

    // Add an action for SELECT
resultsMenu.on('select', function(e) {
  // Get that forecast
  var forecast = data.list[e.itemIndex];

  // Assemble body string
  var content = data.list[e.itemIndex].weather[0].description;

  // Capitalize first letter
  content = content.charAt(0).toUpperCase() + content.substring(1);

  // Add temperature, pressure etc
  content += '\nTemperature: ' + Math.round(forecast.main.temp - 273.15) + '°C' 
  + '\nPressure: ' + Math.round(forecast.main.pressure) + ' mbar' +
    '\nWind: ' + Math.round(forecast.wind.speed) + ' mph, ' + 
    Math.round(forecast.wind.deg) + '°';

      // Create the Card for detailed view
      var detailCard = new UI.Card({
        title:'Details',
        subtitle:e.item.subtitle,
        body: content
      });
      detailCard.show();
    });

    // Show the Menu, hide the splash
    resultsMenu.show();
    splashWindow.hide();
    
    // Register for 'tap' events
    resultsMenu.on('accelTap', function(e) {
      // Make another request to openweathermap.org
      ajax(
        {
          url:'http://api.openweathermap.org/data/2.5/forecast?q=London',
          type:'json'
        },
        function(data) {
          // Create an array of Menu items
          var newItems = parseFeed(data, 10);
          
          // Update the Menu's first section
          resultsMenu.items(0, newItems);
          
          // Notify the user
          Vibe.vibrate('short');
        },
        function(error) {
          console.log('Download failed: ' + error);
        }
      );
    });
  },
  function(error) {
    console.log("Download failed: " + error);
  }
);

// Prepare the accelerometer
Accel.init();
