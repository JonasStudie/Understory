const http = require('http');

const server = http.createServer((req, res) => {
  res.end("Your server22222 is working!");
});

server.listen(3000, () => {
  console.log("Server running2222222 on port 3000");
});
