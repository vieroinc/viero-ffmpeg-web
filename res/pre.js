const __pre = { printed: { out: [], err: [] }, location: null };
Module.locateFile = () => self._WASM_URL;
Module.print = (it) => __pre.printed.out.push(it);
Module.printErr = (it) => __pre.printed.err.push(it);
Module.printed = () => ({ out: Array.from(__pre.printed.out), err: Array.from(__pre.printed.err) });
Module.resetPrinted = () => {
  __pre.printed.out = [];
  __pre.printed.err = [];
};
