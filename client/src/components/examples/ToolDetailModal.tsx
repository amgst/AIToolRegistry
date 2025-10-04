import { useState } from 'react';
import { ToolDetailModal } from '../ToolDetailModal';
import { Button } from '@/components/ui/button';

export default function ToolDetailModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  const mockTool = {
    id: '1',
    name: 'ChatGPT',
    description: 'ChatGPT is an advanced AI language model that can engage in natural conversations, help with writing tasks, answer questions, write code, and assist with creative projects. It uses cutting-edge natural language processing to understand context and provide helpful, accurate responses.',
    category: 'Content AI',
    pricing: 'Free / $20/mo',
    websiteUrl: 'https://chat.openai.com',
    features: [
      'Natural language conversations',
      'Code generation and debugging',
      'Creative writing assistance',
      'Research and analysis',
      'Multi-language support',
      'Context-aware responses'
    ],
    tags: ['Chatbot', 'Writing', 'Coding', 'Research', 'GPT-4']
  };

  return (
    <div className="p-6">
      <Button onClick={() => setIsOpen(true)}>Open Tool Details</Button>
      <ToolDetailModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        tool={mockTool}
      />
    </div>
  );
}
