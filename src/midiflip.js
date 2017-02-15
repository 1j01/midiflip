
var MIDIFile = require("midifile");
var MIDIEvents = require("midievents");

module.exports = function(arrayBuffer, fn, mess_with_percussion){

	var midiFile = new MIDIFile(arrayBuffer);

	// Reading headers
	// midiFile.header.getFormat(); // 0, 1 or 2
	// midiFile.header.getTracksCount(); // n
	// Time division
	// if(midiFile.header.getTimeDivision() === MIDIFile.Header.TICKS_PER_BEAT) {
	// 	midiFile.header.getTicksPerBeat();
	// } else {
	// 	midiFile.header.getSMPTEFrames();
	// 	midiFile.header.getTicksPerFrame();
	// }

	// MIDI events retriever
	// var events = midiFile.getMidiEvents();
	// // events[0].subtype; // type of MIDI event
	// // events[0].playTime; // time in ms at wich the event must be played
	// // events[0].param1; // first parameter
	// // events[0].param2; // second one
	// 
	// for(var i=0; i<events.length; i++){
	// 	var event = events[i];
	// 	if(event.type === MIDIEvents.EVENT_MIDI_NOTE_OFF || event.type === MIDIEvents.EVENT_MIDI_NOTE_ON){
	// 		console.log(event.param1);
	// 		event.param1 = fn(event.param1);
	// 	}
	// }
	
	for(var track_index = 0; track_index < midiFile.tracks.length; track_index++){
		// var rewritten = 0;
		var tntmwp = false;
		var events = midiFile.getTrackEvents(track_index);
		for(var i=0; i<events.length; i++){
			var event = events[i];
			if(event.type === MIDIEvents.EVENT_MIDI){
				if(event.subtype === MIDIEvents.EVENT_MIDI_NOTE_OFF || event.subtype === MIDIEvents.EVENT_MIDI_NOTE_ON){
					// console.log(event.subtype == event.type, event.channel);
					var isPercussion = event.channel === 10;
					if(!isPercussion || mess_with_percussion){
						event.param1 = fn(event.param1, {channel: event.channel, isPercussion: isPercussion});
					}else{
						tntmwp = true;
					}
					// rewritten++;
				}
			}
		}
		if(tntmwp){
			console.log("Tried not to mess with percussion");
		}
		midiFile.setTrackEvents(track_index, events);
		// console.log("(Modified " + rewritten + " of " + events.length + " events in track " + track_index + ")");
	}
	
	return midiFile.getContent();
};
