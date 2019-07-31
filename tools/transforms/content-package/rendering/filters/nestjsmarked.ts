import { RenderNestJSMarkdown } from '../../services';

export function nestjsMarkedNunjucksFilter(renderNestJSMarkdown: RenderNestJSMarkdown) {
  return {
    name: 'nestjsmarked',
    process(str: string) {
      const output = str && renderNestJSMarkdown(str);
      return output;
    }
  };
};
