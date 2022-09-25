import { getSocket } from "./socket.js"

const chatPanel = document.getElementById('chat-panel')
const groupId = document.getElementById('group-id')
const username = document.getElementById('username')
const intoChat = document.getElementById('into-chat')
const messageInput = document.getElementById('message-input')
const sendBtn = document.getElementById('send-btn')

let socket = null
let authUsername = null

intoChat.onclick = function() {

    if(!username.value) {
        return alert('昵称不能为空!')
    }

    // if(!groupId.value) {
    //     return alert('群组id不能为空!')
    // }

    username.value = username.value.trim()

    socket = getSocket(username.value)

    handleSocket(socket)

    authUsername = username.value

    intoChat.remove()
    username.readOnly = true
}

sendBtn.onclick = function() {

    if(!socket) {
        return alert('请先加入聊天')
    }

    if(!messageInput.value) {
        return alert('消息内容不能为空!')
    }
    socket.send(JSON.stringify({
        type: 'chat-msg',
        data: messageInput.value
    }))

    messageInput.value = ''


}

function handleSocket(socket) {

    socket.onmessage = function(e) {
    
        const data = JSON.parse(e.data)
        switch(data.type) {
            case 'server-msg':
                chatPanel.appendChild(createMsgPop(data, 'server'))
                break
            case 'chat-msg':
                chatPanel.appendChild(createMsgPop(data, authUsername === data.username ? 'me' : ''))
                break
        }
    }
    
}

const createMsgPop = function(data, type) {
    
    const chat = document.createElement('section')
    
    chat.classList.add('chat-msg', type ? `chat-msg--${type}` : '_')

    chat.innerHTML = (`<!--div class="chat-msg__face">头像</！div-->
    <div class="chat-msg__body ng">
        ${data.username ? `<h6 class="chat-msg__body__user">${data.username}</h6>` : ''}
        <p class="chat-msg__body__content ng">${data.data}</p>
    </di>`)

    return chat
}