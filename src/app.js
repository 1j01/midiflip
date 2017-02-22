
var drop_area_el = document.querySelector("body");
var select_files_el = document.querySelector("#select-files");
var output_list_el = document.querySelector("#output-list");
var output_zipped_el = document.querySelector("#output-zipped");
var results_zipped_container_el = document.querySelector("#results-zipped-container");
var results_container_el = document.querySelector("#results-container");
var clear_results_el = document.querySelector("#clear-results");

var fn = function(n){
	return 127 - n;
};

var results = [];
// var result_blobs_by_file_name = {};
var blob_urls = [];
var zip_blob_url = null;

var clearResults = function(){
	for(var i=0; i<blob_urls.length; i++){
		URL.revokeObjectURL(blob_urls[i]);
	}
	// result_blobs_by_file_name = {};
	results = [];
	blob_urls = [];
	zip_blob_url = null;
	results_container_el.setAttribute("hidden", "hidden");
	results_zipped_container_el.setAttribute("hidden", "hidden");
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

var addFile = function(file, callback){
	
	var result = {file_name: file.name.replace(/\.midi?/, ".transformed.mid")};
	results = results.filter(function(old_result){
		var match = old_result.file_name == result.file_name
		if(match){
			old_result.element.parentElement.removeChild(old_result.element);
			return false;
		}
		return true;
	});
	results.push(result);
	
	var li = document.createElement("li");
	output_list_el.appendChild(li);
	var a = document.createElement("a");
	li.appendChild(a);
	a.textContent = file.name.replace(/\.midi?/, "");
	a.download = file.name;
	
	result.element = li;
	
	var file_reader = new FileReader();
	file_reader.onload = function(){
		try {
			var result_array_buffer = midiflip(this.result, fn);
			result.blob = new Blob([result_array_buffer], {type: "audio/midi"});
			result.blob_url = URL.createObjectURL(result.blob);
			blob_urls.push(result.blob_url);
		} catch(e) {
			result.error = e;
		}
		if(result.error){
			li.classList.add("failed");
			var error_el = document.createElement("div");
			error_el.classList.add("error");
			li.appendChild(error_el);
			if(result.error.message.match("Invalid MIDIFileHeader")){
				error_el.textContent = "Does not appear to be a MIDI file.";
			}else{
				error_el.textContent = result.error;
			}
			// callback(result.error); // nope
		}else{
			a.href = result.blob_url;
			// result_blobs_by_file_name[a.download] = result_blob;
			// callback(null);
		}
		callback();
	};
	file_reader.readAsArrayBuffer(file);
};

var addFiles = function(files){
	if(files.length == 0){
		return;
	}
	results_container_el.removeAttribute("hidden");
	// for(var i=0; i<files.length; i++){
	// 	var file = files[i];
	// 	addFile(file);
	// }
	async.each(files, addFile, function(err){
		// console.log("done, make zip?", results, results.some(function(result){ return result.blob; }));
		// if(Object.keys(result_blobs_by_file_name).length > 1){
		// var n_result_blobs = results.reduce(function(acc, result) {
		// 	return acc + !!result.blob;
		// }, 0);
		if(results.some(function(result){ return result.blob; })){
		// if(n_result_blobs > 1){
			createZip();
		}
	});
};

drop_area_el.addEventListener('dragover', function (e) {
	e.preventDefault();
	e.dataTransfer.dropEffect = 'copy';
}, false);

drop_area_el.addEventListener('dragenter', function (e) {
	e.preventDefault();
	e.dataTransfer.dropEffect = 'copy';
}, false);

drop_area_el.addEventListener('drop', function (e) {
	e.stopPropagation();
	e.preventDefault();
	addFiles(e.dataTransfer.files);
}, false);

var createZip = function(){
	
	URL.revokeObjectURL(zip_blob_url);
	output_zipped_el.innerHTML = "";
	
	results_zipped_container_el.removeAttribute("hidden");
	
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
		// for(var file_name in result_blobs_by_file_name){
		// 	var file = result_blobs_by_file_name[file_name];
		// 	to_write.push({file_name: file_name, file: file});
		// }
		var to_write = results.filter(function(result){ return result.blob; });
		var to_write_index = 0;
		var write_remaining_files = function(){
			
			var item = to_write[to_write_index];
			if(item){
				writer.add(item.file_name, new zip.BlobReader(item.blob), function() {
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
