/**
 * Copyright 2020 Viero, Inc.
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 *
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */

export const FFDIRECTORY = {
  PERMANENT: 'permanent',
  EPHEMERAL: 'ephemeral',
};

export const FFDELIMITER = {
  PATH: '/',
  EXTENSION: '.',
};

export const pathBy = (directory, fileName) => {
  const pathComponents = [];
  switch (directory) {
    case FFDIRECTORY.PERMANENT:
    case FFDIRECTORY.EPHEMERAL: {
      pathComponents.push(directory);
      break;
    }
    default: {
      // nop
    }
  }
  if (fileName) {
    pathComponents.push(fileName);
  }
  const delimiter = FFDELIMITER.PATH;
  return `${delimiter}${pathComponents.join(delimiter)}`;
};

export const directoryOf = (path) => {
  if (path.startsWith('/')) {
    // eslint-disable-next-line no-param-reassign
    path = path.slice(1);
  }
  const split = path.split(FFDELIMITER.PATH);
  if (split.length === 2) {
    switch (split[0]) {
      case FFDIRECTORY.PERMANENT:
      case FFDIRECTORY.EPHEMERAL: {
        return split[0];
      }
      default: {
        // nop
      }
    }
  }
  return null;
};

export const isSupportedPath = (path) => !!directoryOf(path);

export const fileNameOf = (path) => path.split(FFDELIMITER.PATH).pop();

export const encodeMeta = (string) => encodeURIComponent(btoa(string)).split('%').join('-');

export const decodeMeta = (encoded) => atob(decodeURIComponent(encoded.split('-').join('%')));

export const fileNameBy = (meta, extension) => {
  const metaObj = meta || {};
  const modified = Date.now();
  const created = metaObj.created || modified;
  const metaMerged = { ...metaObj, created, modified };
  const encoded = encodeMeta(JSON.stringify(metaMerged));
  const extensionWithDot = extension ? `${FFDELIMITER.EXTENSION}${extension}` : '';
  return `${metaMerged.created}:${metaMerged.modified}:${encoded}${extensionWithDot}`;
};

// EX: static metaFromFileName(fileName) {...
export const metaOf = (something) => {
  const fileNameWithoutPath = something.split(FFDELIMITER.PATH).pop();
  const fileNameWithoutExt = fileNameWithoutPath.split('.')[0];
  const metaEncoded = fileNameWithoutExt.split(':').pop();
  return JSON.parse(decodeMeta(metaEncoded));
};

export const extensionOf = (something) => something.split(FFDELIMITER.EXTENSION).pop();
