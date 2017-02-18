#! /usr/bin/env node

var argv = require("minimist")(process.argv.slice(2));

var input_path = argv.input || argv.i;
var output_path = argv.output || argv.o;
var mess_with_percussion = argv.percussion || argv.p;

var fn = function(n, event){
	return 127 - n;
};

// var fn = function(n, event){
// 	return (100 - n) % 127;
// };

// var partially_shuffle = function(arr){
// 	for(var i = 0; i < arr.length / 2; i++){
// 		var index_a = ~~(Math.random() * arr.length);
// 		// var index_b = ~~(Math.random() * arr.length);
// 		var index_b = (index_a + ~~(Math.random() * 5)) % arr.length;
// 		var a = arr[index_a];
// 		var b = arr[index_b];
// 		arr[index_a] = b;
// 		arr[index_b] = a;
// 	}
// };
// 
// var mapping = [];
// for(var i = 0; i < 128; i++){
// 	mapping[i] = i;
// }
// partially_shuffle(mapping);
// console.log("Using mapping = " + JSON.stringify(mapping));
// var fn = function(n, event){
// 	return mapping[n];
// };

// var mapping = [];
// // for(var i = 0; i < 128; i++){
// // 	mapping[i] = i;
// // }
// // for(var i = 0; i < 128; i++){
// // 	mapping[i] = 127 - i;
// // }
// for(var i = 0; i < 128; i++){
// 	mapping[i] = (i % 9) * (i % 7) + 24;
// }
// for(var i = 0; i < 128; i++){
// 	mapping[i] = ((i % 12) * (i ^ 12) - i + 127) % 127;
// }
// console.log("mapping = " + JSON.stringify(mapping));
// var fn = function(n, event){
// 	return mapping[n];
// };
// var fn = function(n, event){
// 	return (n + (event.channel - 4) * 12) % (127 - 12 * 2);
// };

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
	var output_dir = path.dirname(output_path);
	mkdirp.sync(output_dir);
	fs.writeFileSync(output_path, new_buffer);
	console.log("Wrote " + output_path);
};

var glob = require("glob");
if(glob.hasMagic(input_path)){
	var glob_prefix = (input_path.match(/^[^*{]*/) || [""])[0];
	var files = glob.sync(input_path);
	files.forEach(function(file_path){
		var output_file_path = path.join(output_path, file_path.replace(glob_prefix, ""));
		transform_file(file_path, output_file_path);
		console.log("");
	});
}else{
	transform_file(input_path, output_path);
}

// console.log("mapping = " + JSON.stringify(mapping));
