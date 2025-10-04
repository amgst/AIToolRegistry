import { ToolCard } from '../ToolCard';

export default function ToolCardExample() {
  return (
    <div className="p-6 max-w-sm">
      <ToolCard
        id="1"
        name="ChatGPT"
        shortDescription="Advanced AI assistant for conversations, writing, coding, and creative tasks"
        category="Content AI"
        pricing="Free / $20/mo"
        websiteUrl="https://chat.openai.com"
        badge="Featured"
        rating={4.8}
        onViewDetails={(id) => console.log('View details:', id)}
      />
    </div>
  );
}
