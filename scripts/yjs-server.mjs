// 로컬 dev용 minimal Y.js WebSocket 릴레이. fly.io 프로덕션은 별도 배포로 다룸.
// y-websocket 3.0.0이 서버 코드를 분리·미배포해 직접 작성. room 단위 broadcast만 수행한다.
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT ?? 1234);
const wss = new WebSocketServer({ port: PORT });

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

console.log(`y-websocket dev server on ws://localhost:${PORT}`);
