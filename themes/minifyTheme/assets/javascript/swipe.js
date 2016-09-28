// create a simple instance
// by default, it only adds horizontal recognizers
var mc = new Hammer(document.getElementsByClassName("wrapped-content")[0]);

mc.get('swipe').set({ velocity: 0.02 });
// listen to events...
mc.on("swipeleft", function(ev) {
    if($('#nextUrl').data("id").length){
        var nexturl = "http://www.hobbynight.ca/blog/post/" + $('#nextUrl').data("id");
        window.location = nexturl;
    }else{
        window.location = "http://hobbynight.ca";
    }
});

mc.on("swiperight", function(ev) {
    if($('#prevUrl').data("id").length){
        var prevurl = "http://www.hobbynight.ca/blog/post/" + $('#prevUrl').data("id");
        window.location = prevurl;
    }else{
        window.location = "http://hobbynight.ca";
    }
});