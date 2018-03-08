  var margin_left = 15;
  var margin_right = 15;
	var margin_top = 20;
	var margin_bottom = 20;

	var stateWidth =75;
	var stateHeight = stateWidth;

	// var mapHeight = function() {
	// 			return 9*stateHeight - (margin_top + margin_bottom);
	// 		}


	// var mapWidth = function(){
	// 			return 16*stateWidth - (margin_left + margin_right);
	// 		}


	mapHeight = 9*stateHeight - (margin_top + margin_bottom); // at most 9 states vertically
	mapWidth = 16*stateWidth - (margin_left + margin_right); // 16 states across

	var map = d3.select(".usmap")
						.append("svg")
						.attr("height", mapHeight)
						.attr("width", mapWidth)

	var TL_height = 50;
	var TL_width = mapWidth;


    var yearselectorCanvas = d3.select(".yearselector")
    .append("svg")
    .attr("width", mapWidth)
    .attr("height", TL_height);

    var usmapCanvas = d3.select(".usmap")
    .append("svg")
    .attr("width", mapWidth)
    .attr("height", mapHeight);

    var profile = d3.select(".usmap")
    .append("img")


    var colorScaleCanvas = d3.select(".color-scale")
    .append("svg")
    .attr("width", mapWidth)
    .attr("height", TL_height)

    var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


    var usmapLabel = d3.select("#usmap-label")


    // Reading the multiple data files simulataneously done with help from
	// https://stackoverflow.com/questions/21842384/
	//importing-data-from-multiple-csv-files-in-d3#comment33080827_21842647
	

    var q = d3.queue();
    q.defer(d3.csv, "data/yearwise-winner.csv");

    for(var i = 0; (1940 + i) <= 2016; i = i+4){
		var temp_src_string = "data/election-results-" + (1940+i).toString() + ".csv";
		q.defer(d3.csv, temp_src_string);
	}

    q.await(function(err, winners) {
      if (err) {
        console.error(err);
        return;
      }

      var mapXS = d3.scaleLinear().domain([0,12]).range([0, mapWidth]);
  
      var mapYS = d3.scaleLinear().domain([0,8]).range([0, mapHeight]);
   

      var colorXSS = d3.scaleLinear().domain([-60,60]).range([0,mapWidth]);
      

      // I got the idea for this ugly piece of code from:
    // https://www.reddit.com/r/javascript/comments/4z42z0/var_args_arrayprototypeslicecallarguments_the
	// Essentially, allows us to treat the winners args as an array, slice it appropriately, and then build 
	// a scale so the nested array indexes will correspond to a meaningfull year

	var resultsByYear = Array.prototype.slice.call(arguments, 3);
	var yearIndexes = d3.scaleQuantize().domain([1940, 2016])
										.range(resultsByYear.map(function(_, index) 
										{return index;}));

	var target_index = yearIndexes(1940);

     var yearWinnerMap = new Map();
	 for(var winner in winners){
	 		var year = winners[winner].YEAR;
	 		var party = winners[winner].PARTY;
			yearWinnerMap.set(parseInt(year), party);
	 }

      var colorScale = d3.scaleLinear()
      .domain([-60, -0, 0, 60])
      .range(["#0027b3", "#4d73ff", "#ff4d4f", "#e60004"]);
      
      var generateyearselector = function() {
      	var node_dist = TL_width / ((19) + 1);
		var half_dist = node_dist / 2.0;

		var yearselectorLine = yearselectorCanvas
        .append("line")
        .attr("class", "time-line-line")
        .attr("x1", half_dist)
        .attr("x2", mapWidth-half_dist)
        .attr("y1", TL_height/2)
        .attr("y2", TL_height/2)

        var years = [];
		for (var i = 0; (1940 + i) <= 2016; i = i+4){
			years.push(1940 + i);
		}


        // var node_dist = mapWidth/(19)+ 1);
        
        var groups = yearselectorCanvas.selectAll("g")
          .data(years)
          .enter()
          .append("g")

        var year_labels = groups
          .selectAll(".timeline-label")
          .data(function(d){return [d];})
          .enter()
          .append("text")
          .attr("class", "timeline-label")
          .attr("x", function(y){
            var val = 10 + node_dist*yearIndexes(y);
          })
          .attr("y", TL_height/2 + node_dist*2/5 + 20)
          .text(function(y){return y});

        var rects = groups
          .selectAll(".rectYearSelector")
          .data(function(d){return [d];})
          .enter()
          .append("rect")
          .attr("class", function(y) {
            if (yearIndexes(y) == target_index){
            	return "rect selected"
            } else return "rect";
          })
          .attr("fill", function(y){
            if (yearWinnerMap.get(y) == "D") {
              return "blue";
            }
            if (yearWinnerMap.get(y) == "R") {
            	return "red";
            }
          })
          .attr("x", function(y){
            return half_dist + node_dist*yearIndexes(y);
          })
          .attr("y", TL_height/2)
          .attr("height", 20)
          .attr("width", 30)
          .on("click", function(y){
            target_index = yearIndexes(y);
            build();
          })

        
      } // END QUEUE

      var generateScale = function() {
        var winScale = []
        for (var i = -60; i < 60; i+= 10) {
          winScale.push(i);
        }
        var ticks = colorScaleCanvas.selectAll("g")
        .data(winScale)
        .enter()
        .append("g")
        var rectangles = ticks
        .selectAll(".tickBar")
        .data(function(d){return [d];})
        .enter()
        .append("rect")
        .attr("class", "tickBar")
        .attr("fill", function(d){return colorScale(d);})
        .attr("x", function(d){return colorXSS(d)})
        .attr("y", 0)
        .attr("width", mapWidth/10)
        .attr("height", 30)
        var label = ticks
        .selectAll(".tickLabel")
        .data(function(d){return [d];})
        .enter()
        .append("text")
        .attr("class", "tickLabel")
        .attr("x", function(d){return 10+colorXSS(d)})
        .attr("y", 60)
        .text(function(d){return `${d} to ${d+10}`})

      }

      var generateusmaps = function(){
        var result = resultsByYear[target_index];
        var winner_party = yearWinnerMap.get((1940 + (4*target_index)));
        if (winner_party == 'D'){
        	winner_party = "Democrat";
        }
        if (winner_party == 'R'){
        	winner_party = "Republican";
        }
        var winner_string = "Winner in " + (1940 + (4*target_index)).toString() + ": " + winner_party
        usmapLabel.html(winner_string);
        var states = usmapCanvas.selectAll("g")
        .data(result)
        .enter()
        .append("g")
        var rectangles = states
        .selectAll(".rect")
        .data(function(d){ return [d];})
        .enter()
        .append("rect")
        .attr("class", "rect")
        .attr("fill", function(d){
          var winPercent = d['R_Percentage']-d['D_Percentage'];
          return colorScale(winPercent);
        })
        .on("mouseover", function(d){
          tooltip.style("opacity", .9)
                 .style("left", (d3.event.pageX - 10)+"px")
          		 .style("top", (d3.event.pageY - 15)+"px");
          var html_string = "<p>" + d.State + "</p>" +
          					"<p> EV: " + d['Total_EV'] + "</p>" +
          					"<p>" + d['D_Nominee'] + ": " + d['D_Votes'] + "(" + d['D_Percentage'] + ")" + "</p>" +
          					"<p>" + d['R_Nominee'] + ": " + d['R_Votes'] + "(" + d['R_Percentage'] + ")" + "</p>"

          tooltip.html(html_string);

        })
        // Text
        .attr("x", function(d){
        	var coords = STCM.get(d.State);
  			try {
  				var x = coords[0];
        		return mapXS(x);
  			} catch(err) {
  				// pass
  			} 
        	
        })
        .attr("y", function(d){
        	var coords = STCM.get(d.State);
        	try {
        		var y = coords[1];
        		return mapYS(y);
        	} catch(err) {
        		//pass
        	}
        	
        })
        .attr("width", stateWidth)
        .attr("height", stateWidth)
        var abbrs = states
        .selectAll(".abbr")
        .data(function(d){return [d];})
        .enter()
        .append("text")
        .attr("class", "abbr")
        .attr("x", function(d){
        	var coords = STCM.get(d.State);
  			try {
  				var x = coords[0];
        		return 2 + mapXS(x);
  			} catch(err) {
  				// pass
  			} 
        })
        .attr("y", function(d){
        	// return stateWidth/2 + mapYS(STCM.get(d.state)[1])
        	var coords = STCM.get(d.State);
        	try {
        		var y = coords[1];
        		return stateWidth/2 + mapYS(y);
        	} catch(err) {
        		//pass
        	}
        })
        .text(function(d){return `${d["Abbreviation"]} ${d["Total_EV"]}`;})


      }
      var build = function() {
        yearselectorCanvas.html("");
        colorScaleCanvas.html("");
        usmapCanvas.html("");
        generateyearselector();
        generateScale();
        generateusmaps();
      }

      build();
  });