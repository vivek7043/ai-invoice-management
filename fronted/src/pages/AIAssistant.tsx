import React from 'react'
import ChatWindow from '../components/ChatWindow'

export default function AIAssistant(){
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">AI Assistant</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChatWindow />
      </div>
    </div>
  )
}
