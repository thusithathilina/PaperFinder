import { useState, useRef, useEffect } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

async function queryRAG(question, nChunks = 5) {
    const res = await fetch(`${BASE_URL}/rag/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, n_chunks: nChunks }),
    })
    if (!res.ok) throw new Error('Query failed')
    return res.json()
}

async function fetchRAGStatus() {
    const res = await fetch(`${BASE_URL}/rag/status`)
    if (!res.ok) throw new Error('Status failed')
    return res.json()
}

function SourceBadge({ source }) {
    return (
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 truncate">{source.title}</p>
                <p className="text-xs text-slate-400">{source.venue} · {source.year}</p>
            </div>
            <span className="text-xs font-mono text-indigo-500 flex-shrink-0">
        {(source.score * 100).toFixed(0)}%
      </span>
        </div>
    )
}

function Message({ msg }) {
    if (msg.role === 'user') {
        return (
            <div className="flex justify-end">
                <div className="bg-indigo-600 text-white text-sm rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-lg">
                    {msg.content}
                </div>
            </div>
        )
    }

    return (
        <div className="flex justify-start gap-3">
            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs">🤖</span>
            </div>
            <div className="flex-1 space-y-3 max-w-2xl">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.sources?.length > 0 && (
                    <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                            Sources ({msg.sources.length})
                        </p>
                        {msg.sources.map((s, i) => (
                            <SourceBadge key={i} source={s} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function RAGTab() {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState(null)
    const bottomRef = useRef()

    useEffect(() => {
        fetchRAGStatus().then(setStatus).catch(() => {})
    }, [])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    async function handleSend() {
        if (!input.trim() || loading) return
        const question = input.trim()
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: question }])
        setLoading(true)

        try {
            const result = await queryRAG(question)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: result.answer,
                sources: result.sources,
                chunks_used: result.chunks_used,
            }])
            // Refresh status after query
            fetchRAGStatus().then(setStatus).catch(() => {})
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Something went wrong. Make sure the backend is running and Ollama is serving (`ollama serve`).',
                sources: [],
            }])
        } finally {
            setLoading(false)
        }
    }

    function handleKey(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-10rem)]">

            {/* Header + status */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Ask your papers</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Powered by Llama 3 · answers grounded in your library PDFs
                    </p>
                </div>
                {status && (
                    <div className="text-right">
                        <p className="text-xs font-semibold text-slate-600">
                            {status.total_ingested} paper{status.total_ingested !== 1 ? 's' : ''} ingested
                        </p>
                        <p className="text-xs text-slate-400">
                            {status.total_library - status.total_ingested} without PDF
                        </p>
                    </div>
                )}
            </div>

            {/* Empty state */}
            {status?.total_ingested === 0 && messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3">
                    <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-sm font-medium">No papers ingested yet</p>
                    <p className="text-xs text-center max-w-xs">
                        Go to the <span className="font-semibold text-slate-500">Library</span> tab,
                        fetch or upload PDFs for your papers, and they'll be automatically
                        indexed for Q&A.
                    </p>
                </div>
            )}

            {/* Messages */}
            {messages.length > 0 && (
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
                    {messages.map((msg, i) => (
                        <Message key={i} msg={msg} />
                    ))}
                    {loading && (
                        <div className="flex justify-start gap-3">
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs">🤖</span>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3">
                                <div className="flex gap-1.5 items-center h-5">
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>
            )}

            {/* Input */}
            {(status?.total_ingested > 0 || messages.length > 0) && (
                <div className="flex gap-2 mt-auto">
          <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask a question about your papers… (Enter to send, Shift+Enter for newline)"
              rows={2}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800
                       placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500
                       focus:border-transparent text-sm resize-none shadow-sm"
          />
                    <button
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300
                       text-white font-semibold rounded-xl shadow-sm transition-colors text-sm self-end"
                    >
                        Ask
                    </button>
                </div>
            )}

        </div>
    )
}