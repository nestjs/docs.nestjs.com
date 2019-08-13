import { RenderNestJSMarkdown } from '../../services';

export function nestjsMarkedNunjucksTag(renderNestJSMarkdown: RenderNestJSMarkdown) {
  return {
    tags: ['nestjsmarked'],

    /** Disable autoescape for this tag because the markdown tag renders HTML that shouldn't be escaped. */
    autoescape: false,

    parse: function(parser: any, nodes: any) {
      parser.advanceAfterBlockEnd();

      var content = parser.parseUntilBlocks('endmarked');
      var tag = new nodes.CallExtension(this, 'process', null, [content]);
      parser.advanceAfterBlockEnd();

      return tag;
    },

    process(_: any, content: () => string) {
      const contentString = content();
      const markedString = renderNestJSMarkdown(contentString);
      return markedString;
    }
  };
}
