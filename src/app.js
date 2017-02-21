
var drop_area_el = document.querySelector("body");
var select_files_el = document.querySelector("#select-files");
var output_list_el = document.querySelector("#output-list");
var output_zipped_el = document.querySelector("#output-zipped");
var results_container_el = document.querySelector("#results-container");
var clear_results_el = document.querySelector("#clear-results");

var fn = function(n){
	return 127 - n;
};

var files = {};
var blob_urls = [];
var zip_blob_url = null;

var clearResults = function(){
	for(var i=0; i<blob_urls.length; i++){
		URL.revokeObjectURL(blob_urls[i]);
	}
	files = {};
	blob_urls = [];
	zip_blob_url = null;
	results_container_el.style.display = "none";
	output_list_el.innerHTML = "";
	output_zipped_el.innerHTML = "";
};

clearResults();
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
		output_list_el.appendChild(li);
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
			files[a.download] = result_blob;
		}
	};
	file_reader.readAsArrayBuffer(file);
};

var addFiles = function(files){
	results_container_el.style.display = "block";
	for(var i=0; i<files.length; i++){
		var file = files[i];
		addFile(file);
	}
	if(files.length > 0){
		createZip();
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

var createZip = function(){
	
	output_zipped_el.innerHTML = "";
	
	var li = document.createElement("li");
	output_zipped_el.appendChild(li);
	var a = document.createElement("a");
	li.appendChild(a);
	a.textContent = "transformed.zip";
	a.download = "transformed.zip";
	var progress_bar = document.createElement("progress");
	li.appendChild(progress_bar);
	
	// use a BlobWriter to store the zip into a Blob object
	zip.createWriter(new zip.BlobWriter(), function(writer) {
		var to_write = [];
		for(var file_name in files){
			var file = files[file_name];
			to_write.push({file_name: file_name, file: file});
		}
		var to_write_index = 0;
		var write_remaining_files = function(){
			
			var item = to_write[to_write_index];
			if(item){
				var file = item.file;
				var file_name = item.file_name;
				
				writer.add(file_name, new zip.BlobReader(file), function() {
					// onsuccess callback
					to_write_index++;
					write_remaining_files();
				}, function(currentIndex, totalIndex) {
					// onprogress callback
					progress_bar.value = (to_write_index + currentIndex / totalIndex) / to_write.length;
				});
			}else{
				// finish writing
				writer.close(function(zip_blob) {
					zip_blob_url = URL.createObjectURL(zip_blob);
					blob_urls.push(zip_blob_url);
					progress_bar.parentElement.removeChild(progress_bar);
					a.href = zip_blob_url;
				});
			}
		};
		
		write_remaining_files();
	}, function(error) {
		// onerror callback
		li.classList.add("failed");
		var error_el = document.createElement("div");
		error_el.classList.add("error");
		li.appendChild(error_el);
		error_el.textContent = error;
	});
};
