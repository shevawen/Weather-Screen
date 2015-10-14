(function(){
  var heweather_key = '980756f87f1c4abda8f03cd3ed84b342';
  var aspect_ratio = 1.73
  var screens,weather_code;
  var topo,projection,path,svg,g,texture,graticule,zoom;
  var width,height;
  var screenrun,screenIndex,viewParam;
  var loadScreens,loadWeatherCond,loadCountries;
  var msg;

  init();
  setup();


  function init(){
    d3.select(window).on("resize", throttle);
    zoom = d3.behavior.zoom().scaleExtent([1, 35]);
    width = document.getElementById('container').offsetWidth;
    height = width / aspect_ratio;
    graticule = d3.geo.graticule();

    texture = textures.lines()
      .orientation("diagonal")
      .size(8)
      .strokeWidth(1)
      .stroke("#9bc9d3")
      .background("#0096c4");

    screenIndex  = 0;

    loadScreens =
      $.ajax({
            url : 'data/screens.json',
            dataType : 'json'
      });
    loadWeatherCond =
      $.ajax({
            url : 'data/weather-code.json',
            dataType : 'json'
      });
    loadCountries =
      $.ajax({
            url : 'data/world-topo-min.json',
            dataType : 'json'
      });
  }
  function setup(){
    projection = d3.geo.mercator().rotate([-160, 0, 0])
      .translate([(width/2), (height/2)])
      .scale( width / 2 / Math.PI);

    path = d3.geo.path().projection(projection);

    svg = d3.select("#container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(zoom)
        .on("click", click)
        .append("g");
    defineDropshadow();
    svg.call(texture);

    g = svg.append("g");
    toastr.warning("Loading resource.");
    //TODO switch to https://github.com/mbostock/queue
    $.when(loadScreens, loadWeatherCond, loadCountries).done(function(result0, result1, result2){
      toastr.clear();
      toastr.success("Resource loaded.");
      screens = result0[0];
      weather_code = result1[0];
      countries = topojson.feature(result2[0], result2[0].objects.countries).features;
      topo = countries;
      draw(topo);
      toastr.clear();
      toastr.warning("Loading forecast.");
      $.when.apply(null,loadWeatherDatas()).done(function(){
        toastr.clear();
        toastr.success("Forecast loaded.");
        var m = 0;
        for (var i = 0; i < screens.length; i++) {
          for (var j = 0; j < screens[i].length; j++) {
            screens[i][j].data = arguments[m ++][0]['HeWeather data service 3.0'][0];
          }
        }
        window.clearInterval(screenrun);
        screenrun = window.setInterval(runOnce, 5000);
      });
    });

  }
  function runOnce(){
    g.selectAll(".gpoint").transition()
        .ease("linear")
        .duration(200)
        .style("opacity", 0.4)
        .each('end',function(){
          this.remove();
        });
    viewParam = getViewParam(screens[screenIndex]);
    changeView(renderWeather);

  }
  function defineDropshadow(){
    var defs = svg.append("defs");

    var filter = defs.append("filter")
        .attr("id", "dropshadow")

    filter.append("feGaussianBlur")
        .attr("in", "SourceAlpha")
        .attr("stdDeviation", 30)
        .attr("result", "offsetblur");
    filter.append("feOffset")
        .attr("in", "blur")
        .attr("dx", 2)
        .attr("dy", 2)
        .attr("result", "offsetBlur");

    var feMerge = filter.append("feMerge");

    feMerge.append("feMergeNode")
        .attr("in", "offsetBlur")
    feMerge.append("feMergeNode")
        .attr("in", "SourceGraphic");
  }

  function loadWeatherDatas(){
    var promises = [];
    for(var i = 0 ; i < screens.length; i ++){
      screens[i].datas = [];
      for(var j = 0 ; j < screens[i].length; j++){
        promises.push(
          $.ajax({
              url : 'https://api.heweather.com/x3/weather?key=' + heweather_key + '&city=' + screens[i][j].name
          })
        )
      }
    }
    return promises;
  }

  function renderWeather(){
      for(var i = 0; i < screens[screenIndex].length; i ++){
        try {
          var city = screens[screenIndex][i];
          var basic = city.data.basic;
          var weather = city.data.daily_forecast[0];
          var now = new Date();
          console.log(city);
          console.log(weather);
          console.log(weather.cond.code_d);
          var _weather_code = (now.getHours() > 17 || now.getHours() < 6) ?
            weather_code[weather.cond.code_d].night : weather_code[weather.cond.code_d].day;

          addpoint(
            basic.lon,
            basic.lat,
            basic.city,
            _weather_code,
            weather.tmp.max,
            weather.tmp.min,
            city.card_positon);
        }catch(error){
          console.log(error);
        }
      }
      screenIndex + 1 == screens.length ? screenIndex = 0 : screenIndex ++;
  }
  function getViewParam(datas){
    var xs = [],ys = [];
    for(var i = 0; i < datas.length; i ++){
      var lon = datas[i].data.basic.lon - 0;
      var lat = datas[i].data.basic.lat - 0;
      var xy = projection([lon, lat]);
      xs.push(xy[0]);
      ys.push(xy[1]);
    }
    var bbox = [
      Math.min.apply(null, xs),
      Math.min.apply(null, ys),
      Math.max.apply(null, xs),
      Math.max.apply(null, ys)
    ]
    var center = projection.invert([(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]);

    var scale = Math.min(width * 0.8 / Math.abs(bbox[2] - bbox[0]), height * 0.8 / Math.abs(bbox[3] - bbox[1]));

    return {
      'center' : center,
      'scale' : scale
    }
  }
  function local(name){
    return $.inArray(name, ['China','Taiwan, Province of China','Hong Kong','Macao']) > -1;
  }


  function draw(topo) {

    g.append("path")
       .datum(graticule)
       .attr("class", "graticule")
       .attr("d", path);


    g.append("path")
     .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
     .attr("class", "equator")
     .attr("d", path);


    var country = g.selectAll(".country").data(topo);


    country.enter().insert("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("id", function(d,i) { return d.id; })
        .attr("title", function(d,i) { return d.properties.name; })
        .style("fill", function(d, i) {
          return local(d.properties.name) ? texture.url() : "#cbd7d8";
        });
  }


  function redraw() {
    width = document.getElementById('container').offsetWidth;
    height = width / 2;
    // d3.select('svg').remove();
    // setup();
    // draw(topo);
    svg.attr("width", width).attr("height", height);
  }
  function changeView(func){

    var x = projection(viewParam.center)[0];
    var y = projection(viewParam.center)[1];

    var translate = [width / 2 - viewParam.scale * x, height / 2 - viewParam.scale * y];
    g.transition()
        .duration(750)
        .style("stroke-width", 1 / viewParam.scale + "px")
        .attr("transform", "translate(" + translate + ")scale(" + viewParam.scale + ")")
        .each('end',func);
    d3.selectAll(".country").transition()
        .duration(750).style("stroke-width", 1 / viewParam.scale);
  }



  var throttleTimer;
  function throttle() {
    window.clearTimeout(throttleTimer);
      throttleTimer = window.setTimeout(function() {
        redraw();
      }, 200);
  }


  //geo translation on mouse click in map
  function click() {
    var latlon = projection.invert(d3.mouse(this));
    console.log(latlon);
  }


  //function to add points and text to the map (used in plotting capitals)
  function addpoint(lon,lat,city,cond,tmpmax,tmpmin,card_positon) {
    var csize = 36;
    var cgap = 2;
    var city_label_size = 20;
    var coffsetY = (card_positon == 'b' ? 12 :  - 12 - csize);
    var pointr = 6
    var x = projection([lon,lat])[0];
    var y = projection([lon,lat])[1];
    var gpoint = g.append("g").attr("class", "gpoint");
    gpoint.attr('transform',"skewX(20)translate(" + x + "," + y + ")scale(" + 1 / viewParam.scale + ")")
    .transition()
  	.ease("linear")
  	.duration(200)
    .attr('transform',"skewX(0)translate(" + x + "," + y + ")scale(" + 1 / viewParam.scale + ")");

    gpoint.append("svg:circle")
          .attr("cx", 2)
          .attr("cy", 0)
          .attr("r", pointr)
          .attr("fill","#ff9900")
          .attr("stroke","#ffffff")
          .attr("stroke-width",2)
          .attr("class","point");
    gpoint.append("svg:rect")
          .attr("x", 0 - pointr)
          .attr("y", coffsetY)
          .attr("width", csize)
          .attr("height", csize)
          .attr("fill",cond == '02' ? "#d9386e" : "#5967b7")
          .attr("class","point")
          .attr("filter", "url(#dropshadow)");
    gpoint.append("svg:rect")
          .attr("x", (csize + cgap) - pointr)
          .attr("y", coffsetY)
          .attr("width", csize)
          .attr("height", csize)
          .attr("fill","#56617f")
          .attr("class","point")
          .attr("filter", "url(#dropshadow)");
    gpoint.append("svg:rect")
          .attr("x", (csize + cgap) * 2 - pointr)
          .attr("y", coffsetY)
          .attr("width", csize)
          .attr("height", csize)
          .attr("fill","#3c2f38")
          .attr("class","point")
          .attr("filter", "url(#dropshadow)");
    gpoint.append("image")
          .attr("x", 0 - pointr)
          .attr("y", coffsetY)
          .attr("width", csize)
          .attr("height", csize)
          .attr("xlink:href","icons/001lighticons-" + cond + ".svg")
          .attr("class","point");

    gpoint.append("text")
          .attr("x", (csize + cgap) - pointr + csize / 2)
          .attr("y", coffsetY + csize - 12 )
          .attr("text-anchor", 'middle')
          .attr("font-size", 24)
          .attr("fill", "#ffffff")
          .text(tmpmax);
    gpoint.append("text")
          .attr("x", (csize + cgap) * 2 - pointr + csize / 2)
          .attr("y", coffsetY + csize - 12 )
          .attr("text-anchor", 'middle')
          .attr("font-size", 24)
          .attr("fill", "#ffffff")
          .text(tmpmin);
    gpoint.append("text")
          .attr("x", 16)
          .attr("y", 6)
          .attr("font-size", city_label_size)
          .attr("fill", "#000000")
          .text(city);

  }
})();
