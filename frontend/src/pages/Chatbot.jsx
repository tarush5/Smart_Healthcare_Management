import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles } from 'lucide-react'

const ML_URL = 'http://localhost:8000'

const INITIAL_MESSAGES = [
  {
    role: 'bot',
    text: "Hello! 👋 I'm your **AI Healthcare Assistant**. I can help you with:\n\n• **Symptom analysis** — Tell me your symptoms\n• **Disease information** — Ask about heart disease, diabetes, etc.\n• **Prevention tips** — How to stay healthy\n• **Health metrics** — BMI, blood pressure, cholesterol\n\nHow can I help you today?",
    suggestions: ['I have chest pain', 'What is diabetes?', 'How to prevent heart disease?', 'What is BMI?']
  }
]

export default function Chatbot() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [suggestions, setSuggestions] = useState(INITIAL_MESSAGES[0].suggestions)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages, isTyping])

  const sendMessage = async (text) => {
    if (!text.trim()) return
    const userMsg = { role: 'user', text: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setSuggestions([])
    setIsTyping(true)

    try {
      const res = await fetch(`${ML_URL}/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim() })
      })
      const data = await res.json()

      // Simulate typing delay
      await new Promise(r => setTimeout(r, 800 + Math.random() * 700))

      const botMsg = {
        role: 'bot',
        text: data.response || "I'm sorry, I couldn't process that request.",
        type: data.type,
        urgency: data.urgency
      }
      setMessages(prev => [...prev, botMsg])
      setSuggestions(data.suggestions || [])
    } catch {
      await new Promise(r => setTimeout(r, 500))
      setMessages(prev => [...prev, {
        role: 'bot',
        text: "⚠️ I'm having trouble connecting to the server. Please make sure the ML backend is running on port 8000.",
        type: 'error'
      }])
    }
    setIsTyping(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  // Simple markdown-like rendering
  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      let processed = line
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/•/g, '&bull;')
      return <p key={i} dangerouslySetInnerHTML={{ __html: processed }}
                style={{ marginBottom: line ? 4 : 8 }} />
    })
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>AI Healthcare Assistant</h1>
        <p>Chat with our AI for symptom analysis, health advice, and medical information</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', height: 'calc(100vh - 200px)' }}>
        <div className="chat-container">
          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {msg.role === 'bot' ? (
                    <Bot size={16} style={{ color: '#818cf8' }} />
                  ) : (
                    <User size={16} />
                  )}
                  <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.7 }}>
                    {msg.role === 'bot' ? 'HealthCare AI' : 'You'}
                  </span>
                  {msg.urgency === 'high' && (
                    <span style={{
                      background: 'rgba(239,68,68,0.2)', color: '#ef4444',
                      padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700
                    }}>URGENT</span>
                  )}
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                  {renderText(msg.text)}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="chat-message bot" style={{ padding: '12px 20px' }}>
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="chat-suggestions">
              <Sparkles size={14} style={{ color: '#818cf8', marginRight: 4 }} />
              {suggestions.map((s, i) => (
                <button key={i} className="chat-suggestion" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="chat-input-area">
            <input className="chat-input" type="text" value={input}
                   onChange={e => setInput(e.target.value)}
                   placeholder="Describe your symptoms or ask a health question..."
                   disabled={isTyping} />
            <button className="btn btn-primary" type="submit"
                    disabled={!input.trim() || isTyping}
                    style={{ borderRadius: 'var(--radius-full)', padding: '10px 16px' }}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
