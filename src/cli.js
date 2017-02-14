var argv = require('minimist')(process.argv.slice(2));

var input_path = argv.input || argv.i;
var output_path = argv.output || argv.o;
var mess_with_percussion = argv.percussion || argv.p;

var fn = function(n){
	return 127 - n;
};

var fs = require('fs');
var midiflip = require('./midiflip.js');

var buffer = fs.readFileSync(input_path);
var array_buffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
var new_array_buffer = midiflip(array_buffer, fn, mess_with_percussion);
var new_buffer = Buffer.from(new_array_buffer);
fs.writeFileSync(output_path, new_buffer);

console.log("Wrote "+output_path);
