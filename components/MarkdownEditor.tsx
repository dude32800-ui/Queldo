'use client'

import { useState, useRef, useEffect } from 'react'
import { Bold, Italic, Underline, Heading1, Heading2, List, Image as ImageIcon, 
         Link as LinkIcon, Code, Type, Smile, Table as TableIcon, Link2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MarkdownEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  fontFamily?: string
  fontSize?: string
}

export default function MarkdownEditor({ 
  content, 
  onChange, 
  placeholder = 'Start writing...',
  fontFamily = 'sans',
  fontSize = 'base'
}: MarkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerText !== content) {
      editorRef.current.innerText = content
    }
  }, [content])

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    updateContent()
  }

  const insertText = (text: string) => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      const textNode = document.createTextNode(text)
      range.insertNode(textNode)
      range.setStartAfter(textNode)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    }
    editorRef.current?.focus()
    updateContent()
  }

  const updateContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerText || editorRef.current.innerHTML)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          const imageUrl = reader.result as string
          insertText(`![Image](${imageUrl})`)
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          const imageUrl = reader.result as string
          insertText(`![Image](${imageUrl})`)
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', 
                  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
                  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👏', '🙌', '👐',
                  '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷',
                  '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟']

  const renderMarkdown = (text: string) => {
    // Split by code blocks first
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = []
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) })
      }
      // Add code block
      parts.push({ type: 'code', content: match[2], language: match[1] || 'text' })
      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) })
    }

    // If no code blocks, process as regular text
    if (parts.length === 0) {
      parts.push({ type: 'text', content: text })
    }

    return parts.map((part, index) => {
      if (part.type === 'code') {
        return (
          <SyntaxHighlighter
            key={index}
            language={part.language}
            style={vscDarkPlus}
            customStyle={{
              borderRadius: '0.5rem',
              padding: '1rem',
              margin: '1rem 0',
              fontSize: '0.875rem',
            }}
          >
            {part.content}
          </SyntaxHighlighter>
        )
      } else {
        let html = part.content
          // Headers
          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
          .replace(/^## (.*$)/gim, '<h2>$1</h2>')
          .replace(/^# (.*$)/gim, '<h1>$1</h1>')
          // Bold
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          // Inline code
          .replace(/`([^`]+)`/g, '<code class="bg-dark-200 px-1.5 py-0.5 rounded text-primary-300">$1</code>')
          // Tables - process line by line
          .split('\n')
          .map((line: string, lineIndex: number, lines: string[]) => {
            if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
              const cells = line.split('|').map(c => c.trim()).filter(c => c && !c.match(/^[-=]+$/))
              const isSeparator = line.match(/^[\s|]*[-=]+[\s|]*$/)
              
              if (isSeparator) {
                return null // Skip separator lines
              }
              
              // Check if previous line was a table row
              const prevLine = lineIndex > 0 ? lines[lineIndex - 1] : ''
              const isFirstRow = !prevLine.trim().startsWith('|') || lineIndex === 0
              
              if (isFirstRow) {
                return `<table class="w-full border-collapse my-4 border border-primary-500/20 rounded-lg overflow-hidden"><thead><tr>${cells.map(cell => `<th class="px-4 py-2 text-left font-semibold text-primary-300 border-b border-primary-500/20">${cell}</th>`).join('')}</tr></thead><tbody>`
              }
              
              return `<tr>${cells.map(cell => `<td class="px-4 py-2 border-b border-primary-500/10">${cell}</td>`).join('')}</tr>`
            }
            
            // Check if we need to close a table
            const nextLine = lineIndex < lines.length - 1 ? lines[lineIndex + 1] : ''
            if (line.trim().startsWith('|') && !nextLine.trim().startsWith('|') && !nextLine.match(/^[\s|]*[-=]+[\s|]*$/)) {
              return line + '</tbody></table>'
            }
            
            return line
          })
          .filter((line: string | null) => line !== null)
          .join('\n')
          // Links with preview
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
            // Check if it's a valid URL
            try {
              new URL(url)
              return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary-400 hover:text-primary-300 underline link-preview" data-url="${url}">${text}</a>`
            } catch {
              return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary-400 hover:text-primary-300 underline">${text}</a>`
            }
          })
          // Images
          .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-4" loading="lazy" />')
          // Lists
          .replace(/^\- (.+)$/gm, '<li>$1</li>')
          .replace(/(<li>.*<\/li>)/s, '<ul class="list-disc list-inside space-y-1">$1</ul>')
          // Line breaks
          .replace(/\n/g, '<br />')
        
        return (
          <div
            key={index}
            className="prose prose-invert max-w-none text-white"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )
      }
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="border-b border-primary-500/20 bg-dark-100/50 backdrop-blur-sm px-4 py-3 flex items-center gap-2 flex-wrap">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r border-primary-500/20 pr-2">
          <button
            onClick={() => executeCommand('bold')}
            className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
            title="Bold"
          >
            <Bold className="w-4 h-4 text-gray-300" />
          </button>
          <button
            onClick={() => executeCommand('italic')}
            className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
            title="Italic"
          >
            <Italic className="w-4 h-4 text-gray-300" />
          </button>
          <button
            onClick={() => executeCommand('underline')}
            className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
            title="Underline"
          >
            <Underline className="w-4 h-4 text-gray-300" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 border-r border-primary-500/20 pr-2">
          <button
            onClick={() => insertText('# ')}
            className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4 text-gray-300" />
          </button>
          <button
            onClick={() => insertText('## ')}
            className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4 text-gray-300" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r border-primary-500/20 pr-2">
          <button
            onClick={() => insertText('- ')}
            className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
            title="Bullet List"
          >
            <List className="w-4 h-4 text-gray-300" />
          </button>
        </div>

        {/* Code & Links */}
        <div className="flex items-center gap-1 border-r border-primary-500/20 pr-2">
          <button
            onClick={() => insertText('`')}
            className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
            title="Code"
          >
            <Code className="w-4 h-4 text-gray-300" />
          </button>
          <button
            onClick={() => insertText('[Link](url)')}
            className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
            title="Link"
          >
            <LinkIcon className="w-4 h-4 text-gray-300" />
          </button>
        </div>

        {/* Table */}
        <div className="flex items-center gap-1 border-r border-primary-500/20 pr-2">
          <button
            onClick={() => insertText('\n| Header 1 | Header 2 | Header 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n| Cell 4   | Cell 5   | Cell 6   |\n')}
            className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
            title="Insert Table"
          >
            <TableIcon className="w-4 h-4 text-gray-300" />
          </button>
        </div>

        {/* Image Upload */}
        <div className="flex items-center gap-1 border-r border-primary-500/20 pr-2">
          <label className="p-2 hover:bg-dark-200 rounded-lg transition-colors cursor-pointer">
            <ImageIcon className="w-4 h-4 text-gray-300" />
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Emoji Picker */}
        <div className="relative border-r border-primary-500/20 pr-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 hover:bg-dark-200 rounded-lg transition-colors"
            title="Emoji"
          >
            <Smile className="w-4 h-4 text-gray-300" />
          </button>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 mt-2 bg-dark-200 border border-primary-500/20 rounded-lg p-3 
                       grid grid-cols-10 gap-1 z-50 max-h-48 overflow-y-auto"
            >
              {emojis.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => {
                    insertText(emoji)
                    setShowEmojiPicker(false)
                  }}
                  className="p-2 hover:bg-dark-300 rounded transition-colors text-xl"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Preview Toggle */}
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="ml-auto px-3 py-1.5 bg-primary-600 hover:bg-primary-700 rounded-lg text-white text-sm transition-colors"
        >
          {showPreview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {/* Editor/Preview Area */}
      <div 
        className="flex-1 flex overflow-hidden"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {showPreview ? (
          <div className="flex-1 overflow-auto p-6">
            {renderMarkdown(content)}
          </div>
        ) : (
          <div className="flex-1 flex">
            {/* Editor */}
            <div className="flex-1 overflow-auto p-6 border-r border-primary-500/20">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={updateContent}
                className="min-h-full w-full bg-dark-100 border border-primary-500/20 rounded-xl p-6 
                         text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 
                         prose prose-invert max-w-none"
                style={{
                  fontFamily: fontFamily === 'sans' ? 'sans-serif' : fontFamily === 'serif' ? 'serif' : 'monospace',
                  fontSize: fontSize === 'sm' ? '0.875rem' :
                            fontSize === 'base' ? '1rem' :
                            fontSize === 'lg' ? '1.125rem' :
                            fontSize === 'xl' ? '1.25rem' : '1.5rem'
                }}
                data-placeholder={placeholder}
              />
            </div>
            {/* Live Preview */}
            <div className="flex-1 overflow-auto p-6 bg-dark-200/30">
              <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Live Preview</div>
              {renderMarkdown(content)}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #6b7280;
          pointer-events: none;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        table th {
          background-color: rgba(139, 92, 246, 0.1);
          font-weight: 600;
        }
        table td, table th {
          padding: 0.5rem 1rem;
          border: 1px solid rgba(139, 92, 246, 0.2);
        }
        table tr:hover {
          background-color: rgba(139, 92, 246, 0.05);
        }
        .link-preview {
          position: relative;
        }
        .link-preview:hover::after {
          content: attr(data-url);
          position: absolute;
          bottom: 100%;
          left: 0;
          background: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          white-space: nowrap;
          z-index: 10;
          margin-bottom: 0.25rem;
        }
      `}</style>
    </div>
  )
}

