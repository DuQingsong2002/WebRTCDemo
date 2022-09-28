
/**
 * @type {WebSocket}
 */
let wsInstance = null

export const getSocket = function(username) {

    return wsInstance || (wsInstance = new WebSocket(`ws://192.168.0.102:3000?username=${username}`))
    
}

export const sendToServer = function(data) {

    if(!wsInstance) {
       return alert('请先加入聊天!')
    }

    wsInstance.send(JSON.stringify(data))
}