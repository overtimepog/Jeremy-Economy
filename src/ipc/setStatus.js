exports.run = function(msg) {
	this.bot.editStatus(msg.status || 'online', {
		name: `j.help | ${msg.content}`,
		type: parseInt(msg.type) || 0
	})
}
