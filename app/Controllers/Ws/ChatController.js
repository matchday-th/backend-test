'use strict'

const Chat = use('App/Models/Chat')
const ReadMessage = use('App/Models/ReadMessage')

class ChatController {
  constructor ({ socket, request }) {
    this.socket = socket
    this.request = request
  }

  async onMessage (data) {
    if(data.chat_ids){
      await  data.chat_ids.forEach(async (chat_id) => {
        if(chat_id!=0){
          const readFilter = await ReadMessage
          .query()
          .where('user_id',data.user_id)
          .where('chat_id',chat_id)
          .fetch()

       if(readFilter.rows.length==0){  
           const read_message = new ReadMessage()
          read_message.chat_id = chat_id
          read_message.user_id = data.user_id
           await read_message.save()
        }
      }
      });
    }else{
      const chat = new Chat()
      chat.room_id = data.room_id
      chat.message = data.message
      chat.user_id = data.user_id
      await chat.save()
    }
      

    const chatFilter = await Chat
    .query()
    .where('room_id',this.socket.topic)
    .with('read_messages')
    .with('user')
    .fetch()

    let chats = chatFilter.toJSON();
    this.socket.broadcastToAll('message', chats)
  }

  async onUnRead(data) {
     var mybooking = await this.getMyBooking(data.mybooking,data.user_id)
     var joinbooking = await this.getMyBooking(data.joinbooking,data.user_id)
    this.socket.broadcastToAll('unread',  [mybooking,joinbooking])
   
  }

  async onReload(data) {
   this.socket.broadcastToAll('reload',  data)
 }

  async  getMyBooking (mybooking,user_id){
      const result_final = []
      const chatFilter = await Chat
     .query()
     .whereIn('room_id',mybooking.match_ids)
     .where('user_id','!=',user_id)
     .with('read_messages')
     .with('user')
     .fetch()

     var messages_result = chatFilter.toJSON()
     var message_unread = []
      
        const read_message = await ReadMessage
        .query()
        .where('user_id',user_id)
        .fetch()

        let read_result = read_message.toJSON();

         message_unread = filterByReference(messages_result, read_result)

      var message_match =  count_duplicate(message_unread.map(obj => obj.room_id))
      for (let obj in message_match){
       if (message_match[obj] >= 1){
         result_final.push({'match_id':obj,'count':message_match[obj]})
       }
      }
       return result_final;
  } 

  
}

const filterByReference = (arr1, arr2) => {
  let res = [];
  res = arr1.filter(el => {
     return !arr2.find(element => {
        return element.chat_id === el.id;
     });
  });

  return res;
}
function count_duplicate(a){
  let counts = {}
 
  for(let i =0; i < a.length; i++){ 
      if (counts[a[i]]){
      counts[a[i]] += 1
      } else {
      counts[a[i]] = 1
      }
     }  
     return counts
 }
 


module.exports = ChatController
