let io;

module.exports = {
	init: (httpServer,confige) => {
		io = require('socket.io')(httpServer,confige);
		return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('No Socket initialized yet!');
    }
    return io
  }
};
