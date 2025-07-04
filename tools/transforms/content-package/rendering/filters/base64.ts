export function cleanMarkdownNunjucksFilter() {
  return {
    name: 'cleanMarkdown',
    process(str: string) {
      const cleanMarkdown = str
        // Fix relative URLs to absolute URLs for copying
        // Fix image sources: /assets/... → https://docs.nestjs.com/assets/...
        .replace(/src="(\/[^"]+)"/g, 'src="https://docs.nestjs.com$1"')
        // Fix documentation links: [text](/some/path) → [text](https://docs.nestjs.com/some/path)
        .replace(/\]\((\/[^)]+)\)/g, '](https://docs.nestjs.com$1)')
        // Remove custom Angular components for cleaner portable markdown
        .replace(/<app-[^>]*><\/app-[^>]*>/g, '')
        // Convert NestJS-specific syntax to standard markdown
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
        .replace(/\n\s*\n\s*\n/g, '\n\n');

      return Buffer.from(cleanMarkdown).toString('base64');
    },
  };
}
