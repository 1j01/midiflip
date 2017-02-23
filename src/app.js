
var drop_area_el = document.querySelector("body");
var select_files_el = document.querySelector("#select-files");
var output_list_el = document.querySelector("#output-list");
var output_zipped_el = document.querySelector("#output-zipped");
var results_zipped_container_el = document.querySelector("#results-zipped-container");
var results_container_el = document.querySelector("#results-container");
var clear_results_el = document.querySelector("#clear-results");

var fn = function(n) {
	return 127 - n;
};

var results = [];
var zip_blob_url = null;

var clear_results = function() {
	for (var i = 0; i < results.length; i++) {
		URL.revokeObjectURL(results[i].blob_url);
	}
	URL.revokeObjectURL(zip_blob_url);
	results = [];
	zip_blob_url = null;
	results_container_el.setAttribute("hidden", "hidden");
	results_zipped_container_el.setAttribute("hidden", "hidden");
	output_list_el.innerHTML = "";
	output_zipped_el.innerHTML = "";
};

clear_results_el.addEventListener("click", clear_results);

var select_files = function() {
	var files_input_el = document.createElement("input");
	files_input_el.setAttribute("type", "file");
	files_input_el.setAttribute("multiple", "multiple");
	files_input_el.addEventListener("change", function() {
		add_files(this.files);
	});
	files_input_el.click();
};

select_files_el.addEventListener("click", select_files);

var add_file = function(file, callback) {
	
	var bare_file_name = file.name.replace(/\.midi?/, "")
	var result = {file_name: bare_file_name + ".transformed.mid"};
	results = results.filter(function(old_result) {
		var match = old_result.file_name == result.file_name
		if (match) {
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
	a.textContent = bare_file_name;
	a.download = result.file_name;
	
	result.element = li;
	
	var file_reader = new FileReader();
	file_reader.onload = function() {
		try {
			var result_array_buffer = midiflip(this.result, fn);
			result.blob = new Blob([result_array_buffer], {type: "audio/midi"});
			result.blob_url = URL.createObjectURL(result.blob);
		} catch(e) {
			result.error = e;
		}
		if (result.error) {
			li.classList.add("failed");
			var error_el = document.createElement("div");
			error_el.classList.add("error");
			li.appendChild(error_el);
			if (result.error.message.match("Invalid MIDIFileHeader")) {
				error_el.textContent = "Does not appear to be a MIDI file.";
			} else {
				error_el.textContent = result.error;
			}
		} else {
			a.href = result.blob_url;
		}
		callback();
	};
	file_reader.readAsArrayBuffer(file);
};

var add_files = function(files) {
	if (files.length == 0) {
		return;
	}
	results_container_el.removeAttribute("hidden");
	async.each(files, add_file, function(err) {
		// NOTE: we create a zip file if there's only one file
		// for feature visibility, and general consistency
		if (results.some(function(result) { return result.blob; })) {
			create_zip();
		}
	});
};

drop_area_el.addEventListener("dragover", function (e) {
	e.preventDefault();
	e.dataTransfer.dropEffect = "copy";
}, false);

drop_area_el.addEventListener("dragenter", function (e) {
	e.preventDefault();
	e.dataTransfer.dropEffect = "copy";
}, false);

drop_area_el.addEventListener("drop", function (e) {
	e.stopPropagation();
	e.preventDefault();
	add_files(e.dataTransfer.files);
}, false);

var create_zip = function() {
	
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
		var to_write = results.filter(function(result) { return result.blob; });
		var to_write_index = 0;
		var write_remaining_files = function() {
			var item = to_write[to_write_index];
			if (item) {
				writer.add(item.file_name, new zip.BlobReader(item.blob), function() {
					// onsuccess callback
					to_write_index++;
					write_remaining_files();
				}, function(current_index, total_index) {
					// onprogress callback
					progress_bar.value = (to_write_index + current_index / total_index) / to_write.length;
				});
			} else {
				// finish writing
				writer.close(function(zip_blob) {
					zip_blob_url = URL.createObjectURL(zip_blob);
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
