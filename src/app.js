
var drop_area_el = document.querySelector("body");
var select_files_el = document.querySelector("#select-files");
var output_el = document.querySelector("#output-list");
var clear_results_el = document.querySelector("#clear-results");

var fn = function(n){
	return 127 - n;
};

var blob_urls = [];

var clearResults = function(){
	output_el.innerHTML = "";
	for(var i=0; i<blob_urls.length; i++){
		URL.revokeObjectURL(blob_urls[i]);
	}
};

clear_results_el.addEventListener("click", clearResults);

var selectFiles = function(){
	var files_input_el = document.createElement("input");
	files_input_el.setAttribute("type", "file");
	files_input_el.setAttribute("multiple", "multiple");
	files_input_el.addEventListener("change", function(){
		addFiles(this.files);
	});
	files_input_el.click();
};

select_files_el.addEventListener("click", selectFiles);

var addFile = function(file){
	var file_reader = new FileReader();
	file_reader.onload = function(){
		try {
			var result = midiflip(this.result, fn);
			var result_blob = new Blob([result], {type: "audio/midi"});
			var result_url = URL.createObjectURL(result_blob);
			blob_urls.push(result_url);
		} catch(e) {
			var error = e;
		}
		var li = document.createElement("li");
		output_el.appendChild(li);
		var a = document.createElement("a");
		li.appendChild(a);
		a.textContent = file.name.replace(/\.midi?/, "");
		a.download = file.name.replace(/\.midi?/, ".transformed.mid");
		if(error){
			li.classList.add("failed");
			var error_el = document.createElement("div");
			error_el.classList.add("error");
			li.appendChild(error_el);
			if(error.message.match("Invalid MIDIFileHeader")){
				error_el.textContent = "Does not appear to be a MIDI file.";
			}else{
				error_el.textContent = error;
			}
		}else{
			a.href = result_url;
		}
	};
	file_reader.readAsArrayBuffer(file);
};

var addFiles = function(files){
	for(var i=0; i<files.length; i++){
		var file = files[i];
		addFile(file);
	}
};

drop_area_el.addEventListener('dragover', function (e) {
	e.preventDefault();
	e.dataTransfer.dropEffect = 'move';
}, false);

drop_area_el.addEventListener('dragenter', function (e) {
	e.preventDefault();
	e.dataTransfer.dropEffect = 'move';
}, false);

drop_area_el.addEventListener('drop', function (e) {
	e.stopPropagation();
	e.preventDefault();
	addFiles(e.dataTransfer.files);
}, false);


