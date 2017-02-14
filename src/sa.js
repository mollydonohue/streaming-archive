/*
 Streaming Archive JS 
 Created Molly Donohue Fall 2016
 */

$(document).ready(function() {
    var twoWeeks = moment().subtract(14, "d").format("YYYY-MM-DD");
    var chosenDate = moment();
    var chosenTime = moment().format("HH:mm");



    // TEMP CODE Start 
    // player for insertion into old kexp site, will delete after new kexp is launched
    // update the meta data for the current song that is playing
    var music = document.getElementById('music'); // id for audio element
    var duration = music.duration; // Duration of audio clip, calculated here for embedding purposes
    var pButton = document.getElementById('pButton'); // play button
    var playhead = document.getElementById('playhead'); // playhead
    var timeline = document.getElementById('timeline'); // timeline

    // timeline width adjusted for playhead
    var timelineWidth = timeline.offsetWidth - playhead.offsetWidth;

    // play button event listenter
    pButton.addEventListener("click", play);

    // timeupdate event listener
    music.addEventListener("timeupdate", timeUpdate, false);

    // makes timeline clickable
    timeline.addEventListener("click", function(event) {
        moveplayhead(event);
        music.currentTime = duration * clickPercent(event);
    }, false);

    // returns click as decimal (.77) of the total timelineWidth
    function clickPercent(event) {
        return (event.clientX - getPosition(timeline)) / timelineWidth;
    }

    // makes playhead draggable
    playhead.addEventListener('mousedown', mouseDown, false);
    window.addEventListener('mouseup', mouseUp, false);

    // Boolean value so that audio position is updated only when the playhead is released
    var onplayhead = false;

    // mouseDown EventListener
    function mouseDown() {
        onplayhead = true;
        window.addEventListener('mousemove', moveplayhead, true);
        music.removeEventListener('timeupdate', timeUpdate, false);
    }

    // mouseUp EventListener
    // getting input from all mouse clicks
    function mouseUp(event) {
        if (onplayhead == true) {
            moveplayhead(event);
            window.removeEventListener('mousemove', moveplayhead, true);
            // change current time
            music.currentTime = duration * clickPercent(event);
            music.addEventListener('timeupdate', timeUpdate, false);
        }
        onplayhead = false;
    }
    // mousemove EventListener
    // Moves playhead as user drags
    function moveplayhead(event) {
        var newMargLeft = event.clientX - getPosition(timeline);

        if (newMargLeft >= 0 && newMargLeft <= timelineWidth) {
            playhead.style.marginLeft = newMargLeft + "px";
        }
        if (newMargLeft < 0) {
            playhead.style.marginLeft = "0px";
        }
        if (newMargLeft > timelineWidth) {
            playhead.style.marginLeft = timelineWidth + "px";
        }
    }

    // timeUpdate
    // Synchronizes playhead position with current point in audio
    function timeUpdate() {
        var playPercent = timelineWidth * (music.currentTime / duration);
        playhead.style.marginLeft = playPercent + "px";
        if (music.currentTime == duration) {
            pButton.className = "";
            pButton.className = "play";
        }
    }

    //Play and Pause
    function play() {
        // start music
        if (music.paused) {
            music.play();
            // remove play, add pause
            pButton.className = "";
            pButton.className = "pause";

        } else { // pause music
            music.pause();
            // when music is paused clear the src so it cannot restart
            // also stop refreshing the meta data
            $("#music").attr("src", '');
            clearInterval(interval);
            // remove pause, add play
            //pButton.className = "";
            //pButton.className = "play";
        }
    }

    // Gets audio file duration
    music.addEventListener("canplaythrough", function() {
        duration = music.duration;
    }, false);

    // getPosition
    // Returns elements left position relative to top-left of viewport
    function getPosition(el) {
        return el.getBoundingClientRect().left;
    }
    ///// END of temp player code 






 // update song info every 20 seconds by calling selleck
    function showMeta() {
        console.log("before time change " + chosenTime);
        newTime = new Date(chosenDate + " " + chosenTime);
        newTime.setMinutes(newTime.getMinutes() - 3);
        fullTime = newTime.toString();
        chosenTime = fullTime.substring(16,24);
        fetchMeta();
        interval = setInterval(fetchMeta, 1000*20);
    }

    function fetchMeta() {

        t = new Date(chosenDate + " " + chosenTime);
        // add 20 seconds to desired time each time this loop is called
        t.setSeconds(t.getSeconds() + 20);
        fullTime = t.toString();
        chosenTime = fullTime.substring(16,24);
        startMeta = chosenDate + "T" + chosenTime + ".000000Z";
        var isUpdated = false;
        $.get("http://legacy-api.kexp.net/play/?ordering=airdate&begin_time="+ startMeta, function(data, status){
            for (var i = 0; i < data.results.length; i++) {
                // if artist is null it is an airbreak 
                if (data.results[i].airdate >= startMeta && !isUpdated) {
                    isUpdated = true;
                    labelmeta = "";
                    //  is airbreak
                    if (data.results[i].artist == null)  {
                        artistname = "Air break";
                        songname = "";
                        albumname = "";
                        imguri = "logo-black.svg";
                    } else { // not an airbreak
                        artistname = data.results[i].artist.name || "Not set";
                        songname = data.results[i].track.name || "Not set";
                        albumname = data.results[i].release.name  || "Not set";
                        imguri = data.results[i].release.largeimageuri || "logo-black.svg";
                        if (data.results[i].label != null) {
                            labelmeta += data.results[i].label.name || "Not set";
                            labelmeta += " - ";
                            labelmeta += data.results[i].releaseevent.year  || "Not set";
                        }
                    }
                    $("#metaartist").html(artistname);
                    $('#metatitle').html(songname);
                    $('#metaalbum').html(albumname);
                    $('#metaimg').attr('src', imguri);
                    $("#metayear").html(labelmeta);

                    $("#meta").show();
                    $("#audioplayer").show();
                }
            }

        });
    }

    // "By Day and Time" tab
    // Update global chosen date and time if flatpickr is used
    $("#datepicker").flatpickr({
        defaultDate: "today",
        minDate: twoWeeks,
        maxDate: moment().subtract(4, "h").format("YYYY-MM-DD HH:mm"),
        enableTime: true,
        utc: true,
        altInput: true,
        altFormat: "F j, Y h:i K",
        // calendar returns the desired date and time as a string, which is split to update the globals
        // time is converted to UTC 
        onChange: function(dateObj, dateStr, instance) {
            $(".Alert").hide();
            UTCstring = moment(dateStr).utc().format().toString();
            chosenStr = UTCstring.split("T");
            chosenDate = chosenStr[0];
            chosenTime = chosenStr[1].substring(0,5);
            // if within the past four hours, ask to pick an older time
            if ((moment().subtract(4, "h")).diff(moment(dateStr)) < 0) {
                $('#error').empty().append("<p>Please select a time that occurred more than four hours ago</p>");
                $('#error').show();
            } else { // time is valid in range
                $("#submit").prop("disabled", false);
            }
        },
    });

    // "By Show" tab, enable submit only if a time is chosen
    $("#showTimes").on("change", function(){
        $("#submit").prop("disabled", false);
        hideThings();
    });

    // "By Show" tab, populate shows
    $.get("http://legacy-api.kexp.net/show/?limit=100&ordering=name", function(data, status) {
        for (var i = 0; i < data.results.length; i++) {
            //Does not add Variety Mix as an option because the hosts are all different
            if (data.results[i].program.name.toLowerCase() != 'variety mix') {
                var new_val = data.results[i].program.programid;
                // check if the show title is already in the list
                if (!$('option[value='+new_val+']', '#chooseShow').length) {
                    //alert('nope, exists!')
                    var newHost = "<option value=" + data.results[i].program.programid + ">" + data.results[i].program.name + "</option"
                    $("#chooseShow").append(newHost);
                }
            }
        }
    });

    // "By Show" tab, populates show times for selected show from Selleck
    $("#chooseShow").on("change", function(){
        // Hide any previously shown alerts, show times, or meta play data
        hideThings();
        $("#showTimesSelect").hide();
        $("#showTimes").empty().append("<option value='default'>Available Times:</option>");
        selected = ($("#chooseShow").find(":selected").text());
        selectedShowId = ($("#chooseShow").find(":selected").val());
        $.get("http://legacy-api.kexp.net/show/?limit=300&ordering=-createddate", function(data, status){
            for (var i = 0; i < data.results.length; i++) {
                if (data.results[i].program.programid == selectedShowId) {
                    start_time = data.results[i].airdate;
                    displayTimes(start_time, "#showTimes");
                    $("#showTimesSelect").css('display', 'inline-block');
                }
            };
        });
    });


    // Populate "By Host" tab dropdown of show hosts from Selleck
    // assign host id as value 
    $.get("http://legacy-api.kexp.net/host/?limit=100&ordering=name", function(data, status){
        // example: <option value="201">Atticus</option>
        for (var i = 0; i < data.results.length; i++) {
            //if (data.results[i].isactive) {
                newShowHost = "<option value=" + data.results[i].hostid + ">" +
                    data.results[i].name + "</option>";
                $("#showHosts").append(newShowHost);
            //}
        }
    });

    // "By Host" tab
    // Add available times for chosen DJ
    $("#showHosts").on("change", function() {
        // on change, reset former times that could be leftover
        hideThings();
        $("#timesHostsSelect").hide();
        $("#showTimesHost").empty().append("<option value='default'>Available Times:</option>");
        chosenId = ($("#showHosts").val());
        $.get("http://legacy-api.kexp.net/show/?limit=400&ordering=-createddate", function(data, status){
            for (var i=0; i < data.results.length; i++) {
                if (data.results[i].hosts[0].hostid == chosenId) {
                    start_time = data.results[i].airdate;
                    displayTimes(start_time, "#showTimesHost");
                    $("#showTimesSelect").show();
                    $("#timesHostsSelect").css('display', 'inline-block');
                }
            }
            if ($("#showTimesHost").css('display') == "none") {
                $('#error').empty().append("<p>No recordings for selected DJ</p>");
                $('#error').show();
                $('#meta').hide();
            }
        });
    });

    ///on "By Host" tab, enable submit only if a time is chosen
    $("#showTimesHost").on("change", function(){
        $("#submit").prop("disabled", false);
        hideThings();
    });

    //  format a passed time, add to passed dropdown, and display dropdown
    // displays times in local time, with 12 hour times, and AM/PM label
    function displayTimes(start_time, dropdown){
        var stringLocal = moment.utc(start_time).local().format();
        if (start_time >= twoWeeks) {
            optionTime = start_time.substring(11,16);
            timeLocal = stringLocal.substring(11,16);
            timeFriendly = moment(timeLocal, "HH:mm").format("hh:mm A");
            startDay = start_time.substring(0,10);
            dayLocal = stringLocal.substring(0,10);
            optionText = "<option value=" + startDay + "_" + optionTime + "> "
                + dayLocal + " at " + timeFriendly + "  " + "</option>";
            // adds functionality for on click behavior for each time created
            // updates global variables for selected time
            $(dropdown).append(optionText).change(function() {
                var chosenStr = this.value.split("_");
                chosenDate = chosenStr[0];
                chosenTime = chosenStr[1];
            });
            $(dropdown).show();
        }
        // after looping through results, display that no shows are within the last 14 days
        if ($(dropdown).css('display') == "none") {
            $('#error').empty().append("<p>No recordings in the past two weeks</p>");
            $('#error').show();
        }

    }

    // Hide any previously shown alerts, show times, or meta play data
    function hideThings() {
        $('#audioplayer').hide();
        $(".Alert").hide();
        $("#meta").hide();
        clearInterval(interval);
    }



    //Set The Player
    $("#submit").on("click", function(){
        pButton.className = "";
        pButton.className = "play";
        hideThings();
        //url = "http://as1.kexp.org/playlist/archive/raw/1/256/2017-02-03T09:00:00Z";
        url = "http://legacy-api.kexp.org/get_streaming_url/?bitrate=128&timestamp=" + chosenDate + "T" + chosenTime + ":00Z";

        $.get(url, function(data, status){
            console.log(data);
            var playable = data.uri;
            $('#music').attr("src", playable);
        });
        $('#audioplayer').show();
        play();
       

        showMeta();
        $("#submit").prop("disabled", true);

    });
});