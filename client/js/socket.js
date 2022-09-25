
let wsInstance = null

export const getSocket = function(username) {

    return wsInstance || (wsInstance = new WebSocket(`ws://127.0.0.1:3000?username=${username}`))
    
}