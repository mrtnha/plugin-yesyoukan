// Vendored from the Joplin source repository (Copyright (c) Laurent Cozic,
// MIT licensed - same license as this plugin), from:
// packages/editor/../ProseMirror/utils/sanitizeHtml.ts
//
//

import dompurify = require('dompurify');

const sanitizeHtml = (html: string) => {
	return dompurify.sanitize(html);
};

export default sanitizeHtml;
