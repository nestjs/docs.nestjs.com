import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { Processor } from 'dgeni';
import { Document } from '../../shared';

export class OutputCleanMarkdownProcessor implements Processor {
  $runAfter = ['readFilesProcessor'];
  $runBefore = ['renderDocsProcessor'];

  $process(docs: Document[]) {
    docs.forEach((doc) => {
      if (doc.docType === 'content' && doc.content) {
        // Clean the raw markdown content
        const cleanedMarkdown = this.cleanMarkdown(doc.content);

        // Output to src/assets/content/{id}.md so Angular can serve as assets
        const outputPath = join('src/assets/content', `${doc.id}.md`);

        // Ensure directory exists
        mkdirSync(dirname(outputPath), { recursive: true });

        // Write cleaned markdown file
        writeFileSync(outputPath, cleanedMarkdown, 'utf8');
      }
    });
  }

  private cleanMarkdown(str: string): string {
    return (
      str
        // Fix image sources: /assets/... → https://docs.nestjs.com/assets/...
        .replace(/src="(\/[^"]+)"/g, 'src="https://docs.nestjs.com$1"')
        // Fix documentation links: [text](/some/path) → [text](https://docs.nestjs.com/some/path)
        .replace(/\]\((\/[^)]+)\)/g, '](https://docs.nestjs.com$1)')
        // Remove custom Angular components for cleaner portable markdown
        .replace(/<app-[^>]*><\/app-[^>]*>/g, '')
        // Convert @@filename to comments with .ts extension
        .replace(/@@filename\(([^)]+)\)/g, (match, filename) => {
          // Add .ts extension if filename doesn't already have a proper file extension
          return filename.match(
            /\.(ts|js|json|html|css|scss|yaml|yml|xml|dockerfile|md)$/i,
          )
            ? `// ${filename}`
            : `// ${filename}.ts`;
        })
        // Remove empty filename placeholders
        .replace(/@@filename\(\)/g, '')
        // Split TypeScript/JavaScript versions into separate code blocks
        .replace(
          /@@switch\n?/g,
          '```\n\nJavaScript version:\n\n```javascript\n',
        )
        // Remove any empty lines left by component removal
        .replace(/\n\s*\n\s*\n/g, '\n\n')
    );
  }
}

export function outputCleanMarkdownProcessor() {
  return new OutputCleanMarkdownProcessor();
}
