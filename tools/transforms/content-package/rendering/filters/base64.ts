export function base64NunjucksFilter() {
  return {
    name: 'base64',
    process(str: string) {
      // Fix relative URLs to absolute URLs for copying
      const fixedMarkdown = str
        // Fix image sources: /assets/... → https://docs.nestjs.com/assets/...
        .replace(/src="(\/[^"]+)"/g, 'src="https://docs.nestjs.com$1"')
        // Fix documentation links: [text](/some/path) → [text](https://docs.nestjs.com/some/path)
        .replace(/\]\((\/[^)]+)\)/g, '](https://docs.nestjs.com$1)')
        // Remove custom Angular components for cleaner portable markdown
        .replace(/<app-[^>]*><\/app-[^>]*>/g, '')
        // Remove any empty lines left by component removal
        .replace(/\n\s*\n\s*\n/g, '\n\n');

      return Buffer.from(fixedMarkdown).toString('base64');
    },
  };
}
