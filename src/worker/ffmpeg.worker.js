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

import { VieroError } from '@viero/common/error';
import { VieroLog } from '@viero/common/log';
import { merge } from '@viero/common/limit';
import { VieroFFMpegEnvironmentCommon as FFCommon } from '../common';
import FFmpeg from './ffmpeg';

const log = new VieroLog('ffmpeg/worker');

let EMKIT;
let WRAP;

const ensure = () => new Promise((resolve, reject) => {
  if (EMKIT) {
    log.debug('env already initialised');
    resolve();
    return;
  }
  FFmpeg().then((emkit) => {
    EMKIT = emkit;
    WRAP = {
      ffmpeg: { cmd: './ffmpeg', cwrap: EMKIT.cwrap('ffmpeg', 'number', ['number', 'number']) },
    };
    EMKIT.FS.mkdir(FFCommon.pathOf(FFCommon.DIRECTORY.EPHEMERAL));
    const permanent = FFCommon.pathOf(FFCommon.DIRECTORY.PERMANENT);
    EMKIT.FS.mkdir(permanent);
    EMKIT.FS.mount(EMKIT.FS.filesystems.IDBFS, {}, permanent);
    EMKIT.FS.syncfs(true, (err) => {
      if (err) {
        reject(new VieroError('VieroFFMpegWebWorker', 216661, { [VieroError.KEY.ERROR]: err }));
        return;
      }
      log.debug('env initialised');
      setImmediate(() => resolve());
    });
  });
});
const mergedEnsure = () => merge('ffwrapensure', ensure);

const syncfs = () => new Promise((resolve, reject) => EMKIT.FS.syncfs((err) => {
  if (err) {
    reject(new VieroError('VieroFFMpegWebWorker', 219218, { [VieroError.KEY.ERROR]: err }));
    return;
  }
  setImmediate(() => resolve());
}));
const mergedSyncfs = () => merge('ffsyncfs', syncfs);

const str2Ptr = (str) => {
  // eslint-disable-next-line no-underscore-dangle
  const ptr = EMKIT._malloc((str.length + 1) * Uint8Array.BYTES_PER_ELEMENT);
  for (let i = 0; i < str.length; i += 1) {
    EMKIT.setValue(ptr + i, str.charCodeAt(i), 'i8');
  }
  EMKIT.setValue(ptr + str.length, 0, 'i8');
  return ptr;
};

const strList2Ptr = (strList) => {
  // eslint-disable-next-line no-underscore-dangle
  const listPtr = EMKIT._malloc(strList.length * Uint32Array.BYTES_PER_ELEMENT);
  strList.forEach((str, idx) => {
    const strPtr = str2Ptr(str);
    EMKIT.setValue(listPtr + (4 * idx), strPtr, 'i32');
  });
  return listPtr;
};

const load = () => mergedEnsure();

const ffmpeg = (args) => mergedEnsure()
  .then(mergedSyncfs)
  .then(() => new Promise((resolve) => {
    const ffargs = [WRAP.ffmpeg.cmd, '-hide_banner', ...args, '-loglevel', 'trace'];
    log.debug('ffmpeg', ffargs.join(' '));
    let thrown;
    try {
      WRAP.ffmpeg.cwrap(ffargs.length, strList2Ptr(ffargs));
    } catch (fferr) {
      thrown = fferr;
    }
    const { out, err } = EMKIT.printed();
    EMKIT.resetPrinted();
    mergedSyncfs().then(() => resolve({ out, err, thrown }));
  }));

const fpush = (name, buffer) => mergedEnsure()
  .then(() => {
    const stream = EMKIT.FS.open(name, 'a');
    EMKIT.FS.write(stream, buffer, 0, buffer.length);
    EMKIT.FS.close(stream);
    return mergedSyncfs();
  });

const fpull = (name, offset, length) => mergedEnsure()
  .then(() => {
    try {
      if (!offset && !length) {
        return EMKIT.FS.readFile(name);
      }
      const stream = EMKIT.FS.open(name, 'r');
      const uint8 = new Uint8Array(length);
      EMKIT.FS.read(stream, uint8, 0, length, offset);
      EMKIT.FS.close(stream);
      return uint8.buffer;
    } catch (err) {
      return Promise.reject(new VieroError('VieroFFMpegWebWorker', 216661, { [VieroError.KEY.ERROR]: err }));
    }
  });

const file = (name) => mergedEnsure()
  .then(() => ffmpeg(['-i', name]))
  .then(({ err }) => {
    const stat = { name, container: {}, tracks: [] };
    let idx = 0;
    let inInput = false;
    for (; idx < err.length; idx += 1) {
      const line = err[idx];
      if (line.startsWith('Input #0')) {
        stat.container.format = line.match(/Input #0, (.*), from/)[1].split(',');
        inInput = true;
      } else if (inInput) {
        if (line.startsWith(' ')) {
          const trimmed = line.trim();
          if (trimmed.startsWith('Duration: ')) {
            const [hh, mm, ss, mss] = Array
              .from(trimmed.match(/Duration: (\d+):(\d+):(\d+).(\d+)/)).slice(1).map((it) => Number.parseInt(it, 10));
            stat.container.duration = (hh * 60 * 60) + (mm * 60) + ss + (mss / 1000);
          } else if (trimmed.startsWith('Stream #0:')) {
            const lang = trimmed.match(/Stream #0:([0-9]+)\(([a-z]+)\)/)[2];
            const [rawType, codec] = Array.from(trimmed.match(/(Video|Audio): ([a-z0-9]+)/)).slice(1);
            switch (rawType) {
              case 'Audio': {
                stat.tracks.push({ type: 'audio', codec, lang });
                break;
              }
              case 'Video': {
                stat.tracks.push({ type: 'video', codec, lang });
                break;
              }
              default: {
                throw new VieroError('VieroFFMpegWebWorker', 470568);
              }
            }
          }
        } else {
          break;
        }
      }
    }
    return stat;
  });

const rm = (name) => mergedEnsure()
  .then(() => {
    try {
      EMKIT.FS.unlink(name);
    } catch (err) {
      throw new VieroError('VieroFFMpegWebWorker', 543057, { [VieroError.KEY.ERROR]: err });
    }
    return mergedSyncfs();
  });

const ls = () => mergedEnsure()
  .then(() => {
    try {
      const ephemeral = EMKIT.FS.lookupPath('/ephemeral');
      const permanent = EMKIT.FS.lookupPath('/permanent');
      return {
        ephemeral: Object.keys(ephemeral.node.contents),
        permanent: Object.keys(permanent.node.contents),
      };
    } catch (err) {
      throw new VieroError('VieroFFMpegWebWorker', 394403, { [VieroError.KEY.ERROR]: err });
    }
  });

const op = {
  load, fpush, fpull, file, rm, ls, ffmpeg,
};

// eslint-disable-next-line no-restricted-globals
self.addEventListener('message', (evt) => {
  if (!op[evt.data.exec]) {
    // ERROR
  }
  op[evt.data.exec](evt.data).then((res) => postMessage({
    ...res,
    job: evt.data.job,
  })).catch((err) => postMessage({
    err,
    job: evt.data.job,
  }));
});