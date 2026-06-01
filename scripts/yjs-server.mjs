// 로컬 dev + 클라우드 배포용 minimal Y.js WebSocket 릴레이. y-websocket 3.0.0이 서버 코드를
// 분리·미배포해 직접 작성. room 단위 broadcast만 수행한다.
import http from 'node:http';
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT ?? 1234);

// HTTP GET은 health check용 200만 응답하고, WebSocket upgrade는 ws 서버가 가로챈다.
// Render·Koyeb 등 클라우드 호스트의 헬스 체크가 200을 받게 하려고 같은 포트에 http 서버를 둔다.
const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end('ok');
});

const wss = new WebSocketServer({ server });

/** room(canvasId) → Set<WebSocket>. URL의 마지막 segment를 room으로 사용. */
const rooms = new Map();

wss.on('connection', (ws, req) => {
  const room = (req.url ?? '/').split('/').pop() ?? 'default';
  let peers = rooms.get(room);
  if (!peers) {
    peers = new Set();
    rooms.set(room, peers);
  }
  peers.add(ws);

  ws.on('message', (data) => {
    // y-websocket 프로토콜 메시지(awareness·sync)를 같은 room의 다른 peer에게 그대로 전달.
    for (const peer of peers) {
      if (peer !== ws && peer.readyState === peer.OPEN) peer.send(data);
    }
  });

  ws.on('close', () => {
    peers.delete(ws);
    if (peers.size === 0) rooms.delete(room);
  });
});

server.listen(PORT, () => {
  console.log(`y-websocket server on :${PORT}`);
});
