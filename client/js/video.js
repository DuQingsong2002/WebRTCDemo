import { sendToServer } from "./socket.js"

const playVideo = document.getElementById('play-video')


const createVideoByStream = function(stream) {
    const video = document.createElement('video')
    video.srcObject = stream
    video.autoplay = true
    return video
}

const CAMERA_WIDTH = 256
const CAMERA_HEIGHT = 120
const VIDEO_WIDTH = 1280
const VIDEO_HEIGHT = 600

let cameraVideoStream = null
let remoteVideo = null
let cameraVideo = null
let stream = null
let targetUsername = null

/**
 * @type {RTCPeerConnection}
 */
export let peerConnection = null

const createPeerConnection = async function() {

    peerConnection = new RTCPeerConnection()
    peerConnection.onicecandidate = handleICECandidateEvent
    peerConnection.onnegotiationneeded = handleNegotiationNeededEvent
    peerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
    peerConnection.ontrack = (e) => {
        console.log('eee', e)
        remoteVideo = createVideoByStream(e.streams[0])
    }

    return peerConnection

}

export const invite = async function(username) {

    targetUsername = username

    createPeerConnection()

    const stream = await initVideo()
    cameraVideoStream.getTracks().forEach(track => peerConnection.addTransceiver(track, { streams: [stream] }))


}

export const handleVideoOfferMsg = async function({sdp, username}) {
    targetUsername = username

    if(!peerConnection) {
        createPeerConnection()
    }
    
    const remoteSdp = new RTCSessionDescription(sdp)

    if (peerConnection.signalingState != "stable") {
    
        await Promise.all([
          peerConnection.setLocalDescription({type: "rollback"}),
          peerConnection.setRemoteDescription(remoteSdp)
        ]);
        return;
    } else {

        await peerConnection.setRemoteDescription(remoteSdp)
    }

    
    await peerConnection.setLocalDescription(await peerConnection.createAnswer());

    console.log('send offer sdp', peerConnection.localDescription);

    
    if(!cameraVideoStream) {

        const stream = await initVideo()
        cameraVideoStream.getTracks().forEach(track => peerConnection.addTransceiver(track, { streams: [stream] }))
    }

    sendToServer({
        target: targetUsername,
        type: "video-answer",
        sdp: peerConnection.localDescription
    })


}

export const handleVideoAnswerMsg = async function({sdp}) {
    
    console.log('receive offer sdp', sdp)
        
    const desc = new RTCSessionDescription(sdp);
    await peerConnection.setRemoteDescription(desc).catch(console.trace);
}

async function initVideo() {
    const videoCanvas = document.createElement('canvas')
    videoCanvas.width = VIDEO_WIDTH
    videoCanvas.height = VIDEO_HEIGHT
    const ctx = videoCanvas.getContext('2d')

    cameraVideoStream = await navigator.mediaDevices.getUserMedia({audio: true,video: {width: VIDEO_WIDTH, height: VIDEO_HEIGHT}})
    cameraVideo = createVideoByStream(cameraVideoStream)
    const renderVideoCanvas = function() {
        if(remoteVideo) {
            ctx.drawImage(remoteVideo, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT)
        }
        if(cameraVideo) {
            ctx.drawImage(cameraVideo, VIDEO_WIDTH - CAMERA_WIDTH, VIDEO_HEIGHT - CAMERA_HEIGHT, CAMERA_WIDTH, CAMERA_HEIGHT)
        }
        window.requestAnimationFrame(renderVideoCanvas)
    }
    window.requestAnimationFrame(renderVideoCanvas)

    stream = videoCanvas.captureStream()

    playVideo.srcObject = stream
    return stream
}

function handleICECandidateEvent(event) {
    if (event.candidate) {
        sendToServer({
            type: "new-ice-candidate",
            target: targetUsername,
            candidate: event.candidate
        })
    }
}

export function handleNewICECandidateMsg(data) {
    const candidate = new RTCIceCandidate(data.candidate);
    peerConnection.addIceCandidate(candidate).catch(console.trace);
}

async function handleNegotiationNeededEvent() {
    const offer = await peerConnection.createOffer()
    
    if (peerConnection.signalingState != "stable") return;

    await peerConnection.setLocalDescription(offer)

    console.log('negotiation needed send offer', peerConnection.localDescription);

    sendToServer({
        target: targetUsername,
        type: 'video-offer',
        sdp: peerConnection.localDescription
    })
}

function handleSignalingStateChangeEvent() {
    console.log('rtc signaling state change: ', peerConnection.signalingState )
    switch(peerConnection.signalingState) {
        case "closed":
            closeVideoCall();
            break;
    }
}

function closeVideoCall() {

    console.log('close rtc')

    if(peerConnection) {
        peerConnection.ontrack = null
        peerConnection.ononnicecandidatetrack = null
        peerConnection.onsignalingstatechange = null
        peerConnection.getTransceivers().forEach(t => t.stop())
    }

    stream.getTracks().forEach(track => track.stop())

    peerConnection.close()
    peerConnection = null
    
}