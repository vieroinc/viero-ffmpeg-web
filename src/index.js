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

import FFWorker from './worker/ffmpeg.worker';

const ffWorker = new FFWorker();

let seq = -1;

const executeJob = (params) => {
  seq += 1;
  const job = seq;
  return new Promise((resolve) => {
    const listener = (evt) => {
      if (evt.data.job === job) {
        ffWorker.removeEventListener('message', listener);
        // eslint-disable-next-line no-shadow
        const { job, ...rest } = evt.data;
        resolve(rest);
      }
    };
    ffWorker.addEventListener('message', listener);
    ffWorker.postMessage({ ...params, job });
  });
};

/**
 * Simulates a shell kinda environment in the browser with basic file operations and
 * ffmpeg excution.
 */
export class VieroFFMpegEnvironment {
  /**
   * Loads the environment. Might take some time to complete.
   */
  static load() {
    return executeJob({ exec: 'load' }).then((result) => {
      debugger;
    });
  }

  /**
   * Pushes a piece of data into a file in the environment. Subsequent calls to the same
   * filePath appends the buffer to the existing file content.
   * @param {String} filePath the filePath in the environment
   * @param {Buffer} buffer the buffer to push
   */
  static fpush(filePath, buffer) {
    return executeJob({ exec: 'fpush', filePath, buffer }).then((result) => {
      debugger;
    });
  }

  /**
   * Pulls binary content from the file specified considering the offset and the
   * length. Offset defaults to zero and length defaults to the length of the
   * file content.
   * @param {String} filePath the filePath in the environment
   * @param {Number} offset offset in the file content
   * @param {Number} length length of the data returned
   */
  static fpull(filePath, offset, length) {
    return executeJob({
      exec: 'fpull', filePath, offset, length,
    }).then((result) => {
      debugger;
      return result.err || result.buffer;
    });
  }

  /**
   * Returns video metadata on the file specified.
   * @param {*} filePath the filePath in the environment
   */
  static file(filePath) {
    return executeJob({ exec: 'file', filePath }).then((result) => {
      debugger;
      return result;
    });
  }

  /**
   * Removes the file from the environment.
   * @param {*} filePath the filePath in the environment
   */
  static rm(filePath) {
    return executeJob({ exec: 'rm', filePath }).then((result) => {
      debugger;
    });
  }

  /**
   * Returns with a list of files in the environment broken down to
   * ephemeral and permanent.
   */
  static ls() {
    return executeJob({ exec: 'ls' }).then((result) => {
      debugger;
      return result;
    });
  }

  /**
   * Executes FFmpeg with the provided arguments. The stdout and the stderr is provided
   * upon return along with any errors thrown.
   * @param {*} args
   */
  static ffmpeg(args) {
    return executeJob({ exec: 'ffmpeg', args }).then((result) => {
      debugger;
      return result;
    });
  }
}
