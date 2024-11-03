import { PuzzleEditor } from 'components/pages/PuzzleEditor';
import { PuzzleEditorStoreProvider } from 'lib/providers/puzzle-editor-provider';

export default async function Page() {
  return (
    <PuzzleEditorStoreProvider>
      <PuzzleEditor />
    </PuzzleEditorStoreProvider>
  );
}
