
const Surface = {
	output: (conv) => {
		return conv.surface.capabilities.has('actions.capability.SCREEN_OUTPUT');
	},
	audio: (conv) => {
		return conv.surface.capabilities.has('actions.capability.AUDIO_OUTPUT');
	},
	playback: (conv) => {
		return conv.surface.capabilities.has('actions.capability.MEDIA_RESPONSE_AUDIO');
	},
	webbrowser: (conv) => {
		return conv.surface.capabilities.has('actions.capability.WEB_BROWSER');
	}
}

module.exports = Surface;

