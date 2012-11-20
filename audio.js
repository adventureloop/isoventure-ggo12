//Audio stuff follows. I do not enjoy audio stuff
//window.onload = init;

function init()
{
	var manager = new AudioManager(['../sounds/Shoot.wav']);
	manager.loadSounds(function(){manager.playSound(0)});
}

function AudioManager(urlList)
{
	this.context = new webkitAudioContext();
	this.urlList = urlList;
	this.bufferList = new Array();
	this.loadCount = 0;

	this.playSound = function(index)
	{
		var sound = this.context.createBufferSource();
		sound.buffer = this.bufferList[index];
		sound.connect(this.context.destination);
		sound.noteOn(0);
	};

	this.loadBuffer = function(url,index)
	{
		// Load buffer asynchronously
		var request = new XMLHttpRequest();
		request.open("GET", url, true);
		request.responseType = "arraybuffer";

		var loader = this;

		request.onload = function() {
		// Asynchronously decode the audio file data in request.response
			loader.context.decodeAudioData(
				request.response,
				function(buffer) {
					if (!buffer) {
						alert('error decoding file data: ' + url);
						return;
					}
					loader.bufferList[index] = buffer;
					if (++loader.loadCount == loader.urlList.length) {
						console.log("Finished loading sounds");
						loader.onload();
					}
				},
				function(error) {
					console.error('decodeAudioData error', error);
				}
			);
		}

		request.onerror = function() {
			alert('BufferLoader: XHR error');
		}

		request.send();
	};

	this.loadSounds = function(onload) 
	{
		this.onload = onload;
		for (var i = 0; i < this.urlList.length; ++i)
			this.loadBuffer(this.urlList[i], i);
	};
}
