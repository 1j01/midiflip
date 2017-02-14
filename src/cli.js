var argv = require('minimist')(process.argv.slice(2));

var input_path = argv.input || argv.i;
var output_path = argv.output || argv.o;
var mess_with_percussion = argv.percussion || argv.p;

var fn = function(n){
	return 127 - n;
};

var fs = require("fs");
var path = require("path");
var mkdirp = require("mkdirp");
var midiflip = require("./midiflip.js");

var transform_file = function(input_path, output_path){
	console.log("Load " + input_path);
	var buffer = fs.readFileSync(input_path);
	var array_buffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
	var new_array_buffer = midiflip(array_buffer, fn, mess_with_percussion);
	var new_buffer = Buffer.from(new_array_buffer);
	fs.writeFileSync(output_path, new_buffer);
	console.log("Wrote " + output_path);
};

var glob = require("glob");
if(glob.hasMagic(input_path)){
	var glob_prefix = (input_path.match(/^[^*{]*/) || [""])[0];
	var files = glob.sync(input_path);
	files.forEach(function(file_path){
		// console.dir({file_path, glob_prefix});
		var file_output_path = path.join(output_path, file_path.replace(glob_prefix, ""));
		// console.log(file_output_path);
		var file_output_dir = path.dirname(file_output_path);
		mkdirp.sync(file_output_dir);
		transform_file(file_path, file_output_path);
		console.log("\n");
	});
}else{
	transform_file(input_path, output_path);
}

