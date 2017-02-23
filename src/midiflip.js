
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['midifile', 'midievents'], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        
		var MIDIFile = require('midifile');
		var MIDIEvents = require('midievents');

        module.exports = factory(MIDIFile, MIDIEvents);
    } else {
        // Browser globals (root is window)
        root.midiflip = factory(root.MIDIFile, root.MIDIEvents);
    }
}(this, function (MIDIFile, MIDIEvents) {
	return function(arrayBuffer, fn, mess_with_percussion){
		
		var midiFile = new MIDIFile(arrayBuffer);
		
		for(var track_index = 0; track_index < midiFile.tracks.length; track_index++){
			var tntmwp = false;
			var events = midiFile.getTrackEvents(track_index);
			for(var i=0; i<events.length; i++){
				var event = events[i];
				if(event.type === MIDIEvents.EVENT_MIDI){
					if(event.subtype === MIDIEvents.EVENT_MIDI_NOTE_OFF || event.subtype === MIDIEvents.EVENT_MIDI_NOTE_ON){
						var isPercussion = event.channel === 10; // Channel 11
						// TODO:
						// var isPercussion = event.channel === 9 || event.channel === 10; // Channel 10 or 11
						// NOTE: I don't think channel 11 (coded 10) is guaranteed to be percussion.
						if(!isPercussion || mess_with_percussion){
							event.param1 = fn(event.param1, {channel: event.channel, isPercussion: isPercussion});
						}
					}
				}
			}
			midiFile.setTrackEvents(track_index, events);
		}
		
		return midiFile.getContent();
	};
}));
