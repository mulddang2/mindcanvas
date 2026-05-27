import { InfiniteCanvas } from '@/components/canvas/InfiniteCanvas';
import { AiPromptBar } from '@/components/canvas/AiPromptBar';
import { Toolbar } from '@/components/canvas/Toolbar';
import { ContextMenu } from '@/components/canvas/ContextMenu';

export default function CanvasPage() {
  return (
    <>
      <InfiniteCanvas />
      <AiPromptBar />
      <Toolbar />
      <ContextMenu />
    </>
  );
}
