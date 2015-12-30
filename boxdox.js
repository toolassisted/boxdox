var currentScript = 0;
var currentTime = 0;
var timeline = 0;
var timelineitems = 0;
var animating = false;

function animate()
{
    if (!animating) return;

    animating = true;
    setTime(currentTime + 1);
    timeline.setCustomTime(currentTime,"current");
    
    if(currentTime < currentScript.TotalTicks)
        setTimeout(animate, 64);
    else
    {
        animating = false;
        setTime(0);
        timeline.setCustomTime(0,"current");
    }
}
$(function()
{
    var hash = window.location.hash.substring(1);
    var split = hash.split("-");
    var c = split[0];
    var s = split[1];
    
    $('#viewport').layout({
    onresize: redraw_canvas});
    $("#prevFrameButton").click(function(){ setTime(currentTime-1); timeline.setCustomTime(currentTime,"current"); });
    $("#nextFrameButton").click(function(){ setTime(currentTime+1); timeline.setCustomTime(currentTime,"current"); });
    $("#playButton").click(function()
    { 
        if (animating) {
            animating = false;
        } else {
            animating = true;
            setTime(0);
            timeline.setCustomTime(0,"current");
            animate();
        }
            
    });
    $( "#character" ).change(function () 
    {
        window.location.hash = $( "#character" ).val();
        
        $.ajax({url:"out/json/"+$( "#character" ).val()+"_BAC.json"} )
          //.fail(function(returnedData) { alert("FAIL JSON"); })
          .done(function(returnedData) {
            $("#scripts").html("");
            $.each(returnedData["Scripts"],function( key,value ) {
              var el =$('<li/>', {
                text: value.Name,
                onClick:"loadScript('"+value.Name+"')"
                
            }).addClass("list-group-item")
            if(value.FirstHitboxFrame > 0)
                el.addClass("hasHitbox");
            el.appendTo('#scripts');
            
            });
          })
    });
    if (c != "") {
        $("#character").val(c);
        $("#character").change();
    }
    if (s != undefined)
    loadScript(s,parseInt(split[2]));
});
function redraw_canvas()
{
    setTime(currentTime);
}
function setTime(time)
{
    
    var canvas=document.getElementById("canvas");
    var ctx=canvas.getContext("2d");
    if (canvas.width  != $("#main").innerWidth())
    {
        canvas.width  = $("#main").innerWidth();
    }

    if (canvas.height != $("#main").innerHeight())
    {
        canvas.height = $("#main").innerHeight();
    }
    var stage = new createjs.Stage("canvas");

    
    var CONVERSION = parseInt($("#zoom-factor").val());
    if(!CONVERSION)
    {
        CONVERSION = canvas.width/5;
        $("#zoom-factor").attr("placeholder",CONVERSION);
    }
    var OFFSETX = canvas.width/2;
    var OFFSETY = canvas.height-100;

    var LINES = new createjs.Shape();
    LINES.graphics.setStrokeStyle(1).beginStroke("#333333")
    .moveTo(OFFSETX,0).lineTo(OFFSETX,canvas.height)
    .moveTo(0,OFFSETY-1.32*CONVERSION).lineTo(canvas.width,OFFSETY-1.32*CONVERSION)
    .moveTo(0,OFFSETY-1.7*CONVERSION).lineTo(canvas.width,OFFSETY-1.7*CONVERSION)
    .endStroke();
    stage.addChild(LINES);

    var circle = new createjs.Shape();
    circle.graphics.beginFill("green").drawCircle(OFFSETX, OFFSETY, 5);
    stage.addChild(circle);
    currentTime = time;
    $("#currentFrame").html(currentTime.toString()+" / "+currentScript.TotalTicks);
    //if(!animating)
    history.replaceState(undefined, undefined,"#"+ $( "#character" ).val()+"-"+currentScript.Name+"-"+time);
    var maxHurtboxReach = -100000;
    var maxHitboxReach = -100000;
    var SCRIPTX = 0;
    if (currentScript.Commands[12])
    {
        $(currentScript.Commands[12]).each(function(index,command)
        {
            if(currentTime >= command.TickStart && currentTime < command.TickEnd)
            {
                if (command.Data[0] == 0) SCRIPTX = command.Data[0];
            }
        });
    }
    $(currentScript.Commands[6]).each(function(index,command)
    {
        if(currentTime >= command.TickStart && currentTime < command.TickEnd)
        {
            //ctx.strokeStyle="#0000FF";
            //ctx.strokeRect(OFFSETX+command.Data["X"]*CONVERSION,OFFSETY-(command.Data["Y"]+command.Data["Height"])*CONVERSION,command.Data["Width"]*CONVERSION,command.Data["Height"]*CONVERSION);
            var rect = new createjs.Shape();
            rect.graphics.setStrokeStyle(1, null, null, null, true).beginStroke("#0000FF");
            if(command.Data["Unk10"] == 4)
            {
                rect.graphics.beginStroke("#00ffff");
            }
            rect.graphics.drawRect(SCRIPTX+command.Data["X"],-(command.Data["Y"]+command.Data["Height"]),command.Data["Width"],command.Data["Height"]);
            rect.x = OFFSETX;
            rect.y = OFFSETY;
            rect.scaleX = CONVERSION;
            rect.scaleY = CONVERSION;
            stage.addChild(rect);
            maxHurtboxReach = Math.max(maxHurtboxReach, SCRIPTX+command.Data["X"]+command.Data["Width"]);
        }
    });
    $(currentScript.Commands[5]).each(function(index,command)
    {
        if(currentTime >= command.TickStart && currentTime < command.TickEnd)
        {
            var rect = new createjs.Shape();
            rect.graphics.setStrokeStyle(1, null, null, null, true);
            rect.graphics.beginStroke("#ff0000");
            if(command.Data["HitboxType"] == "PROXIMITY_GUARD"|| command.Data["HitboxType"] == "PROXIMITY_GUARD2")
            {
                rect.graphics.beginStroke("#666666");
            }
            else
            {
                maxHitboxReach = Math.max(maxHitboxReach, SCRIPTX+command.Data["X"]+command.Data["Width"]);
                var text = new createjs.Text("ID="+command.Data["Id"]+"\n"+command.Data["HitLevel"] , "10px Arial", "#ff0000");
                text.x = 5+OFFSETX+SCRIPTX*CONVERSION+command.Data["X"]*CONVERSION;
                text.y = 5+OFFSETY-(command.Data["Y"]+command.Data["Height"])*CONVERSION;
                stage.addChild(text);
            }
            
            rect.graphics.drawRect(SCRIPTX+command.Data["X"],-(command.Data["Y"]+command.Data["Height"]),command.Data["Width"],command.Data["Height"]);
            rect.x = OFFSETX;
            rect.y = OFFSETY;
            rect.scaleX = CONVERSION;
            rect.scaleY = CONVERSION;
            
            stage.addChild(rect);
        }
    });
    var text = 0;
    if(maxHurtboxReach != -100000)
    {
        var text = new createjs.Text("Hurtbox Range:" + maxHurtboxReach.toFixed(3) , "20px Arial", "#0000ff");
        text.x = 10;
        text.y = 10;
        stage.addChild(text);
    }
    if(maxHitboxReach != -100000)
    {
        text = new createjs.Text("Hitbox Range :" + maxHitboxReach.toFixed(3) , "20px Arial", "#ff0000");
        text.x = 10;
        text.y = 30;
        stage.addChild(text);
    }
    if(maxHurtboxReach != -100000 && maxHitboxReach != -100000)
    {
        text = new createjs.Text("Disjoint           :" + (maxHitboxReach-maxHurtboxReach).toFixed(3) , "20px Arial", "#ff7700");
        text.x = 10;
        text.y = 50;
        stage.addChild(text);
    }
    text = new createjs.Text($( "#character" ).val()+" "+currentScript["Name"]+" "+currentTime , "24px Arial", "#ffffff");
    text.x = 500;
    text.y = 10;
    stage.addChild(text);
    stage.update();
}
function loadScript(name,time)
{
    $.ajax( "out/json/"+$( "#character" ).val()+"/"+name+".json" )
      .done(function(data) {
        $("#visualization").html("");
        var container = document.getElementById('visualization');
        timelineitems = new vis.DataSet();
        var groups = new vis.DataSet();
        var dtindex = 1;
        currentScript = data;
        
        if(currentScript.FirstHitboxFrame != -1)
        {
            timelineitems.add([{id: dtindex++, content: 'Startup', start: vis.moment(0), end: vis.moment(currentScript.FirstHitboxFrame), type: 'background', className: 'startup'}]);
            timelineitems.add([{id: dtindex++, content: 'Active', start: vis.moment(currentScript.FirstHitboxFrame), end: vis.moment(currentScript.LastHitboxFrame), type: 'background', className: 'active'}]);
            timelineitems.add([{id: dtindex++, content: 'Recovery', start: vis.moment(currentScript.LastHitboxFrame), end: vis.moment(currentScript.IASAFrame), type: 'background', className: 'recovery'}]);
        }
        // Create a DataSet (allows two way data-binding)
        $( Object.keys(data.Commands) ).each(function( index,type ) 
        {
            if(type > 8)
                return;
            groups.add({id: type, content: type});
            $( data.Commands[type] ).each(function(index,command)
            {
                
                timelineitems.add([{id: dtindex++, group: type, content: JSON.stringify(command.Data), start: vis.moment(command.TickStart), end: vis.moment(command.TickEnd) }]);
            });
            
        });
        
          // Configuration for the Timeline
        var options = {
          align:"left",
          min: 0,
          max: data.IASAFrame,
          zoomable:true,
          timeAxis: {scale: 'millisecond', step: 1},
          showMajorLabels: false,
          orientation:"both"
        }
        if(data.IASAFrame == -1)
            options.max = data.TotalTicks;
        // Create a Timeline
        timeline = new vis.Timeline(container, timelineitems, options);
        timeline.setGroups(groups);
        if(!time)
            time = 0;
        setTime(time);
        timeline.addCustomTime(1,"current");
        timeline.setCustomTime(0,"current");
        
        
        timeline.on('timechange', function (properties) {
            if(properties.time.getMilliseconds() != currentTime)
                setTime(properties.time.getMilliseconds());
        });
        timeline.on('timechanged', function (properties) {
             if(properties.time.getMilliseconds() != currentTime)
                setTime(properties.time.getMilliseconds());
        });
        timeline.on('select', function(items,event)
        {
            $("#data").html("");
            $(items.items).each(function(index,el)
            {
                //console.log(el);
                //console.log(timelineitems.get(el));
                $('<pre/>', {
                    text: JSON.stringify(JSON.parse(timelineitems.get(el).content),null,'\t'),
                    
                }).appendTo($("#data"));
            });
        });
        timeline.on('click', function (properties) {
            if(properties.time.getMilliseconds() != currentTime)
            {
                setTime(properties.time.getMilliseconds());
                timeline.setCustomTime(currentTime,"current");
            }
        });
    })
}
