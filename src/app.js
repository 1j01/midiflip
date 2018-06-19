
var drop_area_el = document.querySelector("body");
var select_files_el = document.querySelector("#select-files");
var output_list_el = document.querySelector("#output-list");
var output_zipped_el = document.querySelector("#output-zipped");
var results_zipped_container_el = document.querySelector("#results-zipped-container");
var results_container_el = document.querySelector("#results-container");
var clear_results_el = document.querySelector("#clear-results");
var transform_expression_input = document.querySelector("#transform-expression");
var transform_preset_select = document.querySelector("#transform-presets");
var custom_transform_option = document.querySelector("#custom-transform");
var mess_with_percussion_checkbox = document.querySelector("#mess-with-percussion");

var fn;
var mess_with_percussion;

var results = [];
var zip_blob_url = null;

var update_from_settings = function(){
	mess_with_percussion = mess_with_percussion_checkbox.checked;
	
	if (transform_expression_input.value != transform_preset_select.querySelector("option:checked").value) {
		custom_transform_option.selected = true;
		custom_transform_option.value = transform_expression_input.value;
		// NOTE: "Custom" gets overridden if you edit any preset
		// TODO: maybe persist custom preset(s)?
	}
	
	var expr = transform_expression_input.value || transform_expression_input.placeholder;
	try {
		var code = math.compile(expr);
	} catch (e) {
		// TODO: show this error somewhere even if there are no results?
		return function(){
			throw e;
		};
	}
	fn = function(n, event){
		return code.eval({n: n, channel: event.channel});
	};
	
	results_zipped_container_el.setAttribute("hidden", "hidden");
	output_zipped_el.innerHTML = "";
	
	async.each(results, function(result, callback){
		result.compute(callback);
	}, function(err) {
		maybe_create_zip();
	});
};

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

select_files_el.addEventListener("click", function(e) {
	e.preventDefault();
	var files_input_el = document.createElement("input");
	files_input_el.setAttribute("type", "file");
	files_input_el.setAttribute("multiple", "multiple");
	files_input_el.setAttribute("accept", "audio/midi, .midi, .mid");
	files_input_el.addEventListener("change", function() {
		add_files(this.files);
	});
	files_input_el.click();
});

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
	
	result.compute = function(callback) {
		
		// reset from possible previous computation
		result.error = null;
		if(result.error_element){
			result.error_element.parentElement.removeChild(result.error_element);
			result.error_element = null;
		}
		a.removeAttribute("href");
		
		try {
			var result_array_buffer = midiflip(result.input_array_buffer, fn, mess_with_percussion);
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
			result.error_element = error_el
		} else {
			a.href = result.blob_url;
		}
		
		callback();
	};
	
	var file_reader = new FileReader();
	file_reader.onload = function() {
		result.input_array_buffer = this.result;
		result.compute(callback);
	};
	file_reader.readAsArrayBuffer(file);
};

var add_files = function(files) {
	// TODO: maybe accept zip files
	if (files.length == 0) {
		return;
	}
	results_container_el.removeAttribute("hidden");
	async.each(files, add_file, function(err) {
		maybe_create_zip();
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

var maybe_create_zip = function(){
	// NOTE: we create a zip file if there's only one file
	// for feature visibility, and general consistency
	if (results.some(function(result) { return result.blob; })) {
		create_zip();
	}
};

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

update_from_settings();
transform_expression_input.addEventListener("change", update_from_settings);
mess_with_percussion_checkbox.addEventListener("change", update_from_settings);
transform_preset_select.addEventListener("change", function() {
	transform_expression_input.value = transform_preset_select.querySelector("option:checked").value;
	// transform_expression_input.value = transform_preset_select.options[transform_preset_select.selectedIndex].value;
	update_from_settings();
});
