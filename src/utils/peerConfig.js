// PeerJS / WebRTC configuration. Uses the public PeerJS signaling server for
// peer discovery and Google's public STUN + Open Relay Project's free TURN as
// an ICE fallback to dramatically improve NAT traversal success.

export const PEER_CONFIG = {
  // PeerJS public signaling server. No backend required.
  host: '0.peerjs.com',
  port: 443,
  secure: true,
  path: '/',
  debug: 1,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ],
  },
}
