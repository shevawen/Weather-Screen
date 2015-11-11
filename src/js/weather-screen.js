(function(){
  var heweather_key = '980756f87f1c4abda8f03cd3ed84b342';
  var screens,weather_code;
  var topo,projection,path,svg,g,texture,graticule,zoom;
  var width,height;
  var screenrun,screenIndex,viewParam,timer;
  var loadWeatherCond,loadCountries;
  var msg;

  var GuiConfig = function() {
    this["Screens"] = "北京,天津,石家庄,太原,济南,呼和浩特|北京,沈阳,长春,哈尔滨|南京,合肥,上海,杭州,郑州,武汉,南昌|台北,福州,广州,香港,海口,长沙|贵阳,昆明,成都,重庆,拉萨,南宁|银川,西安,兰州,乌鲁木齐,西宁|乌海,阿左旗,东胜,包头,呼和浩特,临河,集宁,二连浩特|锡林浩特,通辽,赤峰,乌兰浩特,海拉尔,满洲里|巴黎,Ulan Bator,纽约,Buenos Aires,东京,开普敦,新德里,莫斯科";
    this["Interval"] = 5.0;
    this["Browse Source"] = function() {
        window.location.href = 'https://github.com/shevawen/Weather-Screen';
    };
  }

  var config = new GuiConfig();
  var gui = new dat.GUI();
  var screensGUI = gui.add(config, 'Screens');
  var intervalGUI = gui.add(config, 'Interval').min(5.0).max(20.0).step(0.1);
  gui.add(config, 'Browse Source');

  screensGUI.onChange(function(value) {
    setup();
  });
  intervalGUI.onChange(function(value) {
    //window.clearInterval(screenrun);
    if(timer){
      timer.restart(runOnce, value * 1000);
    }
  });


  gui.remember(config);

  init();
  setup();


  function init(){
    d3.select(window).on("resize", throttle);
    zoom = d3.behavior.zoom().scaleExtent([1, 35]);
    width = window.innerWidth;
    height = window.innerHeight;
    graticule = d3.geo.graticule();

    texture = textures.lines()
      .orientation("diagonal")
      .size(8)
      .strokeWidth(1)
      .stroke("#9bc9d3")
      .background("#0096c4");

    projection = d3.geo.mercator().rotate([-160, 0, 0])
      .translate([(width/2), (height/2)])
      .scale( width / 2 / Math.PI);

    path = d3.geo.path().projection(projection);

    svg = d3.select("#container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(zoom)
        .append("g");
    defineDropshadow();
    svg.call(texture);

    g = svg.append("g");


    // loadScreens =
    //   $.ajax({
    //         url : 'data/screens.json',
    //         dataType : 'json'
    //   });
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

    g.selectAll("*").remove();
    screenIndex  = 0;

    screens = screenConfigParse(config.Screens);

    toastr.warning("Loading resource.");
    //TODO switch to https://github.com/mbostock/queue
    $.when(loadWeatherCond, loadCountries).done(function(result0, result1){
      toastr.clear();
      toastr.success("Resource loaded.");
      weather_code = result0[0];
      countries = topojson.feature(result1[0], result1[0].objects.countries).features;
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
        //window.clearInterval(screenrun);
        if(timer){
          timer.restart(runOnce, value * 1000);
        }else{
          timer = d3.timer(runOnce, config["Interval"] * 1000);
        }
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
    changeView(function(){
      renderWeather();

      d3.timer(runOnce, config["Interval"] * 1000);
    });
    return true;
  }
  function defineDropshadow(){
    var defs = svg.append("defs");

    var filter = defs.append("filter")
        .attr("id", "dropshadow")
        .attr("x", "-300%")
        .attr("y", "-300%")
        .attr("width", "600%")
        .attr("height", "600%");
    filter.append("feOffset")
        .attr("in", "SourceAlpha")
        .attr("result", "offOut")
        .attr("dx", 0)
        .attr("dy", 0)
        .attr("result", "offsetBlur");
    filter.append("feGaussianBlur")
        .attr("in", "offOut")
        .attr("stdDeviation", "72")
        .attr("result", "blurOut");
    filter.append("feBlend")
        .attr("in", "SourceGraphic")
        .attr("in2", "blurOut")
        .attr("mode", "normal");
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
          console.error(error);
        }
      }
      screenIndex + 1 == screens.length ? screenIndex = 0 : screenIndex ++;
  }
  function getViewParam(datas){
    var xs = [],ys = [];
    var lon,lat;
    for(var i = 0; i < datas.length; i ++){
      try {
        lon = datas[i].data.basic.lon - 0;
        lat = datas[i].data.basic.lat - 0;
      } catch (e) {
        continue;
      }
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

    var scale = Math.min((width - 200)/ Math.abs(bbox[2] - bbox[0]), (height - 200) / Math.abs(bbox[3] - bbox[1]));

    var center = projection.invert([(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]);

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


  //function to add points and text to the map (used in plotting capitals)
  function addpoint(lon,lat,city,cond,tmpmax,tmpmin,card_positon) {
    var csize = 36;
    var cgap = 1;
    var city_label_size = 30;
    var coffsetY = csize;
    var x = projection([lon,lat])[0];
    var y = projection([lon,lat])[1];
    var gpoint = g.append("g").attr("class", "gpoint");

    gpoint.append("svg:rect")
          .attr("x", 0)
          .attr("y", coffsetY)
          .attr("width", csize)
          .attr("height", csize)
          .attr("fill", cond == '02' ? "#d9386e" : "#5967b7")
          .attr("class","point")
          //.attr("filter", "url(#dropshadow)")
          ;
    gpoint.append("svg:rect")
          .attr("x", csize + cgap)
          .attr("y", coffsetY)
          .attr("width", csize)
          .attr("height", csize)
          .attr("fill","#56617f")
          .attr("class","point")
          //.attr("filter", "url(#dropshadow)")
          ;
    gpoint.append("svg:rect")
          .attr("x", (csize + cgap) * 2)
          .attr("y", coffsetY)
          .attr("width", csize)
          .attr("height", csize)
          .attr("fill","#3c2f38")
          .attr("class","point")
          //.attr("filter", "url(#dropshadow)")
          ;
    gpoint.append("image")
          .attr("x", 0)
          .attr("y", coffsetY)
          .attr("width", csize)
          .attr("height", csize)
          .attr("xlink:href","icons/001lighticons-" + cond + ".svg")
          .attr("class","point");

    gpoint.append("text")
          .attr("x", (csize + cgap) + csize / 2)
          .attr("y", coffsetY + csize - 12 )
          .attr("text-anchor", 'middle')
          .attr("font-size", 24)
          .attr("fill", "#ffffff")
          .text(tmpmax);
    gpoint.append("text")
          .attr("x", (csize + cgap) * 2 + csize / 2)
          .attr("y", coffsetY + csize - 12 )
          .attr("text-anchor", 'middle')
          .attr("font-size", 24)
          .attr("fill", "#ffffff")
          .text(tmpmin);
    gpoint.append("text")
          .attr("x", 0)
          .attr("y", city_label_size)
          .attr("font-size", city_label_size)
          .attr("fill", "#1D2A32")
          .text(city);
    //TOOD resolve the performance promble.
    //gpoint.attr("filter", "url(#dropshadow)");


    // gpoint.style('transform', 'skewX(20)translate(' + x + ',' + y + ')scale(' + 1 / viewParam.scale + ')')
    //   .transition()
    //   .ease("linear")
    //   .duration(200)
    //   .style('transform', 'skewX(0)translate(' + x + ',' + y + ')scale(' + 1 / viewParam.scale + ')');

    gpoint.attr('transform',"skewX(0)translate(" + x + "," + y + ")scale(" + 1 / viewParam.scale + ")");

    gpoint.style("opacity", 0.1)
      .transition()
      .style("opacity", 1)
      .each("end", function(){

      });
  }
  function screenConfigParse(str){
    var screens = [];
    str.split('|').forEach(function(screen){
      var cities = [];
      screen.split(',').forEach(function(city){
        cities.push({
          'name':city
        });
      });
      screens.push(cities);
    })
    return screens;
  }
})();
