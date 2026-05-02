import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Copy, CheckCircle2, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

const InterviewRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [copied, setCopied] = useState(false);
  const [peerConnected, setPeerConnected] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null); // Ref to avoid stale closure

  // Warn before leaving an active call
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (localStreamRef.current) {
        e.preventDefault();
        e.returnValue = 'You are in an active call. Are you sure you want to leave?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  useEffect(() => {
    // 1. Initialize Socket with auth token and dynamic URL
    const token = localStorage.getItem('token');
    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : window.location.origin;
    socketRef.current = io(socketUrl, {
      auth: { token },
    });
    
    // 2. Get local media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localStreamRef.current = stream;
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        
        // 3. Setup WebRTC Peer Connection
        peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS);
        
        // Add local tracks to peer connection
        stream.getTracks().forEach(track => {
          peerConnectionRef.current.addTrack(track, stream);
        });

        // Handle remote stream
        peerConnectionRef.current.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
          setPeerConnected(true);
        };

        // Handle ICE candidates
        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            socketRef.current.emit('ice-candidate', { roomId, candidate: event.candidate });
          }
        };

        // Join room via socket
        socketRef.current.emit('join-room', roomId, user?._id);

        // Socket Events
        socketRef.current.on('user-connected', async (userId) => {
          // I am caller
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          socketRef.current.emit('offer', { roomId, offer });
        });

        socketRef.current.on('offer', async ({ offer }) => {
          // I am receiver
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          socketRef.current.emit('answer', { roomId, answer });
        });

        socketRef.current.on('answer', async ({ answer }) => {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socketRef.current.on('ice-candidate', async ({ candidate }) => {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error('Error adding received ice candidate', e);
          }
        });

        socketRef.current.on('user-disconnected', () => {
          setRemoteStream(null);
          setPeerConnected(false);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        });
      })
      .catch(err => {
        console.error('Error accessing media devices.', err);
        alert('Could not access camera/microphone');
      });

    return () => {
      // Use ref to avoid stale closure — localStream state is captured at mount time
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
      if (peerConnectionRef.current) peerConnectionRef.current.close();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [roomId]);

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const endCall = () => {
    // Properly cleanup before navigating
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    navigate('/interview');
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col bg-background/50 relative">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-10" />

      {/* Header Info */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3 glass-morphism px-4 py-2 rounded-xl border border-border/50">
        <div className={`w-3 h-3 rounded-full ${peerConnected ? 'bg-success shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-warning animate-pulse'}`}></div>
        <span className="text-sm font-semibold tracking-wide">
          {peerConnected ? 'Secure P2P Connection' : 'Waiting for peer...'}
        </span>
      </div>

      <div className="absolute top-6 right-6 z-20">
        <button 
          onClick={copyRoomLink}
          className="flex items-center gap-2 glass-morphism px-4 py-2 rounded-xl border border-border/50 hover:bg-secondary/50 transition-colors text-sm font-medium"
        >
          {copied ? <CheckCircle2 size={16} className="text-success" /> : <Copy size={16} />}
          <span>Room Code: <span className="font-mono text-primary ml-1 select-all">{roomId}</span></span>
        </button>
      </div>

      {/* Main Video Arena */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="relative w-full max-w-6xl aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border border-border/20">
          
          {/* Remote Video (Full Screen inside container) */}
          {remoteStream ? (
            <video 
              ref={remoteVideoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/20">
              <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6 border border-border">
                <UserPlus size={40} className="text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground/80 mb-2">You're the only one here</h2>
              <p className="text-muted-foreground">Share the room code with your peer to start the interview.</p>
            </div>
          )}

          {/* Local Video (Floating PiP) */}
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className={`absolute z-10 bottom-8 right-8 w-64 aspect-video rounded-2xl overflow-hidden border-2 border-border/50 shadow-2xl transition-all duration-300 ${
              isVideoOff ? 'bg-secondary/80 backdrop-blur-md items-center justify-center flex' : 'bg-black'
            }`}
          >
            {isVideoOff ? (
              <VideoOff size={32} className="text-muted-foreground" />
            ) : (
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover transform -scale-x-100"
              />
            )}
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-medium tracking-wider text-white">
              YOU
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating Control Bar */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30">
        <div className="glass-morphism rounded-full px-8 py-4 flex items-center gap-6 shadow-2xl border border-white/10">
          
          <button 
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isMuted ? 'bg-destructive text-white' : 'bg-secondary/80 hover:bg-secondary text-foreground'
            }`}
          >
            {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          
          <button 
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
              isVideoOff ? 'bg-destructive text-white' : 'bg-secondary/80 hover:bg-secondary text-foreground'
            }`}
          >
            {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
          </button>
          
          <div className="w-[1px] h-8 bg-border/50 mx-2"></div>
          
          <button 
            onClick={endCall}
            className="w-16 h-14 rounded-[20px] bg-destructive text-white flex items-center justify-center hover:bg-destructive/90 transition-all shadow-lg shadow-destructive/20"
          >
            <PhoneOff size={22} />
          </button>
          
        </div>
      </div>

    </div>
  );
};

export default InterviewRoom;
