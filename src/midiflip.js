
var MIDIFile = require("midifile");
var MIDIEvents = require("midievents");

module.exports = function(arrayBuffer, fn){

	// Creating the MIDIFile instance
	var midiFile = new MIDIFile(arrayBuffer);

	// Reading headers
	midiFile.header.getFormat(); // 0, 1 or 2
	midiFile.header.getTracksCount(); // n
	// Time division
	if(midiFile.header.getTimeDivision() === MIDIFile.Header.TICKS_PER_BEAT) {
		midiFile.header.getTicksPerBeat();
	} else {
		midiFile.header.getSMPTEFrames();
		midiFile.header.getTicksPerFrame();
	}

	// MIDI events retriever
	// var events = midiFile.getMidiEvents();
	// // events[0].subtype; // type of [MIDI event](https://github.com/nfroidure/MIDIFile/blob/master/src/MIDIFile.js#L34)
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
		var rewritten = 0;
		var events = midiFile.getTrackEvents(track_index);
		for(var i=0; i<events.length; i++){
			var event = events[i];
			if(event.type === MIDIEvents.EVENT_MIDI_NOTE_OFF || event.type === MIDIEvents.EVENT_MIDI_NOTE_ON){
				// console.log(event.param1);
				event.param1 = fn(event.param1);
				rewritten++;
			}
		}
		midiFile.setTrackEvents(track_index, events);
		console.log("(Modified " + rewritten + " of " + events.length + " events in track " + track_index + ")");
	}
	
	

	// Lyrics retriever
	// var lyrics = midiFile.getLyrics();
	// if ( lyrics.length ) {
	// 	lyrics[0].playTime; // Time at wich the text must be displayed
	// 	lyrics[0].text; // The text content to be displayed
	// }

	// Reading whole track events and filtering them yourself
	// var events = midiFile.getTrackEvents(0);
	// 
	// events.forEach(console.log.bind(console));
// 
	// // Or for a single track
	// var trackEventsChunk = midiFile.tracks[0].getTrackContent();
	// var events = MIDIEvents.createParser(trackEventsChunk);
	// 
	// var event;
	// while(event = events.next()) {
	// 	// Printing meta events containing text only
	// 	if(event.type === MIDIEvents.EVENT_META && event.text) {
	// 		console.log('Text meta: '+event.text);
	// 	}
	// }
	
	return midiFile.getContent();
};
