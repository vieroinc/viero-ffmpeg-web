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

export class VieroFFMpegEnvironmentCommon {
  static pathOf(directory, name) {
    const pathComponents = [];
    switch (directory) {
      case VieroFFMpegEnvironmentCommon.DIRECTORY.PERMANENT:
      case VieroFFMpegEnvironmentCommon.DIRECTORY.EPHEMERAL: {
        pathComponents.push(`/${directory}`);
        break;
      }
      default: {
        // ERROR
      }
    }
    if (name) {
      if (name.startsWith('/')) {
        // eslint-disable-next-line no-param-reassign
        name = name.slice(1);
      }
      pathComponents.push(`/${name}`);
    }
    return pathComponents.join('');
  }

  static filePathWithMeta(directory, meta) {
    const at = Date.now();
    // eslint-disable-next-line no-param-reassign
    meta = { at, ...(meta || {}) };
    const encoded = this.encodeMeta(JSON.stringify(meta));
    return this.pathOf(directory, `${at}_${encoded}`);
  }

  static metaFromFilePath(path) {
    return JSON.parse(this.decodeMeta(path.split('/').pop().split('_').pop()));
  }

  static encodeMeta(string) {
    return encodeURIComponent(btoa(string)).split('%').join('-');
  }

  static decodeMeta(encoded) {
    return atob(decodeURIComponent(encoded.split('-').join('%')));
  }
}

VieroFFMpegEnvironmentCommon.DIRECTORY = {
  PERMANENT: 'VieroFFMpegEnvironmentCommonDirectoryPermanent',
  EPHEMERAL: 'VieroFFMpegEnvironmentCommonDirectoryEphemeral',
};
